import { SchemeOrService, OfflineSubmissionDetail } from "@/data/schemes";

export interface RawGovSchemeResponse {
  _id: string;
  slug: string;
  en: {
    basicDetails: {
      schemeName: string;
      schemeShortTitle?: string;
      implementingAgency?: string;
      level?: { label: string; value: string };
      nodalMinistryName?: { label: string; value: number | string };
      schemeCategory?: { label: string; value: string }[];
      tags?: string[];
      schemeCloseDate?: string;
    };
    eligibilityCriteria?: {
      eligibilityDescription?: unknown[];
    };
    schemeContent?: {
      briefDescription?: string;
      detailedDescription?: string;
      benefits?: unknown[];
    };
  };
}

export interface RawGovDocumentResponse {
  data?: {
    en?: {
      documentsRequired_md?: string;
      documents_required?: unknown[];
      faqs?: { question?: string; answer_md?: string }[];
    };
  };
}

function extractTextFromAst(nodes: unknown[]): string {
  const lines: string[] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (typeof n.text === "string" && n.text.trim()) {
      lines.push(n.text.trim());
    }
    if (Array.isArray(n.children)) {
      n.children.forEach(walk);
    }
  }
  if (Array.isArray(nodes)) {
    nodes.forEach(walk);
  }
  return lines.join(" ");
}

function parseIncomeLimit(text: string): number {
  // Matches e.g. "₹ 2.50 Lakh", "2.5 lakh", "8 Lakh", "Rs 250000"
  const lakhMatch = text.match(/(?:₹|Rs\.?|INR)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac|lacs)/i);
  if (lakhMatch) {
    return Math.round(parseFloat(lakhMatch[1]) * 100000);
  }
  const numericMatch = text.match(/(?:₹|Rs\.?|INR)?\s*([1-9][0-9]{4,6})/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }
  return 800000; // default statutory threshold
}

function parseCategories(text: string, tags: string[] = []): string[] {
  const cats: string[] = [];
  const full = (text + " " + tags.join(" ")).toLowerCase();
  if (full.includes("scheduled tribe") || full.includes(" st ") || full.includes("tribal")) cats.push("ST");
  if (full.includes("scheduled caste") || full.includes(" sc ")) cats.push("SC");
  if (full.includes("other backward") || full.includes(" obc ")) cats.push("OBC");
  if (full.includes("economically weaker") || full.includes(" ews ")) cats.push("EWS");
  if (cats.length === 0) return ["All", "General", "OBC", "SC", "ST", "EWS"];
  return cats;
}

function parseGender(title: string, text: string): "Female" | "Male" | "All" {
  const full = (title + " " + text).toLowerCase();
  if (full.includes("girl") || full.includes("female") || full.includes("women") || full.includes("mahila")) {
    return "Female";
  }
  if (full.includes("boy") || (full.includes("male") && !full.includes("female"))) {
    return "Male";
  }
  return "All";
}

function parseEducationStages(title: string, text: string, tags: string[] = []): string[] {
  const full = (title + " " + text + " " + tags.join(" ")).toLowerCase();
  if (full.includes("pre matric") || full.includes("pre-matric") || full.includes("class 9") || full.includes("class 10")) {
    return ["Class 9", "Class 10"];
  }
  if (full.includes("post matric") || full.includes("post-matric")) {
    return ["11th", "12th", "UG", "PG", "Diploma", "PhD"];
  }
  if (full.includes("degree") || full.includes("ug") || full.includes("technical degree") || full.includes("engineering")) {
    return ["UG", "PG"];
  }
  if (full.includes("diploma") || full.includes("polytechnic")) {
    return ["Diploma"];
  }
  return ["Class 9", "Class 10", "11th", "12th", "UG", "PG", "PhD", "Diploma", "Other"];
}

function parseDocumentsList(
  docResponse?: RawGovDocumentResponse,
  categories: string[] = [],
  maxIncome: number = 800000
): string[] {
  const list: string[] = [];

  // Parse markdown list items if present
  const md = docResponse?.data?.en?.documentsRequired_md;
  if (md) {
    const lines = md.split("\n");
    for (const line of lines) {
      const clean = line.replace(/^[0-9]+[\.\)]\s*|\*+|\-+\s*/g, "").trim();
      if (clean.length > 3 && !clean.startsWith("[Download") && !clean.startsWith("<")) {
        list.push(clean);
      }
    }
  }

  // Parse structured AST if markdown is empty
  if (list.length === 0 && docResponse?.data?.en?.documents_required) {
    const astText = extractTextFromAst(docResponse.data.en.documents_required);
    if (astText) {
      list.push(...astText.split(/\.|\;/).map((s) => s.trim()).filter((s) => s.length > 5));
    }
  }

  // Ensure core statutory prerequisites are included
  if (!list.some((d) => d.toLowerCase().includes("aadhaar"))) {
    list.push("Aadhaar Card (Linked with active mobile & NPCI seeded bank account)");
  }
  if (
    maxIncome < 1000000 &&
    !list.some((d) => d.toLowerCase().includes("income"))
  ) {
    list.push(`Valid Income Certificate (Annual family income <= ₹${maxIncome.toLocaleString("en-IN")})`);
  }
  if (
    !categories.includes("All") &&
    categories.some((c) => ["ST", "SC", "OBC", "EWS"].includes(c)) &&
    !list.some((d) => d.toLowerCase().includes("caste") || d.toLowerCase().includes("category"))
  ) {
    list.push(`Valid Community / Caste Certificate (${categories.join("/")}) issued by competent Revenue Authority`);
  }

  return Array.from(new Set(list));
}

