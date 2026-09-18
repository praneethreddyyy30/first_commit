export interface DocumentAuditInput {
  nameOnAadhaar: string;
  nameOnMarksheet: string;
  nameOnCasteCertificate?: string;
  dobOnAadhaar?: string;
  dobOnMarksheet?: string;
  incomeCertificateIssueDate?: string;
  isAadhaarLinkedToBank: boolean;
  isNpciSeeded: boolean;
  bankName?: string;
}

export interface DocumentAuditIssue {
  severity: "CRITICAL" | "WARNING" | "RESOLVED";
  title: string;
  description: string;
  solution: string;
  statutoryReference: string;
}

export interface DocumentAuditResult {
  overallReadinessScore: number; // 0 to 100
  canSubmitNow: boolean;
  nameMatchPercentage: number;
  dobMatched: boolean;
  npciStatus: "SEEDED" | "ONLY_LINKED" | "NOT_LINKED";
  issues: DocumentAuditIssue[];
  resolutionChecklist: string[];
}

/**
 * Calculates similarity between two names using token-level matching (handling initials,
 * abbreviations, and word-order permutations common in Indian documents) and character Levenshtein distance.
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const raw1 = str1.trim();
  const raw2 = str2.trim();
  if (raw1.toLowerCase() === raw2.toLowerCase()) return 100;

  // Clean tokens: lowercase, strip punctuation like dots, commas, slashes
  const cleanTokens1 = raw1
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

  const cleanTokens2 = raw2
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

  if (cleanTokens1.length === 0 || cleanTokens2.length === 0) return 0;

  // Token-level bipartite matching (handles "M. Sravani" vs "Madhira Sravani", "Sravani M" vs "Madhira Sravani")
  const used2 = new Array(cleanTokens2.length).fill(false);
  let totalMatchWeight = 0;

  for (const t1 of cleanTokens1) {
    let bestWeight = 0;
    let bestIdx = -1;

    for (let j = 0; j < cleanTokens2.length; j++) {
      if (used2[j]) continue;
      const t2 = cleanTokens2[j];

      if (t1 === t2) {
        bestWeight = 1.0;
        bestIdx = j;
        break; // Exact token match
      } else if (
        (t1.length === 1 && t2.startsWith(t1)) ||
        (t2.length === 1 && t1.startsWith(t2))
      ) {
        // Initial match (e.g. "m" and "madhira", or "s" and "selvam")
        if (bestWeight < 0.85) {
          bestWeight = 0.85;
          bestIdx = j;
        }
      } else {
        // Check small character edit distance between tokens (e.g. "Kavitha" vs "Kavita")
        const levDist = levenshteinDistance(t1, t2);
        const maxLen = Math.max(t1.length, t2.length);
        const tokenSim = (maxLen - levDist) / maxLen;
        if (tokenSim >= 0.75 && tokenSim > bestWeight) {
          bestWeight = tokenSim * 0.85;
          bestIdx = j;
        }
      }
    }

    if (bestIdx !== -1) {
      used2[bestIdx] = true;
      totalMatchWeight += bestWeight;
    }
  }

  const maxTokenCount = Math.max(cleanTokens1.length, cleanTokens2.length);
  const tokenScore = Math.round((totalMatchWeight / maxTokenCount) * 100);

  // Also compute character-level Levenshtein similarity on normalized strings
  const s1 = cleanTokens1.join(' ');
  const s2 = cleanTokens2.join(' ');
  const charDistance = levenshteinDistance(s1, s2);
  const maxCharLen = Math.max(s1.length, s2.length);
  const charScore = maxCharLen === 0 ? 100 : Math.round(((maxCharLen - charDistance) / maxCharLen) * 100);

  return Math.max(tokenScore, charScore);
}

/**
 * Standard Levenshtein Distance
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Audits student documents before government portal submission
 */
