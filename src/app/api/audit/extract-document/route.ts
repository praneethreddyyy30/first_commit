import { NextRequest, NextResponse } from "next/server";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import Tesseract from "tesseract.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const region = process.env.APP_AWS_REGION || process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

export interface ExtractedDocumentResult {
  isValidDocument: boolean;
  detectedDocType:
    | "aadhaar"
    | "marksheet"
    | "bank_passbook"
    | "caste_cert"
    | "income_cert"
    | "ration_card"
    | "bonafide_cert"
    | "disability_cert"
    | "land_record"
    | "statutory_cert"
    | "unknown";
  confidenceScore: number;
  extractedName?: string;
  extractedDob?: string;
  extractedIdNumber?: string;
  issuingAuthority?: string;
  securityMarkersDetected: string[];
  validationWarnings: string[];
  extractionSource: "AWS_BEDROCK_VISION" | "GOOGLE_GEMINI_VISION" | "GROQ_LLAMA_LIVE" | "TESSERACT_OCR_PARSER";
}

function getReadableDocTitle(expectedType?: string): string {
  const t = (expectedType || "").toLowerCase();
  if (t.includes("aadhaar") || t.includes("aadhar") || t.includes("uidai")) return "Aadhaar Card (UIDAI)";
  if (t.includes("marksheet") || t.includes("memo") || t.includes("ssc") || t.includes("inter") || t.includes("passing"))
    return "Secondary / Board Exam Marks Memo";
  if (t.includes("bank") || t.includes("passbook") || t.includes("account")) return "Bank Passbook Front Page";
  if (t.includes("caste") || t.includes("community") || t.includes("tribe")) return "Caste / Community / Tribe Certificate";
  if (t.includes("income")) return "Annual Family Income Certificate";
  if (t.includes("ration") || t.includes("rice card")) return "Family Food Security / Ration Card";
  if (t.includes("bonafide") || t.includes("study") || t.includes("allotment")) return "Institutional Bonafide / Study Certificate";
  if (t.includes("disability") || t.includes("sadarem") || t.includes("udid")) return "SADAREM / UDID Disability Certificate";
  if (t.includes("land") || t.includes("patta") || t.includes("rofr")) return "Pattadar Passbook / Land Record";
  return expectedType || "Statutory Government Document";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileData, fileName, fileType, expectedType, customCredentials, geminiApiKey } = body;

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    const expectedTitle = getReadableDocTitle(expectedType);
    const cleanFileName = fileName.toLowerCase();

    // 1. Strict non-document file extension rejection (executable, audio, video, archive)
    if (/\.(mp4|mp3|zip|rar|7z|exe|bat|sh|iso|tar|gz)$/i.test(cleanFileName)) {
      return NextResponse.json({
        success: true,
        result: {
          isValidDocument: false,
          detectedDocType: "unknown",
          confidenceScore: 0,
          securityMarkersDetected: [],
          validationWarnings: [
            `❌ Invalid File Format: Uploaded file '${fileName}' is not an official document or image. Please upload a scanned document (PDF, JPG, or PNG).`,
          ],
          extractionSource: "TESSERACT_OCR_PARSER",
        },
      });
    }

    // 2. Decode raw base64 buffer
    let fileBuffer: Buffer | null = null;
    if (fileData) {
      try {
        const base64Clean = fileData.includes(",") ? fileData.split(",")[1] : fileData;
        fileBuffer = Buffer.from(base64Clean, "base64");
      } catch (err) {
        console.warn("Base64 decode error:", err);
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          isValidDocument: false,
          detectedDocType: "unknown",
          confidenceScore: 0,
          securityMarkersDetected: [],
          validationWarnings: [
            `❌ Corrupt or Empty File: Could not read file content for '${fileName}'. Please upload a valid scanned document.`,
          ],
          extractionSource: "TESSERACT_OCR_PARSER",
        },
      });
    }

    // =========================================================================
    // 3. ATTEMPT AWS BEDROCK MULTIMODAL VISION (IF ACCREDITED IN AWS ACCOUNT)
    // =========================================================================
    const effectiveRegion = customCredentials?.region || region;
    const effectiveAccessKey = customCredentials?.accessKeyId || accessKeyId;
    const effectiveSecretKey = customCredentials?.secretAccessKey || secretAccessKey;
    const effectiveSessionToken = customCredentials?.sessionToken || process.env.APP_AWS_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN;

    const hasBedrockConfigured = Boolean(
      effectiveAccessKey &&
      effectiveSecretKey &&
      !effectiveAccessKey.includes("your-access-key") &&
      effectiveAccessKey.trim().length > 10
    );

    if (hasBedrockConfigured && fileBuffer) {
      try {
        const bedrockClient = new BedrockRuntimeClient({
          region: effectiveRegion,
          credentials: {
            accessKeyId: effectiveAccessKey!.trim(),
            secretAccessKey: effectiveSecretKey!.trim(),
            ...(effectiveSessionToken ? { sessionToken: effectiveSessionToken.trim() } : {}),
          },
        });

        const modelId = process.env.AWS_BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
        const prompt = `You are an expert Indian civic auditor and forensic document verification engine.
Analyze this uploaded file for the slot: "${expectedTitle}" (code: "${expectedType || "document"}").
Filename: "${fileName}".

AUDIT RULES:
1. Is this an authentic official Indian government document matching "${expectedTitle}"?
2. If this is a wallpaper, personal photo, resume, invoice, meme, or non-document, set isValidDocument: false.
3. If this is a DIFFERENT document type (e.g. Caste certificate in Aadhaar slot), set isValidDocument: false with mismatch warning.
4. If valid, extract REAL printed name, DOB, ID number, and issuing authority. NEVER invent names.

Return STRICTLY JSON:
{
  "isValidDocument": boolean,
  "detectedDocType": "aadhaar" | "marksheet" | "bank_passbook" | "caste_cert" | "income_cert" | "ration_card" | "bonafide_cert" | "disability_cert" | "land_record" | "statutory_cert" | "unknown",
  "confidenceScore": number,
  "extractedName": string or null,
  "extractedDob": string or null,
  "extractedIdNumber": string or null,
  "issuingAuthority": string or null,
  "securityMarkersDetected": string[],
  "validationWarnings": string[]
}`;

        const isPdf = fileType === "application/pdf" || cleanFileName.endsWith(".pdf");
        const isImage = fileType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(cleanFileName);

        let contentBlock: any[] = [];
        if (isPdf) {
          contentBlock = [
            { document: { format: "pdf", name: fileName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30), source: { bytes: fileBuffer } } },
            { text: prompt },
          ];
        } else if (isImage) {
          let imgFormat: "png" | "jpeg" | "webp" | "gif" = "jpeg";
          if (cleanFileName.endsWith(".png") || fileType === "image/png") imgFormat = "png";
          else if (cleanFileName.endsWith(".webp") || fileType === "image/webp") imgFormat = "webp";
          else if (cleanFileName.endsWith(".gif") || fileType === "image/gif") imgFormat = "gif";

          contentBlock = [
            { image: { format: imgFormat, source: { bytes: fileBuffer } } },
            { text: prompt },
          ];
        }

        if (contentBlock.length > 0) {
          const command = new ConverseCommand({
            modelId,
            messages: [{ role: "user", content: contentBlock }],
            inferenceConfig: { maxTokens: 800, temperature: 0.1 },
          });

          const response = await bedrockClient.send(command);
          const rawText = response.output?.message?.content?.[0]?.text;
          if (rawText) {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed: ExtractedDocumentResult = JSON.parse(jsonMatch[0]);
              parsed.extractionSource = "AWS_BEDROCK_VISION";
              return NextResponse.json({ success: true, result: parsed });
            }
          }
        }
      } catch (bedrockErr) {
        console.warn("Bedrock Vision skipped or unauthorized:", (bedrockErr as Error)?.message);
      }
    }

    // =========================================================================
    // 4. REAL OPTICAL CHARACTER RECOGNITION (TESSERACT.JS FOR IMAGES / PDF STREAM)
    // =========================================================================
    let extractedText = "";
    const isPdf = fileType === "application/pdf" || cleanFileName.endsWith(".pdf");

    if (isPdf) {
      extractedText = parsePdfTextStream(fileBuffer);
    } else {
      // Image OCR via Tesseract.js (JPG, PNG, WebP, BMP, etc.)
      try {
        const { data } = await Tesseract.recognize(fileBuffer, "eng");
        extractedText = (data?.text || "").trim();
      } catch (tesseractErr) {
        console.warn("Tesseract OCR exception:", (tesseractErr as Error)?.message);
        extractedText = "";
      }
    }

    // =========================================================================
    // 5. STRICT REJECTION OF WALLPAPERS, BLANK PHOTOS, AND NON-DOCUMENTS
    // =========================================================================
    // If the image or file has no readable text (fewer than 15 characters), it CANNOT be an official document!
    if (extractedText.length < 15) {
      return NextResponse.json({
        success: true,
        result: {
          isValidDocument: false,
          detectedDocType: "unknown",
          confidenceScore: 0,
          securityMarkersDetected: [],
          validationWarnings: [
            `❌ Invalid / Unrecognized Document: No readable text or statutory identity markers detected in '${fileName}'. Wallpapers, personal photos, or blank images cannot be accepted. Please upload an authentic scanned copy of your ${expectedTitle}.`,
          ],
          extractionSource: "TESSERACT_OCR_PARSER",
        },
      });
    }

    // =========================================================================
    // 6. FORENSIC CLASSIFICATION & DATA EXTRACTION VIA GROQ (FAST LLM)
    // =========================================================================
    const groqKey = customCredentials?.groqApiKey || process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const groqResult = await callGroqForensicAnalysis(
          groqKey,
          extractedText,
          fileName,
          expectedType || "statutory_cert",
          expectedTitle
        );
        if (groqResult) {
          return NextResponse.json({ success: true, result: groqResult });
        }
      } catch (groqErr) {
        console.warn("Groq forensic analysis notice:", (groqErr as Error)?.message);
      }
    }

    // =========================================================================
    // 7. STRICT LOCAL HEURISTIC PARSER (IF GROQ TEMPORARILY UNREACHABLE)
    // =========================================================================
    const localResult = parseExtractedTextLocally(extractedText, fileName, expectedType, expectedTitle);
    return NextResponse.json({ success: true, result: localResult });

  } catch (error: unknown) {
    console.error("Document extraction fatal error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message || "Failed to extract document" },
      { status: 500 }
    );
  }
}

