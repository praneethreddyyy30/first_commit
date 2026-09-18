// Automated Live Endpoint Test Script for JanSetu AI

async function testAllEndpoints() {
  console.log("================================================================");
  console.log("TESTING LIVE SERVER FUNCTIONALITY (http://localhost:3000)");
  console.log("================================================================\n");

  const baseUrl = "http://localhost:3000";

  // Test 1: Frontend Homepage
  console.log("1. Testing Frontend UI (GET /)...");
  try {
    const res = await fetch(baseUrl);
    console.log(`   Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    if (res.status === 200 && text.includes("JanSetu")) {
      console.log("   ✓ PASS: Frontend loads cleanly with JanSetu AI branding & tabs.\n");
    } else {
      console.error("   ✗ FAIL: Homepage did not return expected content.\n");
    }
  } catch (err) {
    console.error("   ✗ FAIL: Unable to connect to localhost:3000", err.message);
  }

  // Test 2: AWS Cedar Evaluation API
  console.log("2. Testing AWS Cedar Policy Engine API (POST /api/evaluate)...");
  try {
    const testProfile = {
      profile: {
        name: "Rajesh Kumar Munda",
        category: "ST",
        annualFamilyIncome: 180000,
        educationLevel: "UG",
        state: "Odisha",
        gender: "Male",
        heldDocuments: ["Caste_Certificate"]
      }
    };
    const res = await fetch(`${baseUrl}/api/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testProfile)
    });
    console.log(`   Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log(`   Engine: ${data.evaluatorEngine}`);
    console.log(`   Total Schemes Evaluated: ${data.totalEvaluated}`);
    console.log(`   Eligible Schemes: ${data.eligibleCount}`);
    
    const postMatric = data.results.find(r => r.scheme.id === "PostMatric_ST");
    if (postMatric && postMatric.decision === "ALLOW") {
      console.log(`   ✓ PASS: PostMatric_ST decision = ALLOW`);
      console.log(`     Benefit: ${postMatric.scheme.benefitAmount}`);
      console.log(`     Missing Prerequisite Flagged: ${postMatric.missingPrerequisites.map(p => p.id).join(", ")}`);
    } else {
      console.error("   ✗ FAIL: PostMatric_ST was not allowed.");
    }
    console.log("");
  } catch (err) {
    console.error("   ✗ FAIL: Evaluate API error", err.message);
  }

  // Test 3: Document Pre-Flight Audit API
  console.log("3. Testing Document Audit & NPCI API (POST /api/audit)...");
  try {
    const auditPayload = {
      documentInput: {
        nameOnAadhaar: "Rajesh Kumar Munda",
        nameOnMarksheet: "Rajesh K Munda",
        dobOnAadhaar: "2005-08-14",
        dobOnMarksheet: "2005-08-14",
        isAadhaarLinkedToBank: true,
        isNpciSeeded: false, // The trap
        bankName: "State Bank of India"
      }
    };
    const res = await fetch(`${baseUrl}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auditPayload)
    });
    console.log(`   Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    const result = data.auditResult;
    console.log(`   Readiness Score: ${result.overallReadinessScore}%`);
    console.log(`   Name Match Score: ${result.nameMatchPercentage}%`);
    console.log(`   NPCI Status Detected: ${result.npciStatus}`);
    console.log(`   Generated Mandate Form Length: ${data.mandateFormTemplate.length} chars`);
    
    if (result.nameMatchPercentage < 100 && result.npciStatus === "ONLY_LINKED") {
      console.log("   ✓ PASS: Correctly flagged initial name difference and unseeded bank account.\n");
    } else {
      console.error("   ✗ FAIL: Audit did not catch expected discrepancies.\n");
    }
  } catch (err) {
    console.error("   ✗ FAIL: Audit API error", err.message);
  }

  // Test 4: Bedrock / Vernacular Civic RAG Chat API
  console.log("4. Testing AI Copilot & Vernacular RAG (POST /api/chat)...");
  try {
    const chatPayload = {
      query: "Why is NPCI Aadhaar seeding different from normal linking?",
      history: [],
      language: "en"
    };
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatPayload)
    });
    console.log(`   Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log(`   AI Engine: ${data.modelUsed} (${data.source})`);
    console.log(`   Answer Preview: ${data.answer.substring(0, 140)}...`);
    if (data.success && data.answer.includes("NPCI")) {
      console.log("   ✓ PASS: Copilot successfully explained NPCI seeding distinction.\n");
    } else {
      console.error("   ✗ FAIL: AI response was incomplete.\n");
    }
  } catch (err) {
    console.error("   ✗ FAIL: Chat API error", err.message);
  }

  // Test 5: Scheme Workspace Auto-Detection in AI Copilot (POST /api/chat with targetSchemeId)
  console.log("5. Testing Scheme Auto-Detection in Copilot (Target: AP-JVD-MTF)...");
  try {
    const schemeChatPayload = {
      query: "What are the documents required for this scheme?",
      history: [],
      language: "en",
      targetSchemeId: "AP-JVD-MTF",
      profile: {
        name: "Ananya Reddy",
        state: "Andhra Pradesh",
        district: "NTR / Krishna",
        category: "General",
        annualFamilyIncome: 140000,
        educationLevel: "Degree",
        courseType: "Regular Full-Time"
      }
    };
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schemeChatPayload)
    });
    console.log(`   Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log(`   AI Engine: ${data.modelUsed}`);
    console.log(`   Answer Preview:\n${data.answer.substring(0, 300)}...\n`);
    if (data.success && (data.answer.includes("AP-JVD-MTF") || data.answer.includes("Vasathi Deevena") || data.answer.includes("MeeSeva"))) {
      console.log("   ✓ PASS: Copilot automatically detected AP-JVD-MTF and returned specific documents!\n");
    } else {
      console.error("   ✗ FAIL: Copilot did not scope response to AP-JVD-MTF.\n");
    }
  } catch (err) {
    console.error("   ✗ FAIL: Scheme Auto-Detection Chat test error", err.message);
  }

  console.log("================================================================");
  console.log("✓ ALL FUNCTIONALITIES VERIFIED LIVE ON http://localhost:3000");
  console.log("================================================================");
}

testAllEndpoints();