export function auditCitizenDocuments(input: DocumentAuditInput): DocumentAuditResult {
  const issues: DocumentAuditIssue[] = [];
  const resolutionChecklist: string[] = [];
  let readiness = 100;

  // 1. Name Discrepancy Check
  const nameSim = calculateSimilarity(input.nameOnAadhaar, input.nameOnMarksheet);
  if (nameSim < 100) {
    if (nameSim >= 75) {
      readiness -= 25;
      issues.push({
        severity: "WARNING",
        title: `Name Mismatch Detected (${nameSim}% match)`,
        description: `Aadhaar card says "${input.nameOnAadhaar}" while 10th Marksheet says "${input.nameOnMarksheet}". National Scholarship Portal (NSP) uses automated e-KYC matching; slight initial expansions or spacing differences frequently cause automated portal rejections.`,
        solution: "Carry a 1-page Notarized Name Discrepancy Affidavit or update Aadhaar at your nearest Aadhaar Seva Kendra before applying.",
        statutoryReference: "NSP Operational Guidelines 2024 Clause 3.1 on Demographics e-KYC"
      });
      resolutionChecklist.push(`Generate & carry a Name Affidavit clarifying "${input.nameOnAadhaar}" and "${input.nameOnMarksheet}" refer to the same individual.`);
    } else {
      readiness -= 45;
      issues.push({
        severity: "CRITICAL",
        title: `Major Name Difference (${nameSim}% match)`,
        description: `High divergence between Aadhaar ("${input.nameOnAadhaar}") and academic marksheets ("${input.nameOnMarksheet}"). Portal validation will fail e-KYC screening.`,
        solution: "Get your Aadhaar updated to match your matriculation marksheet at a post office/bank Aadhaar Kendra.",
        statutoryReference: "UIDAI Aadhaar Regulations Sec. 28 & NSP Rulebook"
      });
      resolutionChecklist.push("Update Aadhaar name at Aadhaar Seva Kendra with 10th certificate as proof.");
    }
  } else {
    issues.push({
      severity: "RESOLVED",
      title: "Name Verification Passed (100% Match)",
      description: `Exact match found between Aadhaar and academic marksheets ("${input.nameOnAadhaar}").`,
      solution: "No action required.",
      statutoryReference: "Compliant with NSP e-KYC"
    });
  }

  // 2. Date of Birth Check
  let dobMatched = true;
  if (input.dobOnAadhaar && input.dobOnMarksheet) {
    if (input.dobOnAadhaar !== input.dobOnMarksheet) {
      dobMatched = false;
      readiness -= 35;
      issues.push({
        severity: "CRITICAL",
        title: "Date of Birth Mismatch",
        description: `Aadhaar DOB (${input.dobOnAadhaar}) does not match Marksheet DOB (${input.dobOnMarksheet}). Automatic rejection threshold on DBT portals.`,
        solution: "Apply for Aadhaar DOB correction using your Class 10th Admit Card / Marksheet as valid Proof of Date of Birth (DoB).",
        statutoryReference: "UIDAI Circular No. 13 of 2020 on Date of Birth Updation"
      });
      resolutionChecklist.push("Correct Aadhaar DOB to match Matriculation record.");
    } else {
      issues.push({
        severity: "RESOLVED",
        title: "Date of Birth Verified",
        description: "DOB matches across Aadhaar and institutional records.",
        solution: "No action required.",
        statutoryReference: "UIDAI Validated"
      });
    }
  }

  // 3. The NPCI Bank Seeding Check (The #1 Silent Rejection Cause!)
  let npciStatus: "SEEDED" | "ONLY_LINKED" | "NOT_LINKED" = "NOT_LINKED";

  if (input.isNpciSeeded) {
    npciStatus = "SEEDED";
    issues.push({
      severity: "RESOLVED",
      title: "Aadhaar NPCI Mapper Seeding: Active",
      description: `Account is mapped on NPCI central database. DBT scholarship funds will disburse without rejection.`,
      solution: "Active.",
      statutoryReference: "PFMS / NPCI DBT Gateway Compliant"
    });
  } else if (input.isAadhaarLinkedToBank) {
    npciStatus = "ONLY_LINKED";
    readiness -= 40;
    issues.push({
      severity: "CRITICAL",
      title: "Aadhaar Linked but NOT NPCI Seeded! (Danger)",
      description: "Your bank has linked your Aadhaar for KYC, but has NOT enabled Aadhaar DBT Seeding on the NPCI mapper. 90% of scholarship disbursement failures happen here because the government portal cannot push funds via PFMS.",
      solution: "Download our pre-filled NPCI Mandate Form, visit your bank branch counter, and ask the manager specifically for 'NPCI Aadhaar DBT Seeding'.",
      statutoryReference: "Reserve Bank of India (RBI) Circular on DBT / NPCI Mapper Integration"
    });
    resolutionChecklist.push("Submit NPCI Seeding Mandate Form to your bank branch (Not just standard KYC).");
  } else {
    npciStatus = "NOT_LINKED";
    readiness -= 60;
    issues.push({
      severity: "CRITICAL",
      title: "Bank Account Not Linked to Aadhaar",
      description: "Direct Benefit Transfer (DBT) is legally prohibited to unlinked accounts under Section 7 of the Aadhaar Act.",
      solution: "Open an India Post Payments Bank (IPPB) DBT account or visit your existing bank to link & seed Aadhaar.",
      statutoryReference: "Aadhaar Act 2016 Section 7"
    });
    resolutionChecklist.push("Link bank account with Aadhaar and enable DBT mandate.");
  }

  // 4. Income Certificate Expiry / Date Check
  if (input.incomeCertificateIssueDate) {
    const issueDate = new Date(input.incomeCertificateIssueDate);
    const currentFiscalYearStart = new Date("2026-04-01");
    if (issueDate < currentFiscalYearStart) {
      readiness -= 25;
      issues.push({
        severity: "WARNING",
        title: "Income Certificate May Be Expired",
        description: `Your certificate was issued on ${input.incomeCertificateIssueDate}. Most scholarships require an income certificate issued in the current financial year (after April 1, 2026).`,
        solution: "Apply for a renewal at your local Tehsildar office or CSC center (takes ~14 days).",
        statutoryReference: "State Revenue Department Citizen Charter"
      });
      resolutionChecklist.push("Renew Income Certificate at Tehsildar / MeeSeva center.");
    }
  }

  const canSubmitNow = readiness >= 80 && npciStatus === "SEEDED" && dobMatched && nameSim >= 75;

  return {
    overallReadinessScore: Math.max(10, readiness),
    canSubmitNow,
    nameMatchPercentage: nameSim,
    dobMatched,
    npciStatus,
    issues,
    resolutionChecklist
  };
}