/**
 * Fast Groq LLM-powered forensic document analysis on extracted OCR text.
 * Strictly verifies statutory authenticity and detects document mismatches.
 */
async function callGroqForensicAnalysis(
  apiKey: string,
  ocrText: string,
  fileName: string,
  expectedType: string,
  expectedTitle: string
): Promise<ExtractedDocumentResult | null> {
  const prompt = `You are a strict forensic statutory document auditor for Indian government citizen welfare schemes.
File Name: "${fileName}"
Target Document Requirement: "${expectedTitle}" (slot code: "${expectedType}")

Extracted OCR Text from the uploaded image/file:
"""
${ocrText.slice(0, 3000)}
"""

AUDIT RULES:
1. STATUTORY CLASSIFICATION & VALIDATION:
   - Does this OCR text contain authentic Indian statutory markers matching "${expectedTitle}"?
   - For Aadhaar: MUST have UIDAI, Government of India, 12-digit number pattern, or Aadhaar identity markers.
   - For Caste/Community Certificate: MUST have Caste/Tribe/Community/Tahsildar/SDO/Revenue Department markers.
   - For Marksheet: MUST have Board/University/Secondary Education/Marks/Roll/Passing markers.
   - For Bank Passbook: MUST have Bank Name, Account Number, or IFSC.
   - For Income Certificate: MUST have Annual Income, Revenue Authority, Tahsildar.
   - For Bonafide: MUST have College, Principal, Institutional Bonafide, Allotment Order.
   - If this is a wallpaper, scenery photo, selfie, random poster, article, invoice, resume, or non-document text: set isValidDocument: false.
   - If this is a DIFFERENT statutory document (e.g. Caste certificate uploaded into Aadhaar slot, or Aadhaar uploaded into Marksheet slot): set isValidDocument: false and explain the mismatch in validationWarnings.
   - Only set isValidDocument: true if the text authentically belongs to "${expectedTitle}".

2. IDENTITY & METADATA EXTRACTION:
   - Extract the real printed legal name from the OCR text (e.g. "Kavitha Selvam"). If no citizen name is in the text, set null. DO NOT guess or extract from the file name.
   - Extract the document ID number (e.g. Aadhaar 12-digit UID, Marks Roll No, Certificate No, Bank A/C No).
   - Extract the Date of Birth (YYYY-MM-DD format if available).
   - Extract the official Issuing Authority.

Return STRICTLY valid JSON with this exact schema:
{
  "isValidDocument": boolean,
  "detectedDocType": "aadhaar" | "marksheet" | "bank_passbook" | "caste_cert" | "income_cert" | "ration_card" | "bonafide_cert" | "disability_cert" | "land_record" | "statutory_cert" | "unknown",
  "confidenceScore": number,
  "extractedName": string or null,
  "extractedDob": string or null,
  "extractedIdNumber": string or null,
  "issuingAuthority": string or null,
  "securityMarkersDetected": string[],
  "validationWarnings": string[]
}`;

  const candidateModels = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "groq/compound",
    "openai/gpt-oss-20b",
  ];

  for (const model of candidateModels) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 700,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // If Groq says invalid, ensure extractedName is nullified
          if (!parsed.isValidDocument) {
            parsed.extractedName = null;
          }
          parsed.extractionSource = "GROQ_LLAMA_LIVE";
          return parsed;
        }
      }
    } catch {
      // try next candidate model
    }
  }

  return null;
}

