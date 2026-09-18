import { SCHEMES_DATABASE, SchemeOrService } from "@/data/schemes";

export interface UserProfile {
  // 1. Personal & Social Identity
  name?: string;
  category: "ST" | "SC" | "OBC" | "EWS" | "General";
  tnCommunity?: "OC" | "BC" | "BCM" | "MBC" | "DNC" | "SC" | "SCA" | "ST" | "None";
  apCommunity?: "OC" | "BC-A" | "BC-B" | "BC-C" | "BC-D" | "BC-E" | "SC" | "ST" | "Kapu" | "EBC" | "None";
  gender: "Male" | "Female" | "Other";
  isMinority: boolean;
  minorityCommunity?: "Muslim" | "Christian" | "Sikh" | "Buddhist" | "Jain" | "Parsi" | "None";
  isPersonWithDisability: boolean;
  disabilityPercentage?: number;
  isOrphanOrSingleParent?: boolean;

  // 2. Domicile & Location
  state: string;
  district?: string;
  villageOrTown?: string;
  residenceYearsInState: number;
  isStudyingInHomeState: boolean;

  // 3. Academic & Course Particulars
  educationLevel: "Class 9" | "Class 10" | "11th" | "12th" | "UG" | "PG" | "PhD" | "Diploma" | "Other";
  courseType: "Regular Full-Time" | "Diploma" | "Distance" | "Vocational";
  isTechnicalCourse: boolean;
  admissionQuota: "Merit/Govt Counseling" | "Management/Direct" | "Sports/ECA";
  institutionType: "Government" | "Govt-Aided" | "Premier/Notified (IIT/NIT/AIIMS)" | "Private Recognized";
  studiedInGovtSchool6To12?: boolean;
  isFirstGraduateInFamily?: boolean;
  marksPercentage: number;
  isHosteller: boolean;

  // 4. Financial & Household Background
  annualFamilyIncome: number;
  electricityUnitsPerYear?: number;
  numberOfSiblingsAvailingScholarship: number;
  agriculturalLandAcres: number;
  residentialFlatSqFt: number;
  hasPaternalCasteRecord: boolean;
  hasValidAddressProof: boolean;

  // 5. Existing Benefits & Held Documents
  isAlreadyReceivingOtherScholarship: boolean;
  heldDocuments: string[];
}

export interface CedarEvaluationResult {
  scheme: SchemeOrService;
  decision: "ALLOW" | "DENY";
  fitScore: number; // 0 to 100
  passedClauses: string[];
  failedClauses: string[];
  matchedReasons: string[];
  failedReasons: string[];
  missingPrerequisites: SchemeOrService[];
  heldPrerequisites: { id: string; name: string }[];
  estimatedBenefit: string;
  actionRecommendation: string;
  cedarPolicySnippet: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: "Candidate",
  category: "General",
  tnCommunity: "BC",
  apCommunity: "BC-A",
  gender: "Male",
  isMinority: false,
  minorityCommunity: "None",
  isPersonWithDisability: false,
  disabilityPercentage: 0,
  isOrphanOrSingleParent: false,
  state: "National",
  district: "",
  residenceYearsInState: 5,
  isStudyingInHomeState: true,
  educationLevel: "UG",
  courseType: "Regular Full-Time",
  isTechnicalCourse: true,
  admissionQuota: "Merit/Govt Counseling",
  institutionType: "Government",
  studiedInGovtSchool6To12: false,
  isFirstGraduateInFamily: false,
  marksPercentage: 75,
  isHosteller: false,
  annualFamilyIncome: 200000,
  electricityUnitsPerYear: 1800,
  numberOfSiblingsAvailingScholarship: 0,
  agriculturalLandAcres: 0,
  residentialFlatSqFt: 0,
  hasPaternalCasteRecord: true,
  hasValidAddressProof: true,
  isAlreadyReceivingOtherScholarship: false,
  heldDocuments: [],
};

/**
 * Deterministic Cedar-style Policy Evaluator
 * Evaluates comprehensive real-world Indian Civic Service & Scholarship criteria against declarative policy rules.
 */
