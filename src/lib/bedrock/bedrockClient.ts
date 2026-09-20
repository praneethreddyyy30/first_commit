import { BedrockRuntimeClient, ConverseCommand, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { SCHEMES_DATABASE, SchemeOrService } from "@/data/schemes";
import { evaluateCedarPolicies, UserProfile, CedarEvaluationResult } from "@/lib/cedar/evaluator";
import { DEMO_PERSONAS } from "@/data/demoPersonas";
import { DocumentAuditResult, DocumentAuditInput } from "@/lib/audit/documentAuditor";
import { globalSchemeRegistry } from "@/lib/schemes/schemeRegistry";
import { getSchemeRoadmap } from "@/data/schemeRoadmaps";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface BedrockResponse {
  answer: string;
  source: "AWS_BEDROCK_LIVE" | "GROQ_LLAMA_LIVE" | "GOOGLE_GEMINI_LIVE" | "ZERO_FAIL_CIVIC_RAG";
  modelUsed: string;
  relevantSchemes?: string[];
  suggestedQuestions?: string[];
}

export interface AwsCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  sessionToken?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
}

export interface CopilotContext {
  profile?: UserProfile;
  evaluationResults?: CedarEvaluationResult[];
  targetSchemeId?: string;
  auditResult?: DocumentAuditResult;
  auditInput?: DocumentAuditInput;
}

/**
 * Ultra-fast Groq Cloud inference
 * Free, instantaneous, zero credit card required (https://console.groq.com/keys)
 */
async function callGroqChat(
  apiKey: string,
  systemPrompt: string,
  history: ChatMessage[],
  userQuery: string
): Promise<{ text: string; model: string }> {
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userQuery },
  ];

  const candidateModels = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
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
          messages,
          temperature: 0.6,
          max_tokens: 2500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        if (content.trim()) {
          return { text: content, model };
        }
      }
    } catch {
      // try next candidate model
    }
  }

  throw new Error("No candidate Groq models were reachable with this API key.");
}

/**
 * Google Gemini 2.0 Flash inference
 * Free tier, high intelligence (https://aistudio.google.com/app/apikey)
 */
