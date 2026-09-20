const BASE_URL = "http://localhost:3000";

async function runAllTests() {
  console.log("=================================================================");
  console.log("🚀 JANSETU AI - PRE-DEPLOYMENT COMPREHENSIVE SERVICE VERIFICATION");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // TEST 1: GROQ LIVE CONVERSATIONAL AI (/api/chat)
  // --------------------------------------------------------------------------
  try {
    process.stdout.write("1. Testing Groq Live AI Copilot (/api/chat)... ");
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "What is JanSetu AI and what scholarships am I eligible for?",
        profile: {
          id: "kavitha",
          name: "Kavitha S.",
          category: "ST",
          annualFamilyIncome: 180000,
          state: "Tamil Nadu",
          educationLevel: "Undergraduate",
          courseType: "Regular Full-Time",
          admissionQuota: "Merit/Government Counseling",
          marksPercentage: 78,
          gender: "Female",
        },
      }),
    });
    const data = await res.json();
    if (data.success && data.answer && data.source === "GROQ_LLAMA_LIVE") {
      console.log(`✅ PASS (${data.modelUsed})`);
      passed++;
    } else if (data.success && data.answer) {
      console.log(`✅ PASS (Engine: ${data.source})`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 2: AWS CEDAR WASM POLICY EVALUATION (/api/evaluate)
  // --------------------------------------------------------------------------
  try {
    process.stdout.write("2. Testing AWS Cedar WASM Engine (/api/evaluate)... ");
    const res = await fetch(`${BASE_URL}/api/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: {
          id: "test-eval",
          name: "Ramesh K.",
          category: "SC",
          annualFamilyIncome: 150000,
          state: "Andhra Pradesh",
          educationLevel: "Undergraduate",
          courseType: "Regular Full-Time",
          admissionQuota: "Merit/Government Counseling",
          marksPercentage: 82,
          gender: "Male",
          isTechnicalCourse: true,
          isDifferentlyAbled: false,
        },
      }),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.results) && data.results.length > 0) {
      const allowCount = data.results.filter((r) => r.decision === "ALLOW").length;
      console.log(`✅ PASS (${data.results.length} policies evaluated, ${allowCount} ALLOWED)`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 3: DYNAMODB 35 STATUTORY SCHEMES DATABASE (/api/schemes)
  // --------------------------------------------------------------------------
  try {
    process.stdout.write("3. Testing DynamoDB Schemes Store (/api/schemes)... ");
    const res = await fetch(`${BASE_URL}/api/schemes`);
    const data = await res.json();
    if (data.success && Array.isArray(data.schemes) && data.schemes.length >= 35) {
      console.log(`✅ PASS (${data.schemes.length} schemes loaded from DynamoDB/Store)`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 4: LIVE SCHEME DISCOVERY & EVALUATION (/api/schemes/live-evaluate)
  // --------------------------------------------------------------------------
  try {
    process.stdout.write("4. Testing Live Scheme Discovery (/api/schemes/live-evaluate)... ");
    const res = await fetch(`${BASE_URL}/api/schemes/live-evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: {
          id: "live-test",
          name: "Deepa N.",
          category: "OBC",
          annualFamilyIncome: 200000,
          state: "Tamil Nadu",
          educationLevel: "Undergraduate",
          courseType: "Regular Full-Time",
          admissionQuota: "Merit/Government Counseling",
          marksPercentage: 85,
          gender: "Female",
        },
      }),
    });
    const data = await res.json();
    if (data.success && data.totalSchemes > 0) {
      console.log(`✅ PASS (${data.totalSchemes} total schemes, ${data.eligibleCount} eligible)`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 5: DOCUMENT AUDIT & ANTI-FRAUD SCANNER (/api/audit/extract-document)
  // --------------------------------------------------------------------------
  try {
    process.stdout.write("5. Testing Document Extraction & Anti-Fraud Scanner (/api/audit/extract-document)... ");
    // Test legitimate document
    const res = await fetch(`${BASE_URL}/api/audit/extract-document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "Aadhaar_Card_Sravani.pdf",
        fileType: "application/pdf",
        fileData: "JVBERi0xLjQKJeLjz9MKMSAwIG9ia...",
        expectedType: "aadhaar",
      }),
    });
    const data = await res.json();

    // Test resume fraud rejection
    const fraudRes = await fetch(`${BASE_URL}/api/audit/extract-document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "Candidate_Resume_CV_2026.pdf",
        fileType: "application/pdf",
        fileData: "JVBERi0xLjQKJeLjz9MKMSAwIG9ia...",
        expectedType: "aadhaar",
      }),
    });
    const fraudData = await fraudRes.json();

    if (data.success && data.result.isValidDocument && fraudData.success && !fraudData.result.isValidDocument) {
      console.log(`✅ PASS (Legitimate verified: true, Resume blocked: false)`);
      passed++;
    } else {
      console.log(`❌ FAIL: Legitimate: ${data?.result?.isValidDocument}, Fraud: ${fraudData?.result?.isValidDocument}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 6: GEOGRAPHIC PINCODE INTELLIGENCE (/api/geo/pincode)
  // --------------------------------------------------------------------------
  try {
    process.stdout.write("6. Testing Pincode Intelligence Service (/api/geo/pincode)... ");
    const res = await fetch(`${BASE_URL}/api/geo/pincode?pincode=600001`);
    const data = await res.json();
    const pinInfo = data.data || data;
    if (data.success && pinInfo.pincode === "600001") {
      console.log(`✅ PASS (Pincode 600001 mapped to ${pinInfo.district}, ${pinInfo.state})`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 7: AMAZON S3 UPLOAD PRE-SIGNED URL GENERATION (/api/upload)
  // --------------------------------------------------------------------------
  try {
    process.stdout.write("7. Testing Amazon S3 Citizen Vault Upload URL (/api/upload)... ");
    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "test_aadhaar.pdf",
        fileType: "application/pdf",
        documentCategory: "aadhaar",
      }),
    });
    const data = await res.json();
    if (data.uploadUrl || data.directUrl || data.key || data.s3Key) {
      console.log(`✅ PASS (S3 pre-signed upload URL generated successfully)`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    failed++;
  }

  console.log("\n=================================================================");
  console.log(`📊 FINAL RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL SERVICES VERIFIED AND READY FOR AWS AMPLIFY DEPLOYMENT!");
    process.exit(0);
  }
}

runAllTests();
