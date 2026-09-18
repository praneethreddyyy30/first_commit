import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { SCHEMES_DATABASE, SchemeOrService } from "@/data/schemes";
import { evaluateCedarPolicies, UserProfile, CedarEvaluationResult } from "@/lib/cedar/evaluator";
import { DEMO_PERSONAS } from "@/data/demoPersonas";
import { DocumentAuditResult, DocumentAuditInput } from "@/lib/audit/documentAuditor";
import { globalSchemeRegistry } from "@/lib/schemes/schemeRegistry";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface BedrockResponse {
  answer: string;
  source: "AWS_BEDROCK_LIVE" | "ZERO_FAIL_CIVIC_RAG";
  modelUsed: string;
  relevantSchemes?: string[];
  suggestedQuestions?: string[];
}

export interface AwsCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  sessionToken?: string;
}

export interface CopilotContext {
  profile?: UserProfile;
  evaluationResults?: CedarEvaluationResult[];
  targetSchemeId?: string;
  auditResult?: DocumentAuditResult;
  auditInput?: DocumentAuditInput;
}

/**
 * Amazon Bedrock Client Wrapper with Zero-Fail Civic Knowledge Fallback
 */
export async function askJanSetuCopilot(
  userQuery: string,
  history: ChatMessage[] = [],
  language: "en" | "hi" | "te" | "or" = "en",
  customCredentials?: AwsCredentials,
  context?: CopilotContext
): Promise<BedrockResponse> {
  const awsRegion = customCredentials?.region || process.env.AWS_REGION || "us-east-1";
  const accessKeyId = customCredentials?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = customCredentials?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = customCredentials?.sessionToken || process.env.AWS_SESSION_TOKEN;
  const modelId = process.env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0";

  // Resolve user profile & policy evaluation context
  const effectiveProfile: UserProfile = context?.profile || DEMO_PERSONAS[0].profile;
  const effectiveEvalResults: CedarEvaluationResult[] =
    context?.evaluationResults && context.evaluationResults.length > 0
      ? context.evaluationResults
      : evaluateCedarPolicies(effectiveProfile, globalSchemeRegistry.getAllSchemes());

  const eligibleResults = effectiveEvalResults.filter((r) => r.decision === "ALLOW");
  const deniedResults = effectiveEvalResults.filter((r) => r.decision === "DENY");
  const currentTargetId = context?.targetSchemeId || "TN_Pudhumai_Penn";
  const currentTargetScheme =
    globalSchemeRegistry.getSchemeById(currentTargetId) ||
    SCHEMES_DATABASE.find((s) => s.id === currentTargetId) ||
    SCHEMES_DATABASE[0];

  // Check if real AWS Bedrock credentials exist and are configured
  if (
    accessKeyId &&
    secretAccessKey &&
    !accessKeyId.includes("your-access-key") &&
    accessKeyId.trim().length > 10 &&
    secretAccessKey.trim().length > 10
  ) {
    try {
      const client = new BedrockRuntimeClient({
        region: awsRegion,
        credentials: {
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
          ...(sessionToken ? { sessionToken: sessionToken.trim() } : {}),
        },
      });

      const systemPrompt = `You are JanSetu AI, an expert Indian Civic & Student Scholarship Copilot built for the WeMakeDevs AWS First Commit Hackathon.
You provide accurate, empathetic, conversational, and step-by-step guidance on scholarships, certificates, and government benefits for Indian students (ST, SC, OBC, EWS, General).

Active Citizen Profile Context:
- Name: ${effectiveProfile.name || "Kavitha Selvam"}
- State of Residence: ${effectiveProfile.state}
- Category: ${effectiveProfile.category} (Community: ${effectiveProfile.tnCommunity || effectiveProfile.apCommunity || "General"})
- Annual Family Income: ₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}
- Education Stage: ${effectiveProfile.educationLevel} (${effectiveProfile.courseType})
- Gender: ${effectiveProfile.gender}
- Currently Selected Target Scheme: ${currentTargetScheme.title} (${currentTargetScheme.shortCode})

Cedar Policy Deterministic Evaluation for this Profile:
- ELIGIBLE SCHEMES (${eligibleResults.length}): ${eligibleResults.map((r) => `${r.scheme.title} (Benefit: ${r.estimatedBenefit})`).join("; ")}
- NON-ELIGIBLE SCHEMES (${deniedResults.length}): ${deniedResults.map((r) => `${r.scheme.shortCode} (Reason: ${r.failedReasons.join(", ")})`).join("; ")}

Pre-Flight Document Audit Status:
- Document Readiness Score: ${context?.auditResult?.overallReadinessScore ?? 100}/100
- Name Match on Aadhaar vs 10th Marksheet: ${context?.auditResult?.nameMatchPercentage ?? 100}% ("${context?.auditInput?.nameOnAadhaar || effectiveProfile.name || ''}" vs "${context?.auditInput?.nameOnMarksheet || effectiveProfile.name || ''}")
- Bank NPCI DBT Seeding: ${context?.auditResult?.npciStatus || "SEEDED"}
- Held Certificates: ${effectiveProfile.heldDocuments?.join(", ") || "None specified"}

Rules:
- Answer naturally in a friendly, helpful conversational tone.
- When the user asks "which schemes am I eligible for" or "available schemes", list their exact eligible schemes above.
- When the user asks about their document audit, name match, or NPCI status, cite their real-time document audit status above.
- When the user asks "what schemes are non-eligible" or "why am I rejected", explain the exact Cedar policy denial reasons above.
- When the user asks about requirements or documents for a scheme, list the specific mandatory documents and prerequisites.
- When the user asks "how can I do it" or "how to apply", provide the clear 5-step roadmap.
- Emphasize the difference between Aadhaar Linking and NPCI Aadhaar DBT Seeding.
- Remind users of statutory fees (₹0 for scholarships, ₹25-30 for certificates at CSCs).
- Answer in ${language === "hi" ? "simple spoken Hindi (Hinglish/Devanagari)" : "clear, encouraging English"}.
Knowledge base context:
${JSON.stringify(SCHEMES_DATABASE.map(s => ({
  id: s.id,
  title: s.title,
  maxIncome: s.maxIncome,
  categories: s.targetCategories,
  stages: s.educationStages,
  benefit: s.benefitAmount,
  portal: s.portalName,
  deadline: s.deadline
})))}
`;

      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          ...history.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userQuery }
        ]
      };

      const command = new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload)
      });

      const response = await client.send(command);
      const decoded = new TextDecoder().decode(response.body);
      const json = JSON.parse(decoded);
      const answer = json.content?.[0]?.text || "Response generated successfully.";

      return {
        answer,
        source: "AWS_BEDROCK_LIVE",
        modelUsed: modelId
      };
    } catch (err: unknown) {
      console.warn("AWS Bedrock live invocation failed or fell back: ", (err as Error)?.message);
      // Seamlessly fall through to deterministic Civic RAG engine
    }
  }

  // ============================================================================
  // 2. ZERO-FAIL CIVIC RAG ENGINE (OFFLINE / LOCALSTACK / ZERO-KEY MODE)
  // Provides instant, personalized responses based on loaded profile & gazettes
  // NO API KEY REQUIRED - 100% Free & Deterministic
  // ============================================================================
  const queryLower = userQuery.toLowerCase().trim();
  let answer = "";
  const matchedSchemes: string[] = [];

  // A. GREETINGS & CASUAL CONVERSATION ("hi", "hello", "hey", "who are you", etc.)
  const isGreeting =
    /^(hi|hello|hey|heya|hlo|greetings|namaste|vanakkam|good\s*(morning|afternoon|evening)|howdy|sup|who\s*are\s*you)(\s|[!?,.]|$)/i.test(
      queryLower
    ) ||
    queryLower === "hi" ||
    queryLower === "hello" ||
    queryLower === "hey" ||
    queryLower === "namaste" ||
    queryLower === "vanakkam";

  if (isGreeting) {
    answer =
      language === "hi"
        ? `नमस्ते **${effectiveProfile.name || "छात्र"}**! 👋 मैं आपका **जनसेतु एआई (JanSetu AI) नागरिक सहायक** हूँ।

वर्तमान में आपकी प्रोफ़ाइल **${effectiveProfile.state}** राज्य, **${effectiveProfile.category} श्रेणी**, और वार्षिक आय **₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}** पर सेट है। 

आप वर्तमान में **${eligibleResults.length} सरकारी योजनाओं** के लिए पूरी तरह पात्र (Eligible) हैं! 🎯

आप मुझसे बेझिझक ये सवाल पूछ सकते हैं:
• **"मैं किन योजनाओं के लिए पात्र हूँ?"** (Eligible Schemes)
• **"मेरे लिए कौन सी योजनाएं अपात्र (Non-eligible) हैं और क्यों?"**
• **"इस योजना के लिए क्या आवश्यकताएं (Requirements) हैं?"**
• **"आवेदन करने के लिए कौन-कौन से दस्तावेज आवश्यक हैं?"**
• **"मैं आवेदन कैसे करूँ (How can I do it)?"**`
        : `Hello **${effectiveProfile.name || "Citizen"}**! 👋 I am your **JanSetu AI Civic Copilot**.

I can see your active profile is loaded as a **${effectiveProfile.category}** student from **${effectiveProfile.state}** with an annual family income of **₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}**.

Based on AWS Cedar deterministic policies, you are currently **100% ELIGIBLE for ${eligibleResults.length} government schemes**! 🎯

Here are queries you can ask me right now:
• **"What are the eligible schemes I am eligible for?"**
• **"What are the non-eligible schemes for me?"**
• **"What are the requirements for ${currentTargetScheme.shortCode}?"**
• **"What are the documents required for this particular scheme?"**
• **"How can I do it / apply step-by-step?"**`;
  }

  // B. NON-ELIGIBLE / INELIGIBLE SCHEMES ("what are the non-eligible schemes for me", "why not eligible", etc.)
  else if (
    queryLower.includes("not eligible") ||
    queryLower.includes("non-eligible") ||
    queryLower.includes("non eligible") ||
    queryLower.includes("ineligible") ||
    queryLower.includes("rejected") ||
    queryLower.includes("disqualified") ||
    queryLower.includes("why deny") ||
    queryLower.includes("why denied") ||
    queryLower.includes("अपात्र") ||
    queryLower.includes("रिजेक्ट")
  ) {
    const topDenied = deniedResults.slice(0, 5);
    if (language === "hi") {
      answer = `**❌ वे योजनाएं जिनके लिए आप वर्तमान में अपात्र (Non-Eligible) हैं:**

*(AWS Cedar कानूनी पॉलिसी नियमों के अनुसार ${effectiveProfile.name || "आपकी प्रोफ़ाइल"} का विश्लेषण)*

${topDenied
  .map(
    (r, idx) => `**${idx + 1}. ${r.scheme.title}** (${r.scheme.shortCode})
  • **अपात्रता का कारण:** ${r.failedReasons.length > 0 ? r.failedReasons.join("; ") : "पात्रता शर्तों को पूरा नहीं करता"}
  • **कानूनी सीमा:** ${r.scheme.maxIncome > 0 ? `आय सीमा ₹${(r.scheme.maxIncome / 100000).toFixed(1)} लाख` : "विशेष श्रेणी/राज्य नियम"}
  • **अधिकृत पोर्टल:** ${r.scheme.portalName}`
  )
  .join("\n\n")}

💡 **सुझाव:** यदि आपकी पारिवारिक आय में परिवर्तन होता है या आप अन्य राज्य के कॉलेज में दाखिला लेते हैं, तो आप प्रोफ़ाइल टैब में विवरण अपडेट करके पुनः पात्रता जांच सकते हैं।`;
    } else {
      answer = `**❌ Schemes You Are Currently NOT Eligible For:**

*(Evaluated using deterministic AWS Cedar policies against the profile of ${effectiveProfile.name || "your account"})*

${topDenied
  .map(
    (r, idx) => `**${idx + 1}. ${r.scheme.title}** (${r.scheme.shortCode})
  • **Exact Reason for Denial:** ${r.failedReasons.length > 0 ? r.failedReasons.join("; ") : "Profile does not meet specific statutory criteria"}
  • **Statutory Requirement:** ${r.scheme.maxIncome > 0 ? `Max Income: ₹${(r.scheme.maxIncome / 100000).toFixed(1)} Lakh` : "Target category/domicile restriction"}
  • **Portal:** ${r.scheme.portalName}`
  )
  .join("\n\n")}

💡 **Recommendation:** Your profile does not meet the legal criteria for these specific schemes (e.g., state domicile mismatch or category restrictions). Focus on the **${eligibleResults.length} schemes you ARE eligible for**! Ask me: *"What are the eligible schemes I am eligible for?"*`;
    }
  }

  // C. ELIGIBLE SCHEMES ("what are the eligible schemes I am eligible for", "which schemes am I eligible for", "available schemes", etc.)
  else if (
    queryLower.includes("eligible") ||
    queryLower.includes("eligilble") || // handles user's exact spelling typo
    queryLower.includes("elgible") ||
    queryLower.includes("qualify") ||
    queryLower.includes("my schemes") ||
    queryLower.includes("which schemes") ||
    queryLower.includes("what schemes") ||
    queryLower.includes("schemes for me") ||
    queryLower.includes("available schemes") ||
    queryLower.includes("schemes available") ||
    queryLower.includes("available to me") ||
    queryLower.includes("show me schemes") ||
    queryLower.includes("what can i apply") ||
    queryLower.includes("what schemes can i apply") ||
    queryLower.includes("पात्र") ||
    queryLower.includes("योग्य") ||
    queryLower.includes("उपलब्ध योजनाएं")
  ) {
    const auditRes = context?.auditResult;
    const docSummarySnippetEn = auditRes ? `\n\n📄 **Your Document Pre-Flight Status:**\n• Aadhaar Name Match: **${auditRes.nameMatchPercentage}%** • NPCI Bank DBT: **${auditRes.npciStatus}** • Readiness: **${auditRes.overallReadinessScore}/100** ${auditRes.overallReadinessScore >= 90 ? "(✔️ Ready to Apply)" : "(⚠️ Resolve document issues in Tab 3 before submission)"}` : "";
    const docSummarySnippetHi = auditRes ? `\n\n📄 **आपके दस्तावेजों की प्री-फ़्लाइट स्थिति:**\n• आधार नाम मिलान: **${auditRes.nameMatchPercentage}%** • NPCI बैंक DBT: **${auditRes.npciStatus}** • तत्परता स्कोर: **${auditRes.overallReadinessScore}/100** ${auditRes.overallReadinessScore >= 90 ? "(✔️ आवेदन हेतु तैयार)" : "(⚠️ सबमिशन से पहले टैब 3 में लंबित दस्तावेज ठीक करें)"}` : "";

    if (language === "hi") {
      if (eligibleResults.length === 0) {
        answer = `**⚠️ वर्तमान में आपकी प्रोफ़ाइल से मेल खाने वाली कोई सक्रिय योजना नहीं मिली:**

*(प्रोफ़ाइल: **${effectiveProfile.name || "विद्यार्थी"}**, राज्य: **${effectiveProfile.state}**, श्रेणी: **${effectiveProfile.category}**, आय: **₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}**)*

आपकी वार्षिक पारिवारिक आय या श्रेणी वर्तमान योजनाओं की अधिकतम सीमाओं से अधिक हो सकती है। आप मुझसे पूछ सकते हैं: *"मेरे लिए कौन सी योजनाएं अपात्र हैं और क्यों?"* जिससे आप सटीक कानूनी कारण देख सकें।`;
      } else {
        answer = `**✅ वे योजनाएं जिनके लिए आप 100% पात्र (Eligible) हैं:**

*(प्रोफ़ाइल: **${effectiveProfile.name || "विद्यार्थी"}**, राज्य: **${effectiveProfile.state}**, श्रेणी: **${effectiveProfile.category}**, आय: **₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}**)*

${eligibleResults
  .map(
    (r, idx) => `**${idx + 1}. ${r.scheme.title}** (${r.scheme.shortCode})
  • **वित्तीय लाभ (Benefit):** ${r.scheme.benefitAmount}
  • **आप क्यों पात्र हैं:** आपकी आय (₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}) निर्धारित सीमा (₹${(r.scheme.maxIncome / 100000).toFixed(1)} लाख) के भीतर है, और आपकी श्रेणी (${effectiveProfile.category}) मान्य है।
  • **आवेदन पोर्टल:** [${r.scheme.portalName}](${r.scheme.officialPortalUrl})
  • **दस्तावेज स्थिति:** ${r.missingPrerequisites.length > 0 ? `⚠️ आवश्यक: ${r.missingPrerequisites.map((p) => p.title).join(", ")}` : "✔️ आवेदन हेतु तैयार"}`
  )
  .join("\n\n")}${docSummarySnippetHi}

👉 आप किसी भी योजना के बारे में पूछ सकते हैं: *"इस योजना के लिए आवश्यक दस्तावेज क्या हैं?"* या *"आवेदन कैसे करें?"*`;
      }
    } else {
      if (eligibleResults.length === 0) {
        answer = `**⚠️ No Schemes Currently Match Your Exact Criteria:**

*(Evaluated for: **${effectiveProfile.name || "Citizen"}**, State: **${effectiveProfile.state}**, Category: **${effectiveProfile.category}**, Annual Income: **₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}**)*

Your current household income or category exceeds the statutory income ceilings of available affirmative action schemes. 

💡 **Actionable Option:** Ask me *"What are the non-eligible schemes for me?"* to view the exact statutory disqualification clauses and income limits.`;
      } else {
        answer = `**✅ Schemes You Are 100% Eligible For:**

*(Evaluated for: **${effectiveProfile.name || "Citizen"}**, State: **${effectiveProfile.state}**, Category: **${effectiveProfile.category}**, Annual Income: **₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}**)*

${eligibleResults
  .map(
    (r, idx) => `**${idx + 1}. ${r.scheme.title}** (${r.scheme.shortCode})
  • **Statutory Benefit:** **${r.scheme.benefitAmount}**
  • **Why You Qualify:** Household income of ₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")} is within the ₹${(r.scheme.maxIncome / 100000).toFixed(1)} Lakh ceiling; category **${effectiveProfile.category}** and education stage **${effectiveProfile.educationLevel}** match.
  • **Official Portal:** [${r.scheme.portalName}](${r.scheme.officialPortalUrl})
  • **Status:** ${r.missingPrerequisites.length > 0 ? `⚠️ Prerequisite Action: ${r.missingPrerequisites.map((p) => p.title).join(", ")}` : "✔️ All core criteria satisfied"}`
  )
  .join("\n\n")}${docSummarySnippetEn}

👉 Next Steps: Ask me *"What are the documents required for ${eligibleResults[0]?.scheme.shortCode || "this scheme"}?"* or *"How can I do it?"*`;
      }
    }
  }

  // D. CITIZEN'S PRE-FLIGHT DOCUMENT AUDIT & VERIFICATION STATUS ("are my documents verified", "check my documents", "document audit", etc.)
  else if (
    queryLower.includes("my doc") ||
    queryLower.includes("my document") ||
    queryLower.includes("verified") ||
    queryLower.includes("verification") ||
    queryLower.includes("document audit") ||
    queryLower.includes("audit status") ||
    queryLower.includes("audit result") ||
    queryLower.includes("readiness score") ||
    queryLower.includes("readiness") ||
    queryLower.includes("ready to submit") ||
    queryLower.includes("can i submit") ||
    queryLower.includes("check my doc") ||
    queryLower.includes("दस्तावेज जांच") ||
    queryLower.includes("सत्यापन")
  ) {
    const auditRes = context?.auditResult;
    const auditIn = context?.auditInput;
    const readiness = auditRes?.overallReadinessScore ?? (effectiveProfile.heldDocuments && effectiveProfile.heldDocuments.length > 2 ? 85 : 70);
    const nameMatch = auditRes?.nameMatchPercentage ?? 100;
    const npci = auditRes?.npciStatus ?? "SEEDED";

    if (language === "hi") {
      answer = `**📋 आपके दस्तावेजों का प्री-फ़्लाइट ऑडिट और सत्यापन स्थिति:**

*(नागरिक: **${effectiveProfile.name || "अभ्यर्थी"}**, राज्य: **${effectiveProfile.state}**)*

• **समग्र आवेदन तत्परता स्कोर (Readiness Score):** **${readiness}/100** ${readiness >= 90 ? "🟢 आवेदन हेतु तैयार" : "🟡 कार्रवाई आवश्यक"}
• **आधार बनाम 10वीं मार्कशीट नाम मिलान:** **${nameMatch}%**
  ↳ आधार पर नाम: "${auditIn?.nameOnAadhaar || effectiveProfile.name || "दर्ज नाम"}"
  ↳ मार्कशीट पर नाम: "${auditIn?.nameOnMarksheet || effectiveProfile.name || "दर्ज नाम"}"
  ${nameMatch < 100 ? `  ↳ ⚠️ **समाधान:** नाम में थोड़ा अंतर है। पोर्टल पर रिजेक्शन से बचने के लिए **टैब 3** से **नोटरी नाम शपथ पत्र (Affidavit)** डाउनलोड करें।` : `  ↳ ✔️ सटीक नाम मिलान! e-KYC रिजेक्शन का कोई जोखिम नहीं है।`}
• **एनपीसीआई बैंक डीबीटी सीडिंग:** **${npci === "SEEDED" ? "सक्रिय (SEEDED) ✔️" : "केवल लिंक्ड / असंबद्ध ⚠️"}**
  ${npci === "SEEDED" ? `  ↳ आपका बैंक खाता NPCI DBT मैपर पर सक्रिय है। छात्रवृत्ति सीधे खाते में आएगी।` : `  ↳ आपका खाता केवल सामान्य KYC लिंक्ड है। **टैब 3** से **NPCI DBT Mandate Form** डाउनलोड कर बैंक में जमा करें।`}
• **डिजीलॉकर में संलग्न प्रमाण पत्र:** ${effectiveProfile.heldDocuments && effectiveProfile.heldDocuments.length > 0 ? effectiveProfile.heldDocuments.map(d => d.replace(/_/g, " ")).join(", ") : "टैब 1 में अपने उपलब्ध दस्तावेजों को चिह्नित करें।"}

💡 **अगला कदम:** आप पूछ सकते हैं: *"मैं किन योजनाओं के लिए पात्र हूँ?"* या *"आवेदन कैसे करें?"*`;
    } else {
      answer = `**📋 Pre-Flight Document Audit & Verification Status:**

*(Evaluated for: **${effectiveProfile.name || "Citizen"}**, State: **${effectiveProfile.state}**)*

• **Overall Application Readiness Score:** **${readiness}/100** ${readiness >= 90 ? "🟢 Ready to Submit" : "🟡 Action Required Before Submission"}
• **Aadhaar vs 10th Marksheet Name Match:** **${nameMatch}% Match**
  ↳ Aadhaar Record: "${auditIn?.nameOnAadhaar || effectiveProfile.name || "Active Citizen"}"
  ↳ Marksheet Record: "${auditIn?.nameOnMarksheet || effectiveProfile.name || "Active Citizen"}"
  ${nameMatch < 100 ? `  ↳ ⚠️ **Action Required:** Name spelling differences detected. Navigate to **Tab 3 ("Document Upload & Matcher")** to download an instant **Notarized Name Affidavit** before portal submission.` : `  ↳ ✔️ Complete 100% string alignment! Zero risk of automated e-KYC portal rejection.`}
• **NPCI DBT Bank Seeding:** **${npci === "SEEDED" ? "ACTIVE (SEEDED) ✔️" : "ONLY LINKED (NOT SEEDED) ⚠️"}**
  ${npci === "SEEDED" ? `  ↳ Bank account is registered on the NPCI DBT Gateway for instant scholarship fund credit via PFMS.` : `  ↳ Bank account is only KYC-linked, NOT seeded on the NPCI DBT Mapper. Download the **DBT Aadhaar Seeding Mandate (Annexure I)** from Tab 3 and submit to your bank branch.`}
• **Held Certificates in DigiLocker:** ${effectiveProfile.heldDocuments && effectiveProfile.heldDocuments.length > 0 ? effectiveProfile.heldDocuments.map(d => d.replace(/_/g, " ")).join(", ") : "None marked yet. Toggle held certificates in Tab 1 to track missing prerequisites."}

👉 Next Steps: Ask me *"What are the eligible schemes I am eligible for?"* or *"How can I do it?"*`;
    }
  }

  // E. REQUIREMENTS FOR A SCHEME ("what are the requirements for this scheme")
  else if (
    queryLower.includes("requirement") ||
    queryLower.includes("requirment") ||
    queryLower.includes("criteria") ||
    queryLower.includes("eligibility criteria") ||
    queryLower.includes("rule") ||
    queryLower.includes("पात्रता") ||
    queryLower.includes("शर्तें")
  ) {
    const target =
      SCHEMES_DATABASE.find((s) => {
        const id = s.id.toLowerCase();
        const code = s.shortCode.toLowerCase();
        return queryLower.includes(id) || queryLower.includes(code) || (queryLower.includes("pudhumai") && id.includes("pudhumai")) || (queryLower.includes("jagananna") && id.includes("jagananna"));
      }) || currentTargetScheme;

    matchedSchemes.push(target.id);

    if (language === "hi") {
      answer = `**📋 ${target.title} (${target.shortCode}) के लिए आधिकारिक पात्रता आवश्यकताएं:**

• **संबद्ध मंत्रालय:** ${target.ministry}
• **पारिवारिक आय सीमा:** ${target.maxIncome === 0 ? "कोई अधिकतम आय सीमा नहीं (No Income Ceiling)" : `अधिकतम ₹${(target.maxIncome / 100000).toFixed(1)} लाख प्रति वर्ष`}
• **स्वीकृत श्रेणियां:** ${target.targetCategories.join(", ")}
• **स्वीकृत शिक्षा स्तर:** ${target.educationStages.join(", ")}
• **अध्ययन पाठ्यक्रम:** ${target.courseTypesAllowed.join(", ")}
• **लैंगिक प्रतिबंध:** ${target.genderRestriction ? (target.genderRestriction === "Female" ? "केवल छात्राएं (Female Only)" : target.genderRestriction) : "सभी (All)"}
• **वित्तीय लाभ:** **${target.benefitAmount}** (${target.benefitDescription})
• **आवेदन पोर्टल:** [${target.portalName}](${target.officialPortalUrl})
• **अंतिम तिथि (Deadline):** ${target.deadline} (${target.daysRemaining} दिन शेष)`;
    } else {
      answer = `**📋 Official Requirements for ${target.title} (${target.shortCode}):**

• **Sponsoring Authority:** ${target.ministry}
• **Household Income Ceiling:** ${target.maxIncome === 0 ? "No Maximum Income Ceiling" : `Gross family income ≤ ₹${(target.maxIncome / 100000).toFixed(1)} Lakh / Year`}
• **Eligible Categories:** ${target.targetCategories.join(", ")}
• **Eligible Education Stages:** ${target.educationStages.join(", ")}
• **Course Types:** ${target.courseTypesAllowed.join(", ")}
• **Gender Restrictions:** ${target.genderRestriction ? (target.genderRestriction === "Female" ? "Female Students Only" : target.genderRestriction) : "All Genders"}
• **Entitlement Benefit:** **${target.benefitAmount}**
• **Scope:** ${target.benefitDescription}
• **Application Portal:** [${target.portalName}](${target.officialPortalUrl})
• **Deadline:** ${target.deadline} (${target.daysRemaining} days remaining)`;
    }
  }

  // E. DOCUMENTS REQUIRED ("what are the documents required for this particular scheme")
  else if (
    queryLower.includes("document") ||
    queryLower.includes("documnt") ||
    queryLower.includes("doc") ||
    queryLower.includes("certificate") ||
    queryLower.includes("paper") ||
    queryLower.includes("दस्तावेज") ||
    queryLower.includes("प्रमाण पत्र")
  ) {
    const target =
      SCHEMES_DATABASE.find((s) => {
        const id = s.id.toLowerCase();
        return queryLower.includes(id) || (queryLower.includes("pudhumai") && id.includes("pudhumai")) || (queryLower.includes("jagananna") && id.includes("jagananna"));
      }) || currentTargetScheme;

    matchedSchemes.push(target.id);

    if (language === "hi") {
      answer = `**📑 ${target.shortCode} हेतु आवश्यक अनिवार्य दस्तावेज:**

1. **आधार कार्ड (Aadhaar Card):** नाम और जन्मतिथि 10वीं की मार्कशीट से सटीक मेल खानी चाहिए।
2. **डिजिटल जाति प्रमाण पत्र (Caste Certificate):** बारकोडेड ई-डिस्ट्रिक्ट/मीसेवा जारी प्रमाण पत्र।
3. **चालू वित्तीय वर्ष का आय प्रमाण पत्र (Income Certificate):** सक्षम राजस्व अधिकारी (Tehsildar) द्वारा चालू वित्त वर्ष (1 अप्रैल के बाद) में जारी।
4. **संस्थान का बोनाफाइड सर्टिफिकेट (Bonafide Certificate):** कॉलेज प्रमुख द्वारा हस्ताक्षरित वर्तमान अध्ययन प्रमाण।
5. **एनपीसीआई सीडेड बैंक पासबुक (NPCI Seeded Bank Account):** खाता डीबीटी मैपर पर सक्रिय होना अनिवार्य है।
6. **पिछली परीक्षा की मार्कशीट (Marksheets):** 10वीं/12वीं/डिग्री की प्रति।
${target.mandatoryDocuments.length > 0 ? `• **योजना-विशिष्ट दस्तावेज:** ${target.mandatoryDocuments.join(", ")}` : ""}

💡 **टिप:** दस्तावेजों में नाम की स्पेलिंग में अंतर होने पर जनसेतु के **"3. Document Upload & Matcher"** टैब से नोटरी एफिडेविट प्रारूप डाउनलोड करें।`;
    } else {
      answer = `**📑 Mandatory Documents Required for ${target.title} (${target.shortCode}):**

1. **Aadhaar Card:** Name and Date of Birth must match your matriculation certificate.
2. **Digital Barcoded Caste Certificate:** Issued by competent Revenue Authority (Tehsildar/SDO) via state e-District / MeeSeva portal.
3. **Current Financial Year Income Certificate:** Valid for the current financial year (issued on or after April 1).
4. **Institution Bonafide Certificate & Fee Receipt:** Stamped by the College Head / Institute Nodal Officer (INO).
5. **NPCI-Seeded Bank Account Passbook:** Bank account must be mapped on the NPCI DBT Gateway (not just KYC linked).
6. **Previous Academic Marksheets:** 10th standard and preceding semester marksheet.
${target.mandatoryDocuments.length > 0 ? `• **Scheme-Specific Documents:** ${target.mandatoryDocuments.join(", ")}` : ""}

💡 **Actionable Tip:** If your name on Aadhaar differs from your marksheet, navigate to **Tab 3 ("Document Upload & Matcher")** to generate an instant Notarized Name Affidavit!`;
    }
  }

  // F. HOW CAN I DO IT? / HOW TO APPLY ("how can i do it", "how to apply", "steps", etc.)
  else if (
    queryLower.includes("how can i do it") ||
    queryLower.includes("how to apply") ||
    queryLower.includes("how do i apply") ||
    queryLower.includes("how can i apply") ||
    queryLower.includes("how to do") ||
    queryLower.includes("what should i do") ||
    queryLower.includes("application process") ||
    queryLower.includes("step") ||
    queryLower.includes("procedure") ||
    queryLower.includes("guide me") ||
    queryLower.includes("आवेदन कैसे करें") ||
    queryLower.includes("कैसे करें")
  ) {
    if (language === "hi") {
      answer = `**🚀 छात्रवृत्ति आवेदन हेतु 5-चरणीय रोडमैप (How To Do It):**

1. **चरण 1: दस्तावेज़ मिलान (Pre-Flight Audit)**
   • जनसेतु के **"3. Document Upload & Matcher"** टैब पर जाएं।
   • अपने आधार और 10वीं मार्कशीट का नाम जांचें। यदि नाम में स्पेलिंग का अंतर है, तो ₹10 के स्टैम्प पेपर हेतु एफिडेविट डाउनलोड करें।

2. **चरण 2: बैंक खाता NPCI सीड करवाएं**
   • टैब 3 से **NPCI Seeding Mandate Form (Annexure I)** डाउनलोड करें।
   • अपनी बैंक शाखा में जाकर आधार को NPCI DBT मैपर पर एक्टिवेट करवाएं और पावती रसीद लें।

3. **चरण 3: आधिकारिक पोर्टल पर OTR रजिस्ट्रेशन**
   • [राष्ट्रीय छात्रवृत्ति पोर्टल (NSP)](${currentTargetScheme.officialPortalUrl}) या राज्य पोर्टल पर जाएं।
   • अपना One-Time Registration (OTR) पूरा करें।

4. **चरण 4: ऑनलाइन फॉर्म भरें और दस्तावेज अपलोड करें**
   • अपनी संस्था का AISHE/DISE कोड चुनें और जाति, आय, बोनाफाइड दस्तावेज अपलोड करें।
   • फाइनल सबमिशन के बाद एप्लीकेशन आईडी नोट करें।

5. **चरण 5: कॉलेज में फिजिकल डोजियर जमा करें**
   • जनसेतु के **"7. Download Dossier"** टैब से अपना **1-Click Application Dossier** प्रिंट करें।
   • इसे अपने कॉलेज के नोडल अधिकारी (INO) को सत्यापन हेतु जमा करें।`;
    } else {
      answer = `**🚀 Complete 5-Stage Action Roadmap (How Can You Do It):**

1. **Stage 1: Pre-Flight Document Audit**
   • Open **Tab 3 ("Document Upload & Matcher")** in JanSetu AI.
   • Verify that your Aadhaar name exactly matches your 10th marksheet. If mismatched, download our instant Notarized Name Affidavit.

2. **Stage 2: NPCI Bank DBT Seeding**
   • Download your pre-filled **NPCI Mandate Form (Annexure I)** from Tab 3.
   • Submit it to your home bank branch counter to ensure Direct Benefit Transfer funds will not bounce.

3. **Stage 3: Official Portal OTR Registration**
   • Navigate to the official portal: [${currentTargetScheme.portalName}](${currentTargetScheme.officialPortalUrl}).
   • Complete One-Time Registration (OTR) with your Aadhaar e-KYC.

4. **Stage 4: Form Submission & Document Upload**
   • Select your course and enter your college AISHE/DISE code.
   • Upload clean scans of your Income, Caste, and Bonafide certificates.

5. **Stage 5: Submit Verification Dossier to College**
   • Go to **Tab 7 ("Download Dossier")** and print your verified 1-page submission card.
   • Hand it directly to your College Institute Nodal Officer (INO) for Level-1 institutional approval.`;
    }
  }

  // G. NPCI Bank Seeding vs Linking
  else if (
    queryLower.includes("npci") ||
    queryLower.includes("seed") ||
    queryLower.includes("dbt") ||
    queryLower.includes("mapper") ||
    (queryLower.includes("bank") && (queryLower.includes("link") || queryLower.includes("aadhaar")))
  ) {
    answer =
      language === "hi"
        ? `**⚠️ महत्वपूर्ण जानकारी: NPCI आधार सीडिंग बनाम लिंकिंग**

अधिकांश छात्र इसलिए छात्रवृत्ति से वंचित रह जाते हैं क्योंकि बैंक खाता आधार से केवल 'जुड़ा' (Linked) होता है, लेकिन 'सीड' (NPCI Seeded) नहीं होता!

1. **आधार लिंकिंग (Linking):** केवल बैंक की आंतरिक केवाईसी (KYC) के लिए होती है। इससे डीबीटी छात्रवृत्ति फंड नहीं आ सकता।
2. **एनपीसीआई मैपर सीडिंग (Seeding):** आपके 12-अंकों के आधार को नेशनल पेमेंट्स कॉरपोरेशन ऑफ इंडिया (NPCI) के डीबीटी मैपर से जोड़ता है, जिससे पीएफएमएस (PFMS) सीधे छात्रवृत्ति राशि भेज सके।

**समाधान और आवश्यक कदम:**
• जनसेतु के **"3. Document Upload & Matcher"** टैब से प्री-फिल्ड **NPCI Mandate Form (Annexure I)** डाउनलोड करें।
• अपनी बैंक शाखा प्रबंधक से कहें: *"कृपया मेरा बैंक खाता NPCI DBT Mapper पर एक्टिवेट/सीड करें।"*
• बैंक से स्टैम्प लगी पावती रसीद (Acknowledgement Slip) अवश्य लें।`
        : `**⚠️ Critical Advisory: NPCI Aadhaar Seeding vs Normal Linking**

Many scholarship applicants face silent rejections because their bank account is **Aadhaar Linked** (for KYC), but **NOT NPCI Seeded** (for Direct Benefit Transfer)!

1. **Normal Aadhaar Linking:** Only satisfies internal bank KYC. It does **NOT** allow scholarship disbursement via PFMS.
2. **NPCI Aadhaar Seeding:** Maps your 12-digit Aadhaar on the National Payments Corporation of India (NPCI) gateway, enabling the Ministry to disburse scholarship funds directly.

**Step-by-Step Action Plan:**
• Download your pre-filled **NPCI Mandate Form (Annexure I)** directly from our **"3. Document Upload & Matcher"** tab.
• Visit your home bank branch counter and specifically request: *"Please seed my account onto the NPCI DBT Mapper."*
• Insist on receiving a bank-stamped acknowledgement receipt with your 11-digit account number.`;
    matchedSchemes.push("PostMatric_ST", "PostMatric_SC", "PM_YASASVI_OBC");
  }

  // H. Name Mismatch / Marksheet Discrepancies
  else if (
    queryLower.includes("name") ||
    queryLower.includes("mismatch") ||
    queryLower.includes("spelling") ||
    queryLower.includes("marksheet") ||
    queryLower.includes("affidavit") ||
    queryLower.includes("correction") ||
    queryLower.includes("नाम")
  ) {
    answer =
      language === "hi"
        ? `**📝 नाम में अंतर (Name Mismatch) समाधान गाइड:**

यदि आपके आधार कार्ड और 10वीं की मार्कशीट में नाम या स्पेलिंग अलग है (जैसे "Rajesh Kumar" बनाम "Rajesh K"), तो पोर्टल आवेदन स्वतः रिजेक्ट कर सकता है।

**तत्काल समाधान:**
1. **स्व-घोषणा शपथ पत्र (Affidavit):**
   • जनसेतु के **"3. Document Upload & Matcher"** टैब से ₹10 के गैर-न्यायिक स्टाम्प पेपर हेतु प्री-ड्राफ्टेड **Name Discrepancy Affidavit** डाउनलोड करें।
   • इसे नोटरी पब्लिक से अटेस्ट करवाकर कॉलेज नोडल अधिकारी (INO) को आवेदन के साथ जमा करें।
2. **आधार ऑनलाइन सुधार:**
   • UIDAI पोर्टल (\`myaadhaar.uidai.gov.in\`) पर जाएं।
   • 10वीं की मार्कशीट को वैध पहचान प्रमाण (POI) के रूप में अपलोड कर नाम सही करवाएं (3–7 दिनों में अपडेट हो जाता है)।`
        : `**📝 Resolving Name & Spelling Mismatches:**

Automated government portals (NSP, e-Kalyan) compare your Aadhaar name against your Matriculation (10th) marksheet. Even a missing middle initial or typo (e.g. "Rajesh Kumar" vs "Rajesh K") can trigger an automated rejection.

**Statutory Resolution Roadmap:**
1. **First-Line Defense (Instant): Notarized Name Affidavit**
   • Download the pre-drafted **Name Discrepancy Affidavit** from our **"3. Document Upload & Matcher"** tab.
   • Execute it on ₹10 non-judicial stamp paper attested by a Notary Public.
   • Submit this to your Institute Nodal Officer (INO) alongside your physical verification dossier.
2. **Permanent Correction: UIDAI Self-Service Portal**
   • Log in to \`myaadhaar.uidai.gov.in\` with your registered mobile OTP.
   • Submit an Online Name Correction request uploading your 10th marksheet as Proof of Identity (POI). Updates typically clear within 3–7 business days.`;
    matchedSchemes.push("Name_Affidavit", "Aadhaar_Correction");
  }

  // I. Statutory CSC Fees & Anti-Extortion
  else if (
    queryLower.includes("fee") ||
    queryLower.includes("csc") ||
    queryLower.includes("charge") ||
    queryLower.includes("extortion") ||
    queryLower.includes("cost") ||
    queryLower.includes("फीस") ||
    queryLower.includes("खर्च")
  ) {
    answer =
      language === "hi"
        ? `**⚖️ आधिकारिक सरकारी फीस नियम (नागरिक अधिकार चार्टर):**

• **छात्रवृत्ति ऑनलाइन आवेदन (NSP / MoTA / e-Kalyan):** **₹0 (पूरी तरह निःशुल्क)**। किसी भी साइबर कैफे या कॉलेज डेस्क को कोई फीस लेने का अधिकार नहीं है।
• **जाति / आय / निवास प्रमाण पत्र (CSC केंद्र):** सरकार द्वारा अधिसूचित ऑपरेटर सेवा शुल्क केवल **₹25 से ₹30** प्रति आवेदन है।
• **अवैध वसूली पर रोक:** यदि कोई संचालक ₹150–₹300 की मांग करे, तो तत्काल कम्प्यूटरीकृत रसीद मांगें।
• **राष्ट्रीय सीएससी शिकायत हेल्पलाइन:** \`1800-3000-3468\` / \`0120-6619540\``
        : `**⚖️ Statutory Government Fees vs Private Extortion Guard:**

• **Scholarship Applications (NSP, MoTA, e-Kalyan, State Portals):** **₹0 (Completely Free)** under Central & State Citizen Charters. No college desk or kiosk can legally charge you a single rupee.
• **Certificates (Caste, Income, Domicile via CSC / MeeSeva):** The legally notified operator service fee is strictly **₹25 to ₹30** per certificate.
• **Anti-Extortion Advisory:** If an internet cafe demands ₹150–₹300, demand an official system-generated computerized receipt. Unauthorized charging is punishable under Section 72 of the IT Act.
• **National Grievance Toll-Free Helpline:** \`1800-3000-3468\` / \`0120-6619540\``;
    matchedSchemes.push("CSC_Directory", "Citizen_Charter");
  }

  // J. Fallback with Profile Awareness
  else {
    answer =
      language === "hi"
        ? `नमस्ते **${effectiveProfile.name || "विद्यार्थी"}**! मैं आपके प्रश्न में पूरी तरह मदद कर सकता हूँ।

वर्तमान में आपकी प्रोफ़ाइल के अनुसार आप **${eligibleResults.length} छात्रवृत्ति योजनाओं** के लिए योग्य हैं।

कृपया मुझे बताएं कि आप क्या जानना चाहते हैं:
1. **"मैं किन योजनाओं के लिए पात्र हूँ?"**
2. **"मेरे लिए कौन सी योजनाएं अपात्र हैं?"**
3. **"इस योजना के लिए क्या आवश्यकताएं हैं?"**
4. **"कौन से दस्तावेज जमा करने हैं?"**
5. **"आवेदन कैसे शुरू करें?"**`
        : `Hello **${effectiveProfile.name || "Citizen"}**! I am here to guide you.

Based on your active profile (${effectiveProfile.category}, ${effectiveProfile.state}, ₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}), you are eligible for **${eligibleResults.length} government schemes**.

You can ask me:
1. **"What are the eligible schemes I am eligible for?"**
2. **"What are the non-eligible schemes for me?"**
3. **"What are the requirements for this scheme?"**
4. **"What are the documents required for this particular scheme?"**
5. **"How can I do it?"**`;
  }

  return {
    answer,
    source: "ZERO_FAIL_CIVIC_RAG",
    modelUsed: "JanSetu-Civic-RAG (Profile-Aware / 100% Free)",
    relevantSchemes: matchedSchemes,
    suggestedQuestions: [
      "What are the eligible schemes I am eligible for?",
      "What are the non-eligible schemes for me?",
      "What are the requirements for this scheme?",
      "What are the documents required for this particular scheme?",
      "How can I do it?",
    ],
  };
}