async function callGeminiChat(
  apiKey: string,
  systemPrompt: string,
  history: ChatMessage[],
  userQuery: string
): Promise<string> {
  const contents = [
    ...history.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userQuery }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 2500,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
  const awsRegion = customCredentials?.region || process.env.APP_AWS_REGION || process.env.AWS_REGION || "us-east-1";
  const accessKeyId = customCredentials?.accessKeyId || process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = customCredentials?.secretAccessKey || process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = customCredentials?.sessionToken || process.env.APP_AWS_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN;
  const modelId = process.env.APP_AWS_BEDROCK_MODEL_ID || process.env.BEDROCK_MODEL_ID || process.env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0";

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
    SCHEMES_DATABASE.find(
      (s) =>
        s.id.toLowerCase() === currentTargetId.toLowerCase() ||
        s.shortCode.toLowerCase() === currentTargetId.toLowerCase() ||
        s.id.toLowerCase().replace(/_/g, "-") === currentTargetId.toLowerCase().replace(/_/g, "-")
    ) ||
    SCHEMES_DATABASE[0];

  const currentTargetRoadmap = getSchemeRoadmap(currentTargetScheme.id);
  const currentSchemeEval = effectiveEvalResults.find(
    (r) => r.scheme.id === currentTargetScheme.id || r.scheme.shortCode === currentTargetScheme.shortCode
  );
  const isCurrentSchemeEligible = currentSchemeEval ? currentSchemeEval.decision === "ALLOW" : false;

  // Formulate universal contextual system prompt with real citizen profile & gazette context
  const systemPrompt = `You are JanSetu AI, an expert Indian Civic & Student Scholarship Copilot built for the WeMakeDevs AWS First Commit Hackathon.
You provide accurate, empathetic, conversational, and step-by-step guidance on scholarships, certificates, and government benefits for Indian students (ST, SC, OBC, EWS, General).

Active Citizen Profile Context:
- Name: ${effectiveProfile.name || "Citizen"}
- State of Residence: ${effectiveProfile.state}
- District: ${effectiveProfile.district || "Default District"}
- Category: ${effectiveProfile.category} (Community: ${effectiveProfile.tnCommunity || effectiveProfile.apCommunity || "General"})
- Annual Family Income: ₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}
- Education Stage: ${effectiveProfile.educationLevel} (${effectiveProfile.courseType})
- Gender: ${effectiveProfile.gender}

🎯 ACTIVE SCHEME AUTO-DETECTION (SELECTED BY CITIZEN):
- Scheme Title: ${currentTargetScheme.title}
- Short Code: ${currentTargetScheme.shortCode}
- Sponsoring Authority: ${currentTargetScheme.ministry}
- Statutory Benefit: ${currentTargetScheme.benefitAmount}
- Statutory Turnaround / SLA: ${currentTargetRoadmap.statutoryTimeLimit}
- Official Fee: ${currentTargetRoadmap.officialFee}
- Official Portal: ${currentTargetScheme.portalName} (${currentTargetScheme.officialPortalUrl})
- Physical Submission Desk: ${currentTargetRoadmap.offlineCounter}
- Eligibility Status for this Citizen: ${isCurrentSchemeEligible ? "100% ELIGIBLE (ALLOW)" : `INELIGIBLE (DENY) - ${currentSchemeEval?.failedReasons.join("; ") || "Criteria mismatch"}`}

Cedar Policy Deterministic Evaluation for this Profile:
- ELIGIBLE SCHEMES (${eligibleResults.length}): ${eligibleResults.map((r) => `${r.scheme.title} (Benefit: ${r.estimatedBenefit})`).join("; ")}
- NON-ELIGIBLE SCHEMES (${deniedResults.length}): ${deniedResults.map((r) => `${r.scheme.shortCode} (Reason: ${r.failedReasons.join(", ")})`).join("; ")}

Pre-Flight Document Audit Status:
- Document Readiness Score: ${context?.auditResult?.overallReadinessScore ?? 100}/100
- Name Match on Aadhaar vs 10th Marksheet: ${context?.auditResult?.nameMatchPercentage ?? 100}% ("${context?.auditInput?.nameOnAadhaar || effectiveProfile.name || ''}" vs "${context?.auditInput?.nameOnMarksheet || effectiveProfile.name || ''}")
- Bank NPCI DBT Seeding: ${context?.auditResult?.npciStatus || "SEEDED"}
- Held Certificates: ${effectiveProfile.heldDocuments?.join(", ") || "None specified"}

CRITICAL AUTO-DETECTION RULE:
When the user asks general questions such as "What are the documents required?", "What are the requirements?", "How can I do it?", "What are the stages?", "Am I eligible?", or "Where is the seva center?", you MUST automatically answer specifically for the selected scheme: "${currentTargetScheme.title}" (${currentTargetScheme.shortCode}), unless they explicitly ask about a different scheme.

Rules:
- Answer naturally in a friendly, helpful conversational tone.
- When the user asks "which schemes am I eligible for" or "available schemes", list their exact eligible schemes above.
- When the user asks about their document audit, name match, or NPCI status, cite their real-time document audit status above.
- When the user asks "what schemes are non-eligible" or "why am I rejected", explain the exact Cedar policy denial reasons above.
- When the user asks about requirements or documents for a scheme, list the specific mandatory documents and prerequisites.
- When the user asks "how can I do it" or "how to apply", provide the clear 5-step roadmap.
- Formatting & Readability:
  * Present document checklists and guidance in clean, structured sections with priority indicators (🔴 Action Required, 🟡 Documents to Procure, 🟢 Ready to Use).
  * Avoid giant, sprawling multi-column markdown tables that are easily truncated or hard to read on mobile screens; prefer categorized cards or clean bulleted sections.
  * When explaining Aadhaar Linking vs NPCI Aadhaar DBT Seeding, provide a crisp, complete explanation of the distinction (linking allows authentication; NPCI DBT seeding binds the account on the central mapper to receive government direct benefit transfers).
  * Always ensure explanations are complete and finish with a simple next-step action plan.
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

  // ============================================================================
  // 1. PRIMARY LIVE LLM: AMAZON BEDROCK RUNTIME
  // ============================================================================
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

      let answer = "";
      try {
        const converseCmd = new ConverseCommand({
          modelId,
          system: [{ text: systemPrompt }],
          messages: [
            ...history.filter(m => m.role !== "system").map(m => ({
              role: m.role as "user" | "assistant",
              content: [{ text: m.content }]
            })),
            { role: "user", content: [{ text: userQuery }] }
          ],
          inferenceConfig: {
            maxTokens: 2500,
            temperature: 0.7
          }
        });

        const response = await client.send(converseCmd);
        answer = response.output?.message?.content?.[0]?.text || "Response generated successfully.";
      } catch (convErr) {
        if (modelId.includes("anthropic")) {
          const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 2500,
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
          answer = json.content?.[0]?.text || "Response generated successfully.";
        } else {
          throw convErr;
        }
      }

      if (answer && answer.trim()) {
        return {
          answer,
          source: "AWS_BEDROCK_LIVE",
          modelUsed: modelId
        };
      }
    } catch (err: unknown) {
      console.warn("AWS Bedrock live invocation notice (account verification or policy lock):", (err as Error)?.message);
    }
  }

  // ============================================================================
  // 2. INSTANT FREE LIVE LLM: GROQ CLOUD (LLAMA 3.3 70B VERSATILE)
  // Zero setup, 100% free, ~500 tokens/sec (https://console.groq.com/keys)
  // ============================================================================
  const groqKey = customCredentials?.groqApiKey || process.env.GROQ_API_KEY;
  if (groqKey && groqKey.trim().length > 10) {
    try {
      const groqResult = await callGroqChat(groqKey, systemPrompt, history, userQuery);
      if (groqResult && groqResult.text.trim()) {
        return {
          answer: groqResult.text,
          source: "GROQ_LLAMA_LIVE",
          modelUsed: `Groq Cloud (${groqResult.model})`,
        };
      }
    } catch (groqErr) {
      console.warn("Groq live invocation notice:", (groqErr as Error)?.message);
    }
  }

  // ============================================================================
  // 3. INSTANT FREE LIVE LLM: GOOGLE GEMINI 2.0 FLASH
  // Zero setup, 100% free tier (https://aistudio.google.com/app/apikey)
  // ============================================================================
  const geminiKey = customCredentials?.geminiApiKey || process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim().length > 10) {
    try {
      const geminiAnswer = await callGeminiChat(geminiKey, systemPrompt, history, userQuery);
      if (geminiAnswer && geminiAnswer.trim()) {
        return {
          answer: geminiAnswer,
          source: "GOOGLE_GEMINI_LIVE",
          modelUsed: "Google Gemini 2.0 Flash",
        };
      }
    } catch (geminiErr) {
      console.warn("Gemini live invocation notice:", (geminiErr as Error)?.message);
    }
  }

  // ============================================================================
  // 4. ZERO-FAIL CIVIC RAG ENGINE (OFFLINE / LOCALSTACK / ZERO-KEY MODE)
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
        ? `नमस्ते **${effectiveProfile.name || "नागरिक"}**! 👋 मैं आपका **जनसेतु एआई (JanSetu AI) नागरिक सहायक** हूँ।

🎯 **चयनित योजना (ऑटो-डिटेक्टेड):** **${currentTargetScheme.title}** (\`${currentTargetScheme.shortCode}\`)
• **संबद्ध मंत्रालय:** ${currentTargetScheme.ministry}
• **वित्तीय लाभ:** **${currentTargetScheme.benefitAmount}**
• **पात्रता स्थिति:** ${isCurrentSchemeEligible ? "✅ **100% पात्र (Eligible)**" : `⚠️ **अपात्र:** ${currentSchemeEval?.failedReasons.join("; ") || "शर्तें मेल नहीं खातीं"}`}
• **अधिकृत पोर्टल:** [${currentTargetScheme.portalName}](${currentTargetScheme.officialPortalUrl})

मैं आपके प्रश्नों के उत्तर सीधे **${currentTargetScheme.shortCode}** के अनुसार देने के लिए तैयार हूँ। आप बेझिझक पूछ सकते हैं:
• **"क्या मैं इस योजना के लिए पात्र हूँ?"**
• **"इस योजना के लिए कौन से दस्तावेज आवश्यक हैं?"**
• **"5-चरणीय सत्यापन रोडमैप और समय-सीमा क्या है?"**
• **"आवेदन कैसे करें (How to apply)?"**
• **"मेरे जिले में नजदीकी सेवा केंद्र कहाँ है?"**`
        : `Hello **${effectiveProfile.name || "Citizen"}**! 👋 I am your **JanSetu AI Civic Copilot**.

🎯 **Active Scheme Auto-Detected:** **${currentTargetScheme.title}** (\`${currentTargetScheme.shortCode}\`)
• **Administering Authority:** ${currentTargetScheme.ministry}
• **Statutory Benefit:** **${currentTargetScheme.benefitAmount}**
• **Cedar Policy Status:** ${isCurrentSchemeEligible ? "✅ **100% ELIGIBLE** for your active profile" : `⚠️ **Currently Ineligible** (${currentSchemeEval?.failedReasons.join("; ") || "Criteria mismatch"})`}
• **Official Portal:** [${currentTargetScheme.portalName}](${currentTargetScheme.officialPortalUrl})

I have automatically focused on **${currentTargetScheme.shortCode}**. Ask me anything without typing the scheme name:
• **"Am I eligible for this scheme?"**
• **"What are the documents required for this scheme?"**
• **"What are the 5 verification stages & timeline?"**
• **"How can I do it / apply step-by-step?"**
• **"Where is the nearest Seva Center to submit documents?"**
• **"Check my document audit & NPCI status"**`;
  }

  // B. SPECIFIC ELIGIBILITY QUERY FOR CURRENT TARGET SCHEME ("am i eligible", "do i qualify", "can i apply for this", etc.)
  else if (
    queryLower.includes("am i eligible") ||
    queryLower.includes("do i qualify") ||
    queryLower.includes("can i apply for this") ||
    queryLower.includes("am i allowed") ||
    queryLower.includes("is this approved") ||
    queryLower.includes("can i get this") ||
    (queryLower.includes("eligible") && (queryLower.includes("this") || queryLower.includes("it") || queryLower.includes(currentTargetScheme.shortCode.toLowerCase())))
  ) {
    matchedSchemes.push(currentTargetScheme.id);
    if (language === "hi") {
      if (isCurrentSchemeEligible) {
        answer = `**✅ हाँ! आप ${currentTargetScheme.title} (${currentTargetScheme.shortCode}) के लिए 100% पात्र (Eligible) हैं!**

*(AWS Cedar कानूनी नियमों के अनुसार ${effectiveProfile.name || "आपकी प्रोफ़ाइल"} का मूल्यांकन)*

• **आप क्यों पात्र हैं:**
  ↳ **पारिवारिक आय:** ₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")} (निर्धारित सीमा ₹${currentTargetScheme.maxIncome === 0 ? "कोई सीमा नहीं" : `${(currentTargetScheme.maxIncome / 100000).toFixed(1)} लाख`} के भीतर है)।
  ↳ **सामाजिक श्रेणी:** **${effectiveProfile.category}** ${effectiveProfile.tnCommunity ? `(${effectiveProfile.tnCommunity})` : effectiveProfile.apCommunity ? `(${effectiveProfile.apCommunity})` : ""} मान्य है।
  ↳ **शिक्षा स्तर:** **${effectiveProfile.educationLevel}** (${effectiveProfile.courseType}) पूरी तरह से कवर है।
  ↳ **राज्य अधिकार क्षेत्र:** **${effectiveProfile.state}** योजना क्षेत्र से मेल खाता है।
• **वित्तीय लाभ:** **${currentTargetScheme.benefitAmount}**
• **आवेदन पोर्टल:** [${currentTargetScheme.portalName}](${currentTargetScheme.officialPortalUrl})
• **अंतिम तिथि:** ${currentTargetScheme.deadline} (${currentTargetScheme.daysRemaining} दिन शेष)

👉 **अगला कदम:** मुझसे पूछें: *"इस योजना के लिए आवश्यक दस्तावेज क्या हैं?"* या *"आवेदन कैसे करें?"*`;
      } else {
        answer = `**❌ आप वर्तमान में ${currentTargetScheme.title} (${currentTargetScheme.shortCode}) के लिए पात्र नहीं हैं:**

*(AWS Cedar कानूनी नियमों के अनुसार ${effectiveProfile.name || "आपकी प्रोफ़ाइल"} का मूल्यांकन)*

• **अपात्रता का कारण:** ${currentSchemeEval?.failedReasons.length ? currentSchemeEval.failedReasons.join("; ") : "प्रोफ़ाइल कानूनी शर्तों को पूरा नहीं करती है।"}
• **वैधानिक आवश्यकताएं:** आय सीमा: ₹${currentTargetScheme.maxIncome === 0 ? "कोई सीमा नहीं" : `${(currentTargetScheme.maxIncome / 100000).toFixed(1)} लाख`}, मान्य श्रेणियां: ${currentTargetScheme.targetCategories.join(", ")}, स्तर: ${currentTargetScheme.level === "Central" ? "अखिल भारतीय" : currentTargetScheme.applicableStates?.join(", ") || "राज्य विशिष्ट"}।

💡 **वैकल्पिक सुझाव:** आप अन्य **${eligibleResults.length} योजनाओं** के लिए पात्र हैं! मुझसे पूछें: *"मैं किन योजनाओं के लिए पात्र हूँ?"*`;
      }
    } else {
      if (isCurrentSchemeEligible) {
        answer = `**✅ Yes! You are 100% ELIGIBLE for ${currentTargetScheme.title} (${currentTargetScheme.shortCode})!**

*(Evaluated under deterministic AWS Cedar policies against the active profile of **${effectiveProfile.name || "Citizen"}**)*

• **Why Your Profile Qualifies:**
  ↳ **Household Income:** ₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")} is within the statutory ceiling of ₹${currentTargetScheme.maxIncome === 0 ? "No Maximum Limit" : `${(currentTargetScheme.maxIncome / 100000).toFixed(1)} Lakh / Year`}.
  ↳ **Social Category:** **${effectiveProfile.category}** ${effectiveProfile.tnCommunity ? `(${effectiveProfile.tnCommunity})` : effectiveProfile.apCommunity ? `(${effectiveProfile.apCommunity})` : ""} meets statutory affirmative action quotas (${currentTargetScheme.targetCategories.join(", ")}).
  ↳ **Academic Level:** **${effectiveProfile.educationLevel}** (${effectiveProfile.courseType}) is fully covered.
  ↳ **Domicile Jurisdiction:** **${effectiveProfile.state}** matches the governing state administration.
• **Statutory Entitlement Benefit:** **${currentTargetScheme.benefitAmount}**
• **Official Portal:** [${currentTargetScheme.portalName}](${currentTargetScheme.officialPortalUrl})
• **Application Deadline:** ${currentTargetScheme.deadline} (${currentTargetScheme.daysRemaining} days remaining)

👉 **Recommended Next Steps:** Ask me *"What are the documents required for this scheme?"* or *"How can I do it / apply step-by-step?"*`;
      } else {
        answer = `**❌ You are currently NOT eligible for ${currentTargetScheme.title} (${currentTargetScheme.shortCode}):**

*(Evaluated under deterministic AWS Cedar policies against the active profile of **${effectiveProfile.name || "Citizen"}**)*

• **Exact Reason(s) for Denial:** ${currentSchemeEval?.failedReasons.length ? currentSchemeEval.failedReasons.join("; ") : "Current profile parameters do not satisfy mandatory statutory criteria."}
• **Statutory Scheme Benchmarks:** Maximum Income: ₹${currentTargetScheme.maxIncome === 0 ? "No Limit" : `${(currentTargetScheme.maxIncome / 100000).toFixed(1)} Lakh`}, Categories: ${currentTargetScheme.targetCategories.join(", ")}, Domicile: ${currentTargetScheme.level === "Central" ? "National" : currentTargetScheme.applicableStates?.join(", ") || "State Specific"}.

💡 **Alternative Action:** You ARE currently 100% eligible for **${eligibleResults.length} other government schemes**! Ask me: *"What are the eligible schemes I am eligible for?"* to explore them.`;
      }
    }
  }

  // C. 5-STAGE VERIFICATION ROADMAP & GATES ("stages", "gates", "verification gates", "timeline", "pipeline", etc.)
  else if (
    queryLower.includes("stage") ||
    queryLower.includes("gate") ||
    queryLower.includes("timeline") ||
    queryLower.includes("milestone") ||
    queryLower.includes("pipeline") ||
    queryLower.includes("rejection risk") ||
    queryLower.includes("approval process") ||
    queryLower.includes("सत्यापन") ||
    queryLower.includes("चरण")
  ) {
    const target =
      SCHEMES_DATABASE.find((s) => {
        const id = s.id.toLowerCase();
        const code = s.shortCode.toLowerCase();
        return queryLower.includes(id) || queryLower.includes(code);
      }) || currentTargetScheme;
    const targetRoadmap = getSchemeRoadmap(target.id);
    matchedSchemes.push(target.id);

    if (language === "hi") {
      answer = `**🛡️ ${target.shortCode} का 5-चरणीय सत्यापन रोडमैप और रिजेक्शन गेट्स:**

${targetRoadmap.stages
  .map(
    (stage) => `**चरण ${stage.stageNumber}: ${stage.stageName}**
  • **सत्यापन अधिकारी (Actor):** ${stage.actor}
  • **वैधानिक समय-सीमा:** ${stage.timeline}
  • **विवरण:** ${stage.description}
  • **आवेदक कार्रवाई:** ${stage.actionItem}
  • ⚠️ **रिजेक्शन का जोखिम:** ${stage.commonPitfall}`
  )
  .join("\n\n")}

💡 **ऑफ़लाइन काउंटर:** ${targetRoadmap.offlineCounter}
👉 आप पूछ सकते हैं: *"आवेदन कैसे करें?"* या *"कौन-कौन से दस्तावेज आवश्यक हैं?"*`;
    } else {
      answer = `**🛡️ 5-Stage Verification Roadmap & Rejection Gates for ${target.title} (${target.shortCode}):**

${targetRoadmap.stages
  .map(
    (stage) => `**Stage ${stage.stageNumber}: ${stage.stageName}**
  • **Verifying Authority (Actor):** ${stage.actor}
  • **Statutory SLA Timeline:** ${stage.timeline}
  • **Description:** ${stage.description}
  • **Mandatory Action:** ${stage.actionItem}
  • ⚠️ **Rejection Pitfall:** ${stage.commonPitfall}`
  )
  .join("\n\n")}

📍 **Physical Counter:** ${targetRoadmap.offlineCounter}
👉 Next Steps: Ask me *"What are the documents required for this scheme?"* or *"How can I do it?"*`;
    }
  }

  // D. SEVA CENTERS & OFFLINE COUNTERS ("seva center", "offline", "counter", "where to submit", "office", etc.)
  else if (
    queryLower.includes("seva") ||
    queryLower.includes("counter") ||
    queryLower.includes("offline") ||
    queryLower.includes("kiosk") ||
    queryLower.includes("where to submit") ||
    queryLower.includes("where to go") ||
    queryLower.includes("where can i go") ||
    queryLower.includes("district office") ||
    queryLower.includes("sachivalayam") ||
    queryLower.includes("meeseva") ||
    queryLower.includes("e-sevai") ||
    queryLower.includes("physical") ||
    queryLower.includes("सेवा केंद्र") ||
    queryLower.includes("कार्यालय")
  ) {
    const target =
      SCHEMES_DATABASE.find((s) => {
        const id = s.id.toLowerCase();
        const code = s.shortCode.toLowerCase();
        return queryLower.includes(id) || queryLower.includes(code);
      }) || currentTargetScheme;
    const targetRoadmap = getSchemeRoadmap(target.id);
    matchedSchemes.push(target.id);

    if (language === "hi") {
      answer = `**📍 ${target.shortCode} हेतु अधिकृत ऑफ़लाइन काउंटर एवं सेवा केंद्र:**

• **नागरिक का पता:** ${effectiveProfile.villageOrTown ? `${effectiveProfile.villageOrTown}, ` : ""}${effectiveProfile.district || "जिला मुख्यालय"}, ${effectiveProfile.state}
• **प्राथमिक भौतिक काउंटर:** **${targetRoadmap.offlineCounter}**
• **कागजी फाइल जमा करने की प्रक्रिया:**
  1. **संस्थान डेस्क:** ऑनलाइन सबमिशन के 7–10 दिनों के भीतर अपने कॉलेज/स्कूल के नोडल अधिकारी (INO) के पास बोनाफाइड और हस्ताक्षरित डोजियर जमा करें।
  2. **ग्राम/वार्ड सचिवालय अथवा सीएससी (MeeSeva/e-Sevai):** प्रमाण पत्र बनवाने, बायोमेट्रिक e-KYC पूरा करने अथवा बैंक डीबीटी सीडिंग पर्ची जमा करने हेतु अपने नजदीकी केंद्र पर जाएं।
• **सरकारी वैधानिक शुल्क (Citizen Charter):**
  - **छात्रवृत्ति ऑनलाइन आवेदन:** **₹0 (पूरी तरह निःशुल्क)**
  - **प्रमाण पत्र आवेदन (CSC):** अधिकतम **₹25 से ₹30**
• **राष्ट्रीय शिकायत हेल्पलाइन:** \`1800-3000-3468\``;
    } else {
      answer = `**📍 Official Physical Counter & Seva Centers for ${target.title} (${target.shortCode}):**

• **Applicant Domicile:** **${effectiveProfile.villageOrTown ? `${effectiveProfile.villageOrTown}, ` : ""}${effectiveProfile.district || "District Center"}, ${effectiveProfile.state}**
• **Designated Offline Desk:** **${targetRoadmap.offlineCounter}**
• **Where to Submit Your Physical Files:**
  1. **Institutional Nodal Desk:** Submit your signed application dossier, bonafide certificate, and fee receipts to your Institute Nodal Officer (INO) within 7–10 days of online portal entry.
  2. **Civic Seva Kiosk / Secretariat:** Visit your local Grama / Ward Sachivalayam or MeeSeva / e-Sevai kiosk in **${effectiveProfile.district || effectiveProfile.state}** for biometric e-KYC, caste/income certificate issuance, and status tracking.
• **Statutory Citizen Charter Fees:**
  - **Online Scholarship Application:** **₹0.00 (Statutorily 100% Free)**. No cyber cafe or college desk may charge you for applying.
  - **CSC Certificate Issuances:** Strictly capped at **₹25 to ₹30** per certificate.
• **National Grievance Toll-Free:** \`1800-3000-3468\``;
    }
  }

  // E. NON-ELIGIBLE / INELIGIBLE SCHEMES ("what are the non-eligible schemes for me", "why not eligible", etc.)
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

  // F. ALL ELIGIBLE SCHEMES FOR PROFILE ("what are the eligible schemes I am eligible for", "available schemes", etc.)
  else if (
    queryLower.includes("eligible schemes") ||
    queryLower.includes("which schemes am i") ||
    queryLower.includes("what schemes am i") ||
    queryLower.includes("schemes for me") ||
    queryLower.includes("available schemes") ||
    queryLower.includes("schemes available") ||
    queryLower.includes("show me schemes") ||
    queryLower.includes("what can i apply") ||
    queryLower.includes("all schemes") ||
    queryLower.includes("उपलब्ध योजनाएं")
  ) {
    const auditRes = context?.auditResult;
    const docSummarySnippetEn = auditRes ? `\n\n📄 **Your Document Pre-Flight Status:**\n• Aadhaar Name Match: **${auditRes.nameMatchPercentage}%** • NPCI Bank DBT: **${auditRes.npciStatus}** • Readiness: **${auditRes.overallReadinessScore}/100** ${auditRes.overallReadinessScore >= 90 ? "(✔️ Ready to Apply)" : "(⚠️ Resolve document issues in Tab 3 before submission)"}` : "";
    const docSummarySnippetHi = auditRes ? `\n\n📄 **आपके दस्तावेजों की प्री-फ़्लाइट स्थिति:**\n• आधार नाम मिलान: **${auditRes.nameMatchPercentage}%** • NPCI बैंक DBT: **${auditRes.npciStatus}** • तत्परता स्कोर: **${auditRes.overallReadinessScore}/100** ${auditRes.overallReadinessScore >= 90 ? "(✔️ आवेदन हेतु तैयार)" : "(⚠️ सबमिशन से पहले टैब 3 में लंबित दस्तावेज ठीक करें)"}` : "";

    if (language === "hi") {
      if (eligibleResults.length === 0) {
        answer = `**⚠️ वर्तमान में आपकी प्रोफ़ाइल से मेल खाने वाली कोई सक्रिय योजना नहीं मिली:**

*(प्रोफ़ाइल: **${effectiveProfile.name || "विद्यार्थी"}**, राज्य: **${effectiveProfile.state}**, श्रेणी: **${effectiveProfile.category}**, आय: **₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}**)*

आपकी वार्षिक पारिवारिक आय या श्रेणी वर्तमान योजनाओं की अधिकतम सीमाओं से अधिक हो सकती है। आप मुझसे पूछ सकते हैं: *"मेरे लिए कौन सी योजनाएं अपात्र हैं और क्यों?"*`;
      } else {
        answer = `**✅ वे योजनाएं जिनके लिए आप 100% पात्र (Eligible) हैं:**

*(प्रोफ़ाइल: **${effectiveProfile.name || "विद्यार्थी"}**, राज्य: **${effectiveProfile.state}**, श्रेणी: **${effectiveProfile.category}**, आय: **₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}**)*

${eligibleResults
  .map(
    (r, idx) => `**${idx + 1}. ${r.scheme.title}** (${r.scheme.shortCode})
  • **वित्तीय लाभ (Benefit):** ${r.scheme.benefitAmount}
  • **आप क्यों पात्र हैं:** आपकी आय (₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")}) निर्धारित सीमा (₹${(r.scheme.maxIncome / 100000).toFixed(1)} लाख) के भीतर है।
  • **आवेदन पोर्टल:** [${r.scheme.portalName}](${r.scheme.officialPortalUrl})
  • **दस्तावेज स्थिति:** ${r.missingPrerequisites.length > 0 ? `⚠️ आवश्यक: ${r.missingPrerequisites.map((p) => p.title).join(", ")}` : "✔️ आवेदन हेतु तैयार"}`
  )
  .join("\n\n")}${docSummarySnippetHi}

👉 वर्तमान चयनित योजना: **${currentTargetScheme.shortCode}**। आप पूछ सकते हैं: *"इस योजना के लिए आवश्यक दस्तावेज क्या हैं?"* या *"आवेदन कैसे करें?"*`;
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
  • **Why You Qualify:** Income ₹${effectiveProfile.annualFamilyIncome.toLocaleString("en-IN")} is within ₹${(r.scheme.maxIncome / 100000).toFixed(1)} Lakh ceiling; category **${effectiveProfile.category}** and education stage match.
  • **Official Portal:** [${r.scheme.portalName}](${r.scheme.officialPortalUrl})
  • **Status:** ${r.missingPrerequisites.length > 0 ? `⚠️ Prerequisite Action: ${r.missingPrerequisites.map((p) => p.title).join(", ")}` : "✔️ All core criteria satisfied"}`
  )
  .join("\n\n")}${docSummarySnippetEn}

🎯 **Currently Active Scheme:** **${currentTargetScheme.shortCode}** (${currentTargetScheme.title})
👉 Ask me: *"What are the documents required for ${currentTargetScheme.shortCode}?"* or *"How can I do it?"*`;
      }
    }
  }

  // G. CITIZEN'S PRE-FLIGHT DOCUMENT AUDIT & VERIFICATION STATUS
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
    queryLower.includes("दस्तावेज जांच")
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

  // H. REQUIREMENTS FOR A SCHEME ("what are the requirements for this scheme")
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
        return (queryLower.includes(id) || queryLower.includes(code)) && !queryLower.includes("this");
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

  // I. DOCUMENTS REQUIRED ("what are the documents required for this particular scheme")
  else if (
    queryLower.includes("document") ||
    queryLower.includes("documnt") ||
    queryLower.includes("doc") ||
    queryLower.includes("certificate") ||
    queryLower.includes("paper") ||
    queryLower.includes("checklist") ||
    queryLower.includes("proof") ||
    queryLower.includes("दस्तावेज") ||
    queryLower.includes("प्रमाण पत्र")
  ) {
    const target =
      SCHEMES_DATABASE.find((s) => {
        const id = s.id.toLowerCase();
        const code = s.shortCode.toLowerCase();
        return (queryLower.includes(id) || queryLower.includes(code)) && !queryLower.includes("this");
      }) || currentTargetScheme;

    const targetRoadmap = getSchemeRoadmap(target.id);
    matchedSchemes.push(target.id);

    if (language === "hi") {
      answer = `**📑 ${target.title} (${target.shortCode}) हेतु 3-स्तरीय अनिवार्य दस्तावेज सूची:**

**1. टियर 1: मूल पहचान दस्तावेज (Base Identity):**
${targetRoadmap.tier1BaseIdentity.map((d) => `  • **${d.name}:** ${d.requirement}`).join("\n")}

**2. टियर 2: वैधानिक सरकारी प्रमाण पत्र (Statutory Revenue):**
${targetRoadmap.tier2StatutoryCertificates.length > 0 ? targetRoadmap.tier2StatutoryCertificates.map((c) => `  • **${c.name}:** ${c.authority} द्वारा जारी (समय: ${c.turnaround}, वैधानिक शुल्क: ${c.statutoryCost}) — *${c.keyCondition}*`).join("\n") : "  • इस सामान्य योजना हेतु किसी विशेष जाति प्रमाण पत्र की आवश्यकता नहीं है।"}

**3. टियर 3: संस्थागत व बैंकिंग निकासी (Institutional Clearance):**
${targetRoadmap.tier3Institutional.map((i) => `  • **${i.name}:** ${i.authority} — ${i.action}`).join("\n")}
  • **बैंकिंग आवश्यकता:** ${targetRoadmap.bankingRequirement}

💡 **टिप:** यदि आपके आधार और 10वीं की मार्कशीट में नाम की स्पेलिंग में अंतर है, तो जनसेतु के **"3. Document Upload & Matcher"** टैब से नोटरी एफिडेविट प्रारूप डाउनलोड करें।`;
    } else {
      answer = `**📑 Dedicated 3-Tier Document Checklist for ${target.title} (${target.shortCode}):**

**1. Tier 1: Base Identity Documents (Digital Verification):**
${targetRoadmap.tier1BaseIdentity.map((d) => `  • **${d.name}:** ${d.requirement}`).join("\n")}

**2. Tier 2: Statutory Revenue Certificates (State Government):**
${targetRoadmap.tier2StatutoryCertificates.length > 0 ? targetRoadmap.tier2StatutoryCertificates.map((c) => `  • **${c.name}:** Issued by ${c.authority} (SLA Turnaround: ${c.turnaround}, Statutory Fee: ${c.statutoryCost}) — *${c.keyCondition}*`).join("\n") : "  • No special caste/community certificates mandated for this scheme."}

**3. Tier 3: Institutional Clearances & Banking Gateway:**
${targetRoadmap.tier3Institutional.map((i) => `  • **${i.name}:** ${i.authority} — ${i.action}`).join("\n")}
  • **Banking Protocol:** ${targetRoadmap.bankingRequirement}

💡 **Actionable Tip:** If your name on Aadhaar differs from your marksheet, navigate to **Tab 3 ("Document Upload & Matcher")** to generate an instant Notarized Name Affidavit!`;
    }
  }

  // J. HOW CAN I DO IT? / HOW TO APPLY ("how can i do it", "how to apply", "steps", etc.)
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
    const target =
      SCHEMES_DATABASE.find((s) => {
        const id = s.id.toLowerCase();
        const code = s.shortCode.toLowerCase();
        return (queryLower.includes(id) || queryLower.includes(code)) && !queryLower.includes("this");
      }) || currentTargetScheme;

    const targetRoadmap = getSchemeRoadmap(target.id);
    matchedSchemes.push(target.id);

    if (language === "hi") {
      answer = `**🚀 ${target.title} (${target.shortCode}) हेतु 5-चरणीय आवेदन प्रक्रिया (How To Do It):**

1. **चरण 1: प्री-फ़्लाइट दस्तावेज़ और बैंक तैयारी**
   • जनसेतु के **"3. Document Upload & Matcher"** टैब पर आधार व 10वीं मार्कशीट नाम मिलान जांचें।
   • सुनिश्चित करें कि बैंक खाता NPCI DBT मैपर पर एक्टिवेट (Seeded) है।

2. **चरण 2: आधिकारिक पोर्टल पर ऑनलाइन पंजीकरण**
   • [${target.portalName}](${target.officialPortalUrl}) पर जाएं।
   • आधार ओटीपी या बायोमेट्रिक e-KYC के साथ One-Time Registration (OTR) पूरा करें।

3. **चरण 3: संस्थागत सत्यापन (Institutional Nodal Desk)**
   • ऑनलाइन फॉर्म की मुद्रित प्रति, बोनाफाइड और शुल्क रसीद अपने कॉलेज/स्कूल के नोडल अधिकारी (INO) को जमा करें।

4. **चरण 4: सक्षम अधिकारी मंजूरी**
   • ${targetRoadmap.stages[3]?.actor || "सक्षम अधिकारी"} द्वारा कोटे और आय का सत्यापन।
   • ऑनलाइन आवेदन स्थिति की साप्ताहिक निगरानी करें।

5. **चरण 5: प्रत्यक्ष लाभ अंतरण (DBT Disbursal)**
   • PFMS/CFMS के माध्यम से छात्रवृत्ति राशि सीधे आपके बैंक खाते में जमा की जाती है।

📍 **भौतिक सहायता काउंटर:** ${targetRoadmap.offlineCounter}`;
    } else {
      answer = `**🚀 Complete 5-Stage Action Roadmap for ${target.title} (${target.shortCode}):**

1. **Stage 1: Pre-Flight Document & Bank Readiness**
   • Open **Tab 3 ("Document Upload & Matcher")** to verify Aadhaar vs 10th marksheet name alignment.
   • Ensure your bank account has active **NPCI Aadhaar DBT Seeding** so government funds do not bounce.

2. **Stage 2: Official Portal Registration & Form Submission**
   • Navigate to the official portal: [${target.portalName}](${target.officialPortalUrl}).
   • Complete Aadhaar e-KYC OTR registration, select your academic course, and upload required certificates.
   • Download and print your final application acknowledgment.

3. **Stage 3: First-Tier Institutional Verification**
   • Submit physical printouts of your application form, bonafide certificate, and fee receipts to your **Institute Nodal Officer (INO)** within 7–10 days.

4. **Stage 4: District & State Authority Sanction**
   • Verified by **${targetRoadmap.stages[3]?.actor || "District Welfare Officer"}** against approved quotas and income rules.
   • Weekly tracking via portal login; resolve any defective remarks within 72 hours.

5. **Stage 5: Electronic Disbursal via PFMS / State Treasury Gateway**
   • Financial grant of **${target.benefitAmount}** is credited directly via Aadhaar Payment Bridge.

📍 **Designated Physical Counter:** ${targetRoadmap.offlineCounter}`;
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