function derivePrerequisites(categories: string[], maxIncome: number): string[] {
  const prereqs: string[] = ["Aadhaar_Card"];
  if (categories.some((c) => ["ST", "SC", "OBC"].includes(c)) && !categories.includes("All")) {
    prereqs.push("Caste_Certificate");
  }
  if (maxIncome < 1000000) {
    prereqs.push("Income_Certificate");
  }
  prereqs.push("Domicile_Certificate");
  return prereqs;
}

/**
 * Normalizes a raw Government of India API scheme into JanSetu's SchemeOrService model.
 */
export function normalizeGovScheme(
  raw: RawGovSchemeResponse,
  rawDocs?: RawGovDocumentResponse
): SchemeOrService {
  const details = raw.en.basicDetails;
  const critNodes = raw.en.eligibilityCriteria?.eligibilityDescription || [];
  const critText = extractTextFromAst(critNodes);
  const benefitNodes = raw.en.schemeContent?.benefits || [];
  const benefitText = extractTextFromAst(benefitNodes);
  const briefDesc = raw.en.schemeContent?.briefDescription || "";

  const title = details.schemeName || raw.slug;
  const shortCode = details.schemeShortTitle || raw.slug.toUpperCase();
  const maxIncome = parseIncomeLimit(critText);
  const targetCategories = parseCategories(critText, details.tags || []);
  const genderRestriction = parseGender(title, critText);
  const educationStages = parseEducationStages(title, critText, details.tags || []);
  const mandatoryDocuments = parseDocumentsList(rawDocs, targetCategories, maxIncome);
  const prerequisites = derivePrerequisites(targetCategories, maxIncome);

  const level = details.level?.label?.toLowerCase() === "state" ? "State" : "Central";
  const ministry = details.nodalMinistryName?.label
    ? `${details.nodalMinistryName.label}, Government of India`
    : "Government of India";

  const sponsoringBody = details.implementingAgency || "Centrally Sponsored Scheme (Direct Benefit Transfer)";

  const benefitAmount = benefitText.length > 10
    ? benefitText.slice(0, 140)
    : "Statutory Financial Assistance / Scholarship Waiver credited via DBT";

  const benefitDescription = briefDesc || benefitText || "Official government welfare and scholarship benefit granted under statutory norms.";

  const offlineSubmission: OfflineSubmissionDetail = {
    centerName: "Common Service Center (CSC) / Tehsildar & District Nodal Office",
    counterName: "Citizen Welfare & Scholarship Cell",
    officialStatutoryFee: "₹0",
    maxAuthorizedFee: "₹30",
    feeWarning: "Application submission is statutorily FREE. CSC assisted upload is capped at ₹30 maximum. Report any extra demand to District Collector.",
    statutoryDaysLimit: 30,
    rtsaClause: "Right to Public Services Act (RTSA) Section 4 Mandatory Disposal Within 30 Working Days"
  };

  const cedarConditions: string[] = [];
  if (!targetCategories.includes("All")) {
    cedarConditions.push(`principal.category in [${targetCategories.map((c) => `"${c}"`).join(", ")}]`);
  }
  if (maxIncome > 0 && maxIncome < 9999999) {
    cedarConditions.push(`principal.annualFamilyIncome <= ${maxIncome}`);
  }
  if (genderRestriction !== "All") {
    cedarConditions.push(`principal.gender == "${genderRestriction}"`);
  }

  const cedarPolicyCode = `permit(
  principal,
  action == Action::"ApplyScheme",
  resource == Scheme::"${raw.slug}"
)${cedarConditions.length > 0 ? `\nwhen {\n  ${cedarConditions.join(" &&\n  ")}\n};` : ";"}`;

  return {
    id: raw.slug,
    title,
    shortCode,
    type: "scholarship",
    ministry,
    sponsoringBody,
    level,
    targetCategories,
    maxIncome,
    educationStages,
    courseTypesAllowed: ["Regular Full-Time", "Diploma"],
    genderRestriction,
    disabilityRequirement: (details.tags || []).some((t) => t.toLowerCase().includes("disability") || t.toLowerCase().includes("pwd")),
    managementQuotaAllowed: false,
    benefitAmount,
    benefitDescription,
    officialPortalUrl: `https://www.myscheme.gov.in/schemes/${raw.slug}`,
    portalName: "myScheme (Digital India / API Setu)",
    portalSchemeCode: raw.slug.toUpperCase(),
    deadline: details.schemeCloseDate || "Ongoing / Academic Session 2026",
    daysRemaining: 60,
    prerequisites,
    mandatoryDocuments,
    offlineSubmission,
    cedarPolicyCode,
    officialGazetteRef: `Government of India Digital Gazette ID: ${raw._id}`,
    faqs: [
      {
        q: "Where can I apply for this official scheme?",
        a: `Applications are submitted online via the official portal at https://www.myscheme.gov.in/schemes/${raw.slug} or at any authorized Common Service Center (CSC).`
      },
      {
        q: "What is the fee for applying?",
        a: "The statutory government fee is ₹0 (Free of cost). CSC processing is capped at ₹30 maximum."
      }
    ]
  };
}