/**
 * Pre-filled NPCI Aadhaar Seeding Mandate Template (Downloadable/Printable)
 */
export function generateNpciMandateForm(studentName: string, bankName: string, accountNumber: string, aadhaarNumber: string): string {
  return `
APPLICATION FOR LINKING / SEEDING AADHAAR NUMBER AND RECEIVING DBT BENEFITS INTO BANK ACCOUNT (NPCI MAPPING)

To,
The Branch Manager,
${bankName || "[Bank Name]"}
Branch: ________________________

Date: ${new Date().toLocaleDateString('en-IN')}

Dear Sir/Madam,

Subject: Consent for Linking/Seeding of Aadhaar with Bank Account No: ${accountNumber || "____________________"} for DBT

I, ${studentName || "[Applicant Name]"}, holder of Account No. ${accountNumber || "____________________"}, hereby authorize ${bankName || "your bank"} to link my Aadhaar Number ${aadhaarNumber || "XXXX-XXXX-XXXX"} with my bank account.

Tick (✔) the appropriate option:
[✔] I wish to seed my account with NPCI mapper to receive Direct Benefit Transfer (DBT) of all government welfare schemes and scholarships (including NSP / MoTA Post-Matric Scholarship).
[ ] I do not wish to seed my account with NPCI mapper.

I declare that the information provided is true and correct.

Yours faithfully,


Signature / Thumb Impression of Account Holder
Name: ${studentName || "________________________"}
Mobile No: ________________________
Enclosures: Copy of Aadhaar Card & Bank Passbook
----------------------------------------------------------------------------------------------------
ACKNOWLEDGEMENT SLIP (For Bank Use Only)
Received application for NPCI Aadhaar DBT Seeding for Account No: ${accountNumber || "________________"}
Date: _______________  Bank Official Seal & Signature: ____________________
  `.trim();
}

/**
 * Generates official Notarized One-and-the-Same Person Affidavit text
 * Used to resolve name and initial mismatches between Aadhaar and Marksheet
 */
export function generateNameAffidavitText(
  nameOnAadhaar: string,
  nameOnMarksheet: string,
  fatherName?: string,
  state?: string
): string {
  const applicant = nameOnAadhaar || "[Applicant Name]";
  const marksheetName = nameOnMarksheet || "[Name on Marksheet]";
  const parent = fatherName || "[Father / Guardian Name]";
  const residentState = state || "India";

  return `
AFFIDAVIT FOR ONE AND THE SAME PERSON (NAME / INITIAL CLARIFICATION)
(To be executed on Non-Judicial Stamp Paper of ₹20 / ₹50 value and attested by a Notary Public)

I, ${applicant}, Son / Daughter of ${parent}, aged about ____ years, residing at __________________________________________________, permanent resident of ${residentState}, do hereby solemnly affirm and state on oath as under:

1. That I am the deponent herein and am a citizen of India.

2. That my name is correctly recorded as "${applicant}" in my Aadhaar Card issued by the Unique Identification Authority of India (UIDAI), bearing Aadhaar No. XXXX-XXXX-____.

3. That in my Class 10th / 12th Board Examination Marksheet / Passing Certificate issued by the Board of Secondary Education, my name has been entered as "${marksheetName}".

4. That I hereby solemnly declare, clarify, and affirm that both the names:
   (a) "${applicant}" as appearing on my Aadhaar Card, AND
   (b) "${marksheetName}" as appearing on my Class 10th / 12th Marksheet,
   PERTAIN TO ONE AND THE SAME PERSON, THAT IS TO SAY, MYSELF, THE DEPONENT.

5. That "${applicant}" and "${marksheetName}" are identical names of one single biological individual and there is no other person by this description in my family.

6. That I am submitting this solemn affidavit to the Scholarship Sanctioning Authority / Educational Institution / State Welfare Department / National Scholarship Portal (NSP) / MeeSeva / e-Sevai for the purpose of availing government scholarships, welfare entitlements, and college admissions without rejection.

7. That whatever is stated above is true and correct to the best of my personal knowledge, belief, and records, and nothing material has been concealed or falsely stated.

DEPONENT
(${applicant})

VERIFICATION:
Verified at ____________ on this _____ day of ____________ 2026, that the contents of paragraphs 1 to 7 above are true and correct.

DEPONENT

ATTESTATION BY NOTARY PUBLIC / EXECUTIVE MAGISTRATE
Signed before me on this _____ day of ____________ 2026 at ________________.
Seal & Signature of Notary Public: ___________________________
`.trim();
}