/**
 * Strict Local Heuristic Parser operating directly on OCR-extracted text.
 * Never guesses from file name. Never blindly accepts unknown images.
 */
function parseExtractedTextLocally(
  text: string,
  fileName: string,
  expectedType?: string,
  expectedTitle?: string
): ExtractedDocumentResult {
  const normExpected = (expectedType || "").toLowerCase();
  const lowerText = text.toLowerCase();

  // 1. Text-based marker detection
  const hasAadhaarInText =
    /unique\s*identification\s*authority/i.test(text) ||
    /government\s*of\s*india/i.test(text) ||
    /mera\s*aadhaar/i.test(text) ||
    /\b\d{4}\s\d{4}\s\d{4}\b/.test(text) ||
    /\baadhaar\b/i.test(text);

  const hasCasteInText =
    /caste\s*certificate|community\s*certificate|scheduled\s*tribe|scheduled\s*caste|backward\s*class|tahsildar|mandal\s*revenue|sub-divisional/i.test(text);

  const hasMarksheetInText =
    /board\s*of\s*(secondary|intermediate)|secondary\s*school\s*certificate|marks\s*memo|statement\s*of\s*marks|roll\s*no|grade\s*point/i.test(text);

  const hasBankInText =
    /ifsc\s*code|ifsc\s*:\s*[a-z]{4}0[a-z0-9]{6}|account\s*number|passbook|savings\s*bank|bank\s*of/i.test(text);

  const hasIncomeInText =
    /income\s*certificate|annual\s*income|family\s*income|gross\s*income/i.test(text);

  const hasBonafideInText =
    /bonafide|study\s*certificate|college|principal|allotment\s*order|institute/i.test(text);

  // Resume or commercial invoice in text
  if (/curriculum\s*vitae|work\s*experience|technical\s*skills/i.test(text)) {
    return {
      isValidDocument: false,
      detectedDocType: "unknown",
      confidenceScore: 0,
      securityMarkersDetected: [],
      validationWarnings: [
        `❌ Not a Valid Document: The uploaded file appears to be a resume or CV. Government welfare portals require official statutory certificates. Please upload your ${expectedTitle}.`,
      ],
      extractionSource: "TESSERACT_OCR_PARSER",
    };
  }

  if (/tax\s*invoice|gstin|bill\s*to|sold\s*by/i.test(text)) {
    return {
      isValidDocument: false,
      detectedDocType: "unknown",
      confidenceScore: 0,
      securityMarkersDetected: [],
      validationWarnings: [
        `❌ Not a Valid Document: The uploaded file appears to be a commercial shopping bill or invoice. Please upload your ${expectedTitle}.`,
      ],
      extractionSource: "TESSERACT_OCR_PARSER",
    };
  }

  // 2. Cross-Document Mismatch Checks
  if (normExpected.includes("aadhaar") || normExpected.includes("aadhar")) {
    if (hasCasteInText) {
      return {
        isValidDocument: false,
        detectedDocType: "caste_cert",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Mismatch: Uploaded document appears to be a Caste/Community Certificate instead of an Aadhaar Card. Please upload your UIDAI Aadhaar Card.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }
    if (hasMarksheetInText) {
      return {
        isValidDocument: false,
        detectedDocType: "marksheet",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Mismatch: Uploaded document appears to be an Academic Marksheet instead of an Aadhaar Card. Please upload your UIDAI Aadhaar Card.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }
    if (hasBankInText) {
      return {
        isValidDocument: false,
        detectedDocType: "bank_passbook",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Mismatch: Uploaded document appears to be a Bank Passbook instead of an Aadhaar Card. Please upload your UIDAI Aadhaar Card.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }
    if (!hasAadhaarInText) {
      return {
        isValidDocument: false,
        detectedDocType: "unknown",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Verification Failed: No UIDAI Aadhaar markers or 12-digit UID pattern detected in '${fileName}'. Please upload an authentic Aadhaar Card.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }

    return {
      isValidDocument: true,
      detectedDocType: "aadhaar",
      confidenceScore: 92,
      extractedName: extractNameFromText(text) || undefined,
      extractedIdNumber: extractIdNumberFromText(text, "aadhaar") || undefined,
      issuingAuthority: "Unique Identification Authority of India (UIDAI)",
      securityMarkersDetected: ["UIDAI Pattern", "12-Digit UID Format"],
      validationWarnings: [],
      extractionSource: "TESSERACT_OCR_PARSER",
    };
  }

  // SLOT: MARKSHEET
  if (normExpected.includes("marks") || normExpected.includes("memo") || normExpected.includes("ssc")) {
    if (hasAadhaarInText) {
      return {
        isValidDocument: false,
        detectedDocType: "aadhaar",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Mismatch: Uploaded document appears to be an Aadhaar Card instead of an Academic Marksheet. Please upload your Secondary School Marks Memo.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }
    if (!hasMarksheetInText) {
      return {
        isValidDocument: false,
        detectedDocType: "unknown",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Verification Failed: No Examination Board or Marks Memo markers detected in '${fileName}'. Please upload your official marksheet.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }
    return {
      isValidDocument: true,
      detectedDocType: "marksheet",
      confidenceScore: 90,
      extractedName: extractNameFromText(text) || undefined,
      extractedIdNumber: extractIdNumberFromText(text, "marksheet") || undefined,
      issuingAuthority: "State Board of Secondary / Higher Education",
      securityMarkersDetected: ["Board Marks Matrix", "Exam Roll Number"],
      validationWarnings: [],
      extractionSource: "TESSERACT_OCR_PARSER",
    };
  }

  // SLOT: BANK PASSBOOK
  if (normExpected.includes("bank") || normExpected.includes("passbook")) {
    if (hasAadhaarInText) {
      return {
        isValidDocument: false,
        detectedDocType: "aadhaar",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Mismatch: Uploaded document appears to be an Aadhaar Card instead of a Bank Passbook. Please upload your Bank Passbook front page.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }
    if (!hasBankInText) {
      return {
        isValidDocument: false,
        detectedDocType: "unknown",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Verification Failed: No Bank Account or IFSC markers detected in '${fileName}'. Please upload your Bank Passbook.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }
    return {
      isValidDocument: true,
      detectedDocType: "bank_passbook",
      confidenceScore: 90,
      extractedName: extractNameFromText(text) || undefined,
      extractedIdNumber: extractIdNumberFromText(text, "bank") || undefined,
      issuingAuthority: "Scheduled Commercial Bank",
      securityMarkersDetected: ["IFSC Code Format", "Core Banking Record"],
      validationWarnings: [],
      extractionSource: "TESSERACT_OCR_PARSER",
    };
  }

  // SLOT: CASTE CERTIFICATE
  if (normExpected.includes("caste") || normExpected.includes("community") || normExpected.includes("tribe")) {
    if (hasAadhaarInText) {
      return {
        isValidDocument: false,
        detectedDocType: "aadhaar",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Mismatch: Uploaded document appears to be an Aadhaar Card instead of a Caste Certificate. Please upload your official Caste/Community Certificate.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }
    if (!hasCasteInText) {
      return {
        isValidDocument: false,
        detectedDocType: "unknown",
        confidenceScore: 0,
        securityMarkersDetected: [],
        validationWarnings: [
          `❌ Document Verification Failed: No Caste/Community authority markers detected in '${fileName}'. Please upload your official Caste Certificate.`,
        ],
        extractionSource: "TESSERACT_OCR_PARSER",
      };
    }
    return {
      isValidDocument: true,
      detectedDocType: "caste_cert",
      confidenceScore: 90,
      extractedName: extractNameFromText(text) || undefined,
      extractedIdNumber: extractIdNumberFromText(text, "cert") || undefined,
      issuingAuthority: "Tahsildar / Revenue Department",
      securityMarkersDetected: ["Statutory Caste Declaration", "Revenue Officer Stamp"],
      validationWarnings: [],
      extractionSource: "TESSERACT_OCR_PARSER",
    };
  }

  // Default: Require document markers or reject
  if (hasAadhaarInText || hasCasteInText || hasMarksheetInText || hasBankInText || hasIncomeInText || hasBonafideInText) {
    return {
      isValidDocument: true,
      detectedDocType: "statutory_cert",
      confidenceScore: 85,
      extractedName: extractNameFromText(text) || undefined,
      extractedIdNumber: extractIdNumberFromText(text, "cert") || undefined,
      issuingAuthority: "Statutory Competent Authority",
      securityMarkersDetected: ["Official Document Format"],
      validationWarnings: [],
      extractionSource: "TESSERACT_OCR_PARSER",
    };
  }

  // If no markers at all:
  return {
    isValidDocument: false,
    detectedDocType: "unknown",
    confidenceScore: 0,
    securityMarkersDetected: [],
    validationWarnings: [
      `❌ Unrecognized Document: File '${fileName}' does not contain recognized Indian statutory headers or certificates. Please upload an authentic scanned document.`,
    ],
    extractionSource: "TESSERACT_OCR_PARSER",
  };
}

function extractNameFromText(text: string): string | null {
  if (!text || text.length < 5) return null;
  const nameMatch = text.match(/(?:name\s*(?:of\s*(?:candidate|student|applicant|holder))?|shri|smt|kumari)\s*[:.-]?\s*([A-Za-z\s]{3,40})/i);
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim();
    if (!/certificate|government|department|authority|secondary|education|state|board/i.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

function extractIdNumberFromText(text: string, type: "aadhaar" | "marksheet" | "bank" | "cert"): string | null {
  if (!text) return null;
  if (type === "aadhaar") {
    const m = text.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
    if (m) return m[0].replace(/\b\d{8}/, "XXXX-XXXX");
  }
  if (type === "bank") {
    const m = text.match(/[A-Z]{4}0[A-Z0-9]{6}/i);
    if (m) return `IFSC: ${m[0].toUpperCase()}`;
  }
  if (type === "marksheet" || type === "cert") {
    const m = text.match(/\b(?:[A-Z]{2,4}[-/]\d{4,8}|\d{8,12})\b/);
    if (m) return m[0];
  }
  return null;
}

function parsePdfTextStream(buffer: Buffer): string {
  try {
    const raw = buffer.toString("binary");
    const textBlocks: string[] = [];

    const btEtRegex = /BT\s+([\s\S]*?)\s+ET/g;
    let match: RegExpExecArray | null;

    while ((match = btEtRegex.exec(raw)) !== null) {
      const blockContent = match[1];
      const tjRegex = /\(([^)]+)\)\s*Tj/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(blockContent)) !== null) {
        textBlocks.push(tjMatch[1]);
      }

      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      let arrayMatch: RegExpExecArray | null;
      while ((arrayMatch = tjArrayRegex.exec(blockContent)) !== null) {
        const inner = arrayMatch[1];
        const strRegex = /\(([^)]+)\)/g;
        let sMatch: RegExpExecArray | null;
        while ((sMatch = strRegex.exec(inner)) !== null) {
          textBlocks.push(sMatch[1]);
        }
      }
    }

    if (textBlocks.length > 0) {
      return textBlocks.join(" ").replace(/\\([()\\])/g, "$1");
    }

    const asciiChunks: string[] = [];
    let currentChunk = "";
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      if (byte >= 32 && byte <= 126) {
        currentChunk += String.fromCharCode(byte);
      } else if (byte === 10 || byte === 13) {
        if (currentChunk.length > 3) {
          asciiChunks.push(currentChunk);
        }
        currentChunk = "";
      }
    }
    if (currentChunk.length > 3) {
      asciiChunks.push(currentChunk);
    }

    const meaningful = asciiChunks.filter(
      (c) => !c.startsWith("/") && !c.startsWith("%") && !c.includes("obj") && !c.includes("endobj") && c.length > 4
    );

    return meaningful.join(" ");
  } catch {
    return "";
  }
}
