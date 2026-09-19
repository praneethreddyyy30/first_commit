// Verification script for /api/audit/extract-document

async function runTests() {
  console.log("=================================================================");
  console.log("🧪 JANSETU AI DOCUMENT VERIFICATION & ANTI-FRAUD SCANNER TEST");
  console.log("=================================================================\n");

  const testCases = [
    {
      description: "TEST 1: Uploading a Job Resume to Aadhaar Slot (User's Bug Report)",
      fileName: "Sai_Praneeth_Resume.pdf",
      fileType: "application/pdf",
      fileData: Buffer.from("Work Experience: Full-Stack Engineer, Skills: React, Node, GitHub: https://github.com").toString("base64"),
      expectedType: "aadhaar",
      expectValid: false,
    },
    {
      description: "TEST 2: Uploading a Curriculum Vitae (CV) to 10th Marksheet Slot",
      fileName: "Curriculum_Vitae_2026.docx",
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileData: Buffer.from("Curriculum Vitae: Objective, Education, Technical Skills").toString("base64"),
      expectedType: "marksheet",
      expectValid: false,
    },
    {
      description: "TEST 3: Uploading an Amazon Commercial Tax Invoice to Bank Passbook Slot",
      fileName: "Amazon_Tax_Invoice_94819.pdf",
      fileType: "application/pdf",
      fileData: Buffer.from("Tax Invoice / Bill of Supply: GSTIN: 29AABCU9603R1ZM, Sold by Amazon").toString("base64"),
      expectedType: "bank",
      expectValid: false,
    },
    {
      description: "TEST 4: Wrong Document Type: Aadhaar Card uploaded to 10th Marksheet Slot",
      fileName: "Aadhaar_Card_Sravani.pdf",
      fileType: "application/pdf",
      fileData: Buffer.from("Government of India, Unique Identification Authority of India, UIDAI, 4920 1829 4819").toString("base64"),
      expectedType: "marksheet",
      expectValid: false,
    },
    {
      description: "TEST 5: Legitimate Aadhaar Card to Aadhaar Slot",
      fileName: "Aadhaar_Card_Madhira_Sravani.pdf",
      fileType: "application/pdf",
      fileData: Buffer.from("Government of India, Unique Identification Authority of India, UIDAI, 4920 1829 4819").toString("base64"),
      expectedType: "aadhaar",
      expectValid: true,
    },
    {
      description: "TEST 6: Legitimate 10th / Intermediate Marksheet to Marksheet Slot",
      fileName: "AP_BIE_Inter_MarksMemo.jpg",
      fileType: "image/jpeg",
      fileData: Buffer.from("Board of Intermediate Education AP, Secondary School Certificate, Marks Memo, Roll No: BIE-74819").toString("base64"),
      expectedType: "marksheet",
      expectValid: true,
    },
    {
      description: "TEST 7: Legitimate Bank Passbook to Bank Slot",
      fileName: "APGB_BankPassbook.jpg",
      fileType: "image/jpeg",
      fileData: Buffer.from("Andhra Pragathi Grameena Bank, IFSC Code: APGB0001234, Account No: 38920192819").toString("base64"),
      expectedType: "bank",
      expectValid: true,
    },
    {
      description: "TEST 8: Legitimate Caste Certificate to Caste Slot",
      fileName: "MeeSeva_Caste_Certificate.pdf",
      fileType: "application/pdf",
      fileData: Buffer.from("Government of Andhra Pradesh, Revenue Department, Tahsildar Mandal Office, Community and Caste Certificate").toString("base64"),
      expectedType: "caste",
      expectValid: true,
    },
  ];

  let passedAll = true;

  for (const tc of testCases) {
    try {
      const res = await fetch("http://localhost:3000/api/audit/extract-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: tc.fileName,
          fileType: tc.fileType,
          fileData: tc.fileData,
          expectedType: tc.expectedType,
        }),
      });

      const data = await res.json();
      const result = data.result;

      const matchesExpected = result?.isValidDocument === tc.expectValid;
      const passIcon = matchesExpected ? "✅ PASS" : "❌ FAIL";

      console.log(`-----------------------------------------------------------------`);
      console.log(`${passIcon}: ${tc.description}`);
      console.log(`   File: '${tc.fileName}' | Expected Slot: '${tc.expectedType}'`);
      console.log(`   isValidDocument: ${result?.isValidDocument} (Expected: ${tc.expectValid})`);
      console.log(`   Confidence Score: ${result?.confidenceScore}%`);
      console.log(`   Detected Doc Type: ${result?.detectedDocType}`);
      if (result?.validationWarnings?.length > 0) {
        console.log(`   Warnings/Reason: ${result.validationWarnings[0]}`);
      }
      if (result?.extractedName) {
        console.log(`   Extracted Name: ${result.extractedName}`);
      }

      if (!matchesExpected) {
        passedAll = false;
      }
    } catch (err) {
      console.error(`❌ ERROR testing '${tc.fileName}':`, err.message);
      passedAll = false;
    }
  }

  console.log("\n=================================================================");
  if (passedAll) {
    console.log("🎉 ALL 8 TESTS PASSED! RESUME & FRAUD DETECTION IS 100% OPERATIONAL.");
  } else {
    console.log("⚠️ SOME TESTS FAILED.");
  }
  console.log("=================================================================\n");
}

runTests();