export function evaluateCedarPolicies(
  rawProfile: Partial<UserProfile>,
  customSchemes?: SchemeOrService[]
): CedarEvaluationResult[] {
  const profile: UserProfile = { ...DEFAULT_USER_PROFILE, ...rawProfile };
  const results: CedarEvaluationResult[] = [];
  const heldDocs = new Set(profile.heldDocuments || []);

  // Filter active schemes from dynamic or baseline source
  const schemeSource = customSchemes && customSchemes.length > 0 ? customSchemes : SCHEMES_DATABASE;
  const candidateSchemes = schemeSource.filter((s) => {
    if (s.level === "Central") return true;
    if (!s.applicableStates || s.applicableStates.length === 0) return true;
    if (profile.state === "National" || !profile.state) return true;
    return s.applicableStates.includes(profile.state);
  });

  for (const scheme of candidateSchemes) {
    const passedClauses: string[] = [];
    const failedClauses: string[] = [];
    let fitScore = 100;

    // 1. Social Category Matching
    const isTN = profile.state === "Tamil Nadu";
    const isAP = profile.state === "Andhra Pradesh";
    const community = profile.tnCommunity || "BC";
    const apComm = profile.apCommunity || "BC-A";

    const isTNCommunityMatch = isTN && (
      scheme.targetCategories.includes("All") ||
      (community === "ST" && scheme.targetCategories.includes("ST")) ||
      (["SC", "SCA"].includes(community) && scheme.targetCategories.includes("SC")) ||
      (["BC", "BCM", "MBC", "DNC"].includes(community) && (
        scheme.targetCategories.includes("OBC") ||
        scheme.targetCategories.includes("BC") ||
        scheme.targetCategories.includes("MBC") ||
        scheme.targetCategories.includes("DNC")
      ))
    );

    const isAPCommunityMatch = isAP && (
      scheme.targetCategories.includes("All") ||
      (apComm === "ST" && scheme.targetCategories.includes("ST")) ||
      (apComm === "SC" && scheme.targetCategories.includes("SC")) ||
      (["BC-A", "BC-B", "BC-C", "BC-D", "BC-E"].includes(apComm) && (
        scheme.targetCategories.includes("OBC") ||
        scheme.targetCategories.includes("BC")
      )) ||
      (["Kapu", "EBC"].includes(apComm) && (
        scheme.targetCategories.includes("Kapu") ||
        scheme.targetCategories.includes("EBC") ||
        scheme.targetCategories.includes("OBC")
      ))
    );

    if (
      scheme.targetCategories.includes("All") ||
      scheme.targetCategories.includes(profile.category) ||
      isTNCommunityMatch ||
      isAPCommunityMatch
    ) {
      passedClauses.push(
        `Category match: ${isTN ? `${community} (TN)` : isAP ? `${apComm} (AP)` : profile.category} in [${scheme.targetCategories.join(", ")}]`
      );
    } else {
      failedClauses.push(
        `Category mismatch: Candidate is ${isTN ? community : isAP ? apComm : profile.category}, but scheme requires [${scheme.targetCategories.join(", ")}]`
      );
      fitScore -= 45;
    }

    // 2. Statutory Family Income Ceiling
    if (profile.annualFamilyIncome <= scheme.maxIncome) {
      const margin = scheme.maxIncome - profile.annualFamilyIncome;
      passedClauses.push(`Income eligibility: ₹${profile.annualFamilyIncome.toLocaleString('en-IN')} <= Ceiling ₹${scheme.maxIncome.toLocaleString('en-IN')} (Eligible by ₹${margin.toLocaleString('en-IN')})`);
    } else {
      failedClauses.push(`Income ceiling exceeded: ₹${profile.annualFamilyIncome.toLocaleString('en-IN')} > Max allowed ₹${scheme.maxIncome.toLocaleString('en-IN')}`);
      fitScore -= 50;
    }

    // 3. Education Stage
    if (scheme.educationStages.includes("All") || scheme.educationStages.includes(profile.educationLevel)) {
      passedClauses.push(`Education level match: ${profile.educationLevel}`);
    } else {
      failedClauses.push(`Education stage mismatch: Candidate is in ${profile.educationLevel}, scheme is for [${scheme.educationStages.join(", ")}]`);
      fitScore -= 35;
    }

    // 4. Course Type (Regular Full-Time vs Distance/Vocational)
    if (scheme.courseTypesAllowed.includes(profile.courseType)) {
      passedClauses.push(`Course mode: ${profile.courseType} (Eligible)`);
    } else {
      failedClauses.push(`Course mode ineligible: Scheme strictly disallows ${profile.courseType} (Requires: ${scheme.courseTypesAllowed.join(", ")})`);
      fitScore -= 40;
    }

    // 5. Admission Quota (Management Quota Exclusion)
    if (!scheme.managementQuotaAllowed && profile.admissionQuota === "Management/Direct") {
      failedClauses.push("Management / Direct quota exclusion: Central guidelines strictly require admission via merit/government counseling.");
      fitScore -= 50;
    } else if (!scheme.managementQuotaAllowed) {
      passedClauses.push(`Admission quota: ${profile.admissionQuota} (Eligible)`);
    }

    // 6. Minimum Merit / Marks Percentage
    if (scheme.minimumMarksPercentage) {
      if (profile.marksPercentage >= scheme.minimumMarksPercentage) {
        passedClauses.push(`Merit criteria met: ${profile.marksPercentage}% >= Required ${scheme.minimumMarksPercentage}%`);
      } else {
        failedClauses.push(`Merit threshold unmet: Scored ${profile.marksPercentage}%, but scheme requires minimum ${scheme.minimumMarksPercentage}% in qualifying exam`);
        fitScore -= 35;
      }
    }

    // 7. Gender Restriction
    if (scheme.genderRestriction && scheme.genderRestriction !== "All") {
      if (profile.gender === scheme.genderRestriction) {
        passedClauses.push(`Gender requirement met: ${profile.gender}`);
      } else {
        failedClauses.push(`Gender restriction: Scheme is exclusively reserved for ${scheme.genderRestriction} candidates`);
        fitScore -= 60;
      }
    }

    // 8. Technical / Professional Course Requirement
    if (scheme.technicalOnly) {
      if (profile.isTechnicalCourse) {
        passedClauses.push("Technical/Professional course criteria satisfied");
      } else {
        failedClauses.push("Requires enrollment in an approved technical degree/diploma program");
        fitScore -= 40;
      }
    }

    // 9. Disability Requirement (PwD / Saksham)
    if (scheme.disabilityRequirement) {
      const minPerc = scheme.minDisabilityPercentage || 40;
      if (profile.isPersonWithDisability && (profile.disabilityPercentage || 0) >= minPerc) {
        passedClauses.push(`Disability status verified: ${profile.disabilityPercentage}% >= ${minPerc}% benchmark`);
      } else {
        failedClauses.push(`Requires minimum ${minPerc}% benchmark disability under the RPwD Act 2016`);
        fitScore -= 50;
      }
    }

    // 10. Minority Community Requirement
    if (scheme.minorityOnly) {
      if (profile.isMinority) {
        passedClauses.push(`Minority status verified: ${profile.minorityCommunity || "Notified Community"}`);
      } else {
        failedClauses.push("Scheme is exclusively for notified national religious minorities");
        fitScore -= 50;
      }
    }

    // 11. Regional / Domicile Special Quotas (e.g. Ishaan Uday for NE States)
    if (scheme.id === "Ishaan_Uday_NER") {
      const neStates = ["Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"];
      if (neStates.includes(profile.state)) {
        passedClauses.push(`Domicile verified: ${profile.state} is one of 8 North Eastern States`);
      } else {
        failedClauses.push(`Requires permanent domicile in one of the 8 North Eastern States (Candidate is from ${profile.state})`);
        fitScore -= 50;
      }
    }

    // 12. Top Class Premier Institute Check
    if (scheme.id === "TopClass_ST") {
      if (profile.institutionType === "Premier/Notified (IIT/NIT/AIIMS)") {
        passedClauses.push("Enrolled in notified premier institute (IIT/NIT/AIIMS/IIM)");
      } else {
        failedClauses.push("Requires enrollment in MoTA-notified premier institutions (e.g. IITs, NITs, AIIMS)");
        fitScore -= 30;
      }
    }

    // 13. Sibling Quota Limit Check (e.g. AICTE Pragati limit of 2)
    if (scheme.maxSiblingsBenefited && profile.numberOfSiblingsAvailingScholarship >= scheme.maxSiblingsBenefited) {
      failedClauses.push(`Family cap exceeded: Maximum ${scheme.maxSiblingsBenefited} siblings permitted to avail this benefit`);
      fitScore -= 40;
    }

    // 14. EWS Asset Exclusion Criteria
    if (scheme.id === "EWS_Certificate") {
      if (profile.agriculturalLandAcres > 5.0) {
        failedClauses.push(`Asset exclusion: Owns ${profile.agriculturalLandAcres} acres agricultural land (Max allowed: 5.0 acres)`);
        fitScore -= 50;
      } else {
        passedClauses.push(`Landholding verified: ${profile.agriculturalLandAcres} acres <= 5.0 acres`);
      }

      if (profile.residentialFlatSqFt > 1000) {
        failedClauses.push(`Asset exclusion: Residential flat ${profile.residentialFlatSqFt} sq ft exceeds 1,000 sq ft ceiling`);
        fitScore -= 50;
      } else {
        passedClauses.push(`Residential area verified: ${profile.residentialFlatSqFt} sq ft <= 1,000 sq ft`);
      }
    }

    // 15. Dual Scholarship Concurrency Warning
    if (profile.isAlreadyReceivingOtherScholarship && scheme.type === "scholarship") {
      failedClauses.push("Dual scholarship conflict: Central guidelines prohibit availing multiple government financial maintenance stipends simultaneously.");
      fitScore -= 35;
    }

    // 16. State-Specific Applicability
    if (scheme.applicableStates && scheme.applicableStates.length > 0) {
      if (scheme.applicableStates.includes(profile.state)) {
        passedClauses.push(`State domicile verified: Resident of ${profile.state}`);
      } else {
        failedClauses.push(`State restriction: Scheme is exclusively for residents of [${scheme.applicableStates.join(", ")}] (Candidate is from ${profile.state})`);
        fitScore -= 70;
      }
    }

    // 17. Government Schooling Requirement (e.g. TN Pudhumai Penn, Tamil Pudhalvan, 7.5% Quota)
    if (scheme.requiresGovtSchool6To12) {
      if (profile.studiedInGovtSchool6To12) {
        passedClauses.push("Govt schooling verified: Studied in Government Schools from Class 6 to 12 continuously");
      } else {
        failedClauses.push("Requires continuous schooling in Government Schools from Class 6 to 12 (Crucial State Guideline)");
        fitScore -= 50;
      }
    }

    // 18. First Graduate in Family Requirement (e.g. TN Mudhal Thalaimurai Pattadhari)
    if (scheme.requiresFirstGraduate) {
      if (profile.isFirstGraduateInFamily) {
        passedClauses.push("First Graduate status verified: First member in family to pursue a degree");
      } else {
        failedClauses.push("Requires candidate to be the First Graduate in their immediate family (No graduate parents or elder siblings)");
        fitScore -= 50;
      }
    }

    // 19. Household Electricity Consumption Cap (e.g. TN KMUT)
    if (scheme.maxElectricityUnitsPerYear && profile.electricityUnitsPerYear) {
      if (profile.electricityUnitsPerYear <= scheme.maxElectricityUnitsPerYear) {
        passedClauses.push(`Domestic electricity consumption verified: ${profile.electricityUnitsPerYear} <= ${scheme.maxElectricityUnitsPerYear} units/year`);
      } else {
        failedClauses.push(`Electricity consumption exceeds cap: ${profile.electricityUnitsPerYear} units/year > Max ${scheme.maxElectricityUnitsPerYear} units/year`);
        fitScore -= 40;
      }
    }

    // 20. Prerequisite Document Check (Held vs Missing)
    const heldPrereqs: { id: string; name: string }[] = [];
    const missingPrereqs: SchemeOrService[] = [];
    for (const prereqId of scheme.prerequisites) {
      const prereqScheme = SCHEMES_DATABASE.find(s => s.id === prereqId);
      const docTitle = prereqScheme ? prereqScheme.title : prereqId.replace(/_/g, " ");
      if (heldDocs.has(prereqId)) {
        heldPrereqs.push({ id: prereqId, name: docTitle });
      } else {
        if (prereqScheme) missingPrereqs.push(prereqScheme);
      }
    }

    // User-friendly matched reasons
    const matchedReasons: string[] = [];
    if (profile.annualFamilyIncome <= scheme.maxIncome) {
      matchedReasons.push(`Annual family income (₹${profile.annualFamilyIncome.toLocaleString('en-IN')}) is within statutory limit of ₹${scheme.maxIncome.toLocaleString('en-IN')}`);
    }
    if (scheme.educationStages.includes("All") || scheme.educationStages.includes(profile.educationLevel)) {
      matchedReasons.push(`Currently enrolled in qualifying education stage: ${profile.educationLevel}`);
    }
    if (scheme.courseTypesAllowed.includes(profile.courseType)) {
      matchedReasons.push(`Course mode is valid: ${profile.courseType}`);
    }
    if (!scheme.managementQuotaAllowed && profile.admissionQuota !== "Management/Direct") {
      matchedReasons.push(`Admitted through recognized merit/counseling (${profile.admissionQuota})`);
    }
    if (scheme.requiresGovtSchool6To12 && profile.studiedInGovtSchool6To12) {
      matchedReasons.push(`Continuous Government School education (Class 6 to 12) verified`);
    }
    if (scheme.requiresFirstGraduate && profile.isFirstGraduateInFamily) {
      matchedReasons.push(`First Graduate status verified (Zero prior degree holders in family)`);
    }
    if (scheme.genderRestriction && scheme.genderRestriction === profile.gender) {
      matchedReasons.push(`Candidate gender meets scheme criteria: ${profile.gender}`);
    }
    if (scheme.level === "State" && scheme.applicableStates?.includes(profile.state)) {
      matchedReasons.push(`State domicile verified: ${profile.state} resident`);
    }

    const decision: "ALLOW" | "DENY" = failedClauses.length === 0 ? "ALLOW" : "DENY";
    const clampedScore = Math.max(0, Math.min(100, fitScore));

    // Dynamic Benefit Calculation (Hosteller vs Day Scholar)
    let estimatedBenefit = scheme.benefitAmount;
    if (profile.isHosteller && scheme.maintenanceAllowanceHosteller) {
      estimatedBenefit += ` + Hosteller Stipend: ${scheme.maintenanceAllowanceHosteller}`;
    } else if (!profile.isHosteller && scheme.maintenanceAllowanceDayScholar) {
      estimatedBenefit += ` + Day Scholar Stipend: ${scheme.maintenanceAllowanceDayScholar}`;
    }

    let actionRecommendation = "";
    if (decision === "ALLOW") {
      if (missingPrereqs.length > 0) {
        actionRecommendation = `Eligible! But prerequisite chain incomplete: obtain ${missingPrereqs.map(p => p.title).join(", ")} first.`;
      } else {
        actionRecommendation = `Ready to apply immediately on ${scheme.portalName}. All statutory criteria and prerequisites satisfied.`;
      }
    } else {
      actionRecommendation = `Not currently eligible: ${failedClauses[0]}`;
    }

    results.push({
      scheme,
      decision,
      fitScore: clampedScore,
      passedClauses,
      failedClauses,
      matchedReasons,
      failedReasons: failedClauses,
      missingPrerequisites: missingPrereqs,
      heldPrerequisites: heldPrereqs,
      estimatedBenefit,
      actionRecommendation,
      cedarPolicySnippet: scheme.cedarPolicyCode
    });
  }

  // Sort: Allowed first, then higher fit score
  return results.sort((a, b) => {
    if (a.decision === "ALLOW" && b.decision !== "ALLOW") return -1;
    if (a.decision !== "ALLOW" && b.decision === "ALLOW") return 1;
    return b.fitScore - a.fitScore;
  });
}
