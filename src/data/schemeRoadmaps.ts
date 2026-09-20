import { SCHEMES_DATABASE, SchemeOrService } from "./schemes";

export interface RoadmapBaseDocument {
  name: string;
  requirement: string;
  mandatory: boolean;
}

export interface RoadmapStatutoryCertificate {
  certificateId: string;
  name: string;
  authority: string;
  turnaround: string;
  statutoryCost: string;
  validity: string;
  keyCondition: string;
}

export interface RoadmapInstitutionalItem {
  name: string;
  authority: string;
  action: string;
  category: "Academic" | "Healthcare" | "Banking" | "Civic";
}

export type SchemeProcessMode = "TOTALLY_ONLINE" | "HYBRID" | "TOTALLY_OFFLINE";

export interface RoadmapStage {
  stageNumber: number;
  stageName: string;
  actor: string;
  officeType?: string;
  timeline: string;
  description: string;
  actionItem: string;
  commonPitfall: string;
  stageMode?: "ONLINE" | "OFFLINE" | "HYBRID";
  portalLink?: string;
  portalActionText?: string;
  physicalDeskLocation?: string;
}

export interface SchemeRoadmapBase {
  schemeId: string;
  schemeTitle: string;
  shortCode: string;
  type: "scholarship" | "certificate" | "healthcare" | "land_rights" | "welfare_dbt" | "loan";
  categoryLabel: string;
  sponsoringBody: string;
  benefitHeadline: string;
  statutoryTimeLimit: string;
  officialFee: string;
  portalName: string;
  portalUrl: string;
  offlineCounter: string;
  processMode?: SchemeProcessMode;
  processModeLabel?: string;
  processModeDescription?: string;
  tier1BaseIdentity: RoadmapBaseDocument[];
  tier2StatutoryCertificates: RoadmapStatutoryCertificate[];
  tier3Institutional: RoadmapInstitutionalItem[];
  bankingRequirement: string;
  stages: RoadmapStage[];
  rejectionChecklist: { check: string; resolution: string }[];
}

export interface SchemeRoadmap extends SchemeRoadmapBase {
  processMode: SchemeProcessMode;
  processModeLabel: string;
  processModeDescription: string;
}

// 1. DEDICATED ROADMAPS FOR EVERY SCHEME & SERVICE
export const SCHEME_ROADMAPS: Record<string, SchemeRoadmapBase> = {
  // --- TRIBAL FOREST RIGHTS ACT (RoFR / JUNGLE LAND PATTA) - TOTALLY OFFLINE ---
  FRA_RoFR_Land_Patta: {
    schemeId: "FRA_RoFR_Land_Patta",
    schemeTitle: "Tribal Forest Rights Act (RoFR / Jungle Bhoomi Land Patta Title Deed)",
    shortCode: "FRA-ROFR-PATTA",
    type: "certificate",
    categoryLabel: "Statutory Forest Land Ownership & Scheduled Tribe Rights",
    sponsoringBody: "Ministry of Tribal Affairs & State Revenue & Forest Administration",
    benefitHeadline: "Up to 10 Acres (4 Hectares) Permanent Heritable Registered Land Title Deed (Joint Patta)",
    statutoryTimeLimit: "60 Days (FRA Statutory SLA under Gram Sabha determination)",
    officialFee: "₹0.00 (Statutorily 100% Free under Section 4 of FRA 2006)",
    portalName: "100% In-Person Physical Process (No Authorized Online Portal)",
    portalUrl: "",
    offlineCounter: "Gram Sabha Forest Rights Committee (FRC) Desk & Tahsil Land Records Counter #4",
    processMode: "TOTALLY_OFFLINE",
    processModeLabel: "🏛️ 100% In-Person Physical Process Only (Zero Online Portals)",
    processModeDescription: "Under Section 6 of the Forest Rights Act 2006, claims for jungle land pattas can ONLY be initiated through physical Gram Sabha quorum resolutions and joint forest boundary walks. No online portal or private cyber cafe is legally authorized.",
    tier1BaseIdentity: [
      {
        name: "Form A - Individual Forest Rights Claim Proforma",
        requirement: "Physically signed by claimant and spouse with village elder witness signatures",
        mandatory: true,
      },
      {
        name: "Aadhaar Card (Claimant & Spouse)",
        requirement: "Physical photocopies. Mandatory for Joint Title Deed under Section 4(4) of FRA",
        mandatory: true,
      },
      {
        name: "Ration Card or Voter ID (Pre-2005 Proof)",
        requirement: "Proves physical residence in the forest-fringe hamlet prior to 13 December 2005",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "ST_Caste_Certificate",
        name: "Scheduled Tribe (ST) Certificate",
        authority: "Tahsildar / Sub-Divisional Magistrate",
        turnaround: "15 Days",
        statutoryCost: "₹25",
        validity: "Permanent",
        keyCondition: "Required for ST category forest dwellers (OTFD require 75-year / 3-generation residency proof)",
      },
      {
        certificateId: "Village_Elder_Panchanama",
        name: "Forest Rights Committee (FRC) Field Panchanama",
        authority: "Gram Sabha FRC Chairperson & Revenue Inspector",
        turnaround: "30 Days",
        statutoryCost: "₹0",
        validity: "Permanent",
        keyCondition: "Attestation of physical cultivation boundaries signed by neighboring forest plot holders",
      },
    ],
    tier3Institutional: [
      {
        name: "Gram Sabha Quorum Resolution Copy",
        authority: "Village Gram Sabha (Presided by FRC Chairperson)",
        action: "Physical passing and recording of claim resolution in the Gram Panchayat register",
        category: "Civic",
      },
      {
        name: "Joint Forest Beat & Revenue Survey GPS Map",
        authority: "Mandal Revenue Surveyor & Forest Beat Officer",
        action: "Physical walk along forest land boundaries with hand-held GPS to draw demarcation map",
        category: "Civic",
      },
    ],
    bankingRequirement: "No bank account needed for land title issuance. Title deed is directly registered in the state revenue land record (Webland / Patta Chitta).",
    stages: [
      {
        stageNumber: 1,
        stageName: "Gram Sabha FRC Physical Claim Filing & Resolution",
        actor: "Forest Rights Committee (FRC) / Village Gram Sabha",
        officeType: "Gram Panchayat Hall (FRC Desk)",
        timeline: "Day 1 – 15 (Scheduled Gram Sabha Meeting)",
        description: "Submit Form A claim proforma physically before the 10–15 member village Forest Rights Committee along with elder witness statements and ancestral cultivation evidence.",
        actionItem: "Ensure claim is entered into the Gram Sabha FRC physical register and obtain counter-signature on duplicate copy.",
        commonPitfall: "Trusting online brokers or paying unauthorized fees. Forest rights claims are 100% statutorily free.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Gram Panchayat Hall / Community Hall — FRC Secretary Desk",
      },
      {
        stageNumber: 2,
        stageName: "Joint Field Verification & GPS Boundary Demarcation",
        actor: "Joint Inspection Team (Forest Beat Officer, Mandal Surveyor, FRC)",
        officeType: "Forest Beat Office & Survey Field Camp",
        timeline: "Within 30 Days",
        description: "Forest Beat Officer, Mandal Revenue Surveyor, and FRC members physically walk the plot boundaries, record GPS coordinates, and prepare spot Panchanama with adjacent farmers.",
        actionItem: "Be physically present on the forest land parcel with neighboring cultivators to sign the spot Panchanama.",
        commonPitfall: "Absence on inspection day leading to adverse remarks or disputed boundary entries.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Forest Beat Camp & Demarcated Land Parcel (On-Site Physical Inspection)",
      },
      {
        stageNumber: 3,
        stageName: "Sub-Divisional Level Committee (SDLC) Scrutiny",
        actor: "Sub-Divisional Magistrate (SDM / RDO) & Divisional Forest Officer (DFO)",
        officeType: "Revenue Divisional Officer (RDO) Court",
        timeline: "Within 15 Days",
        description: "SDLC convenes statutory hearing to scrutinize Gram Sabha resolutions, survey dockets, and examine any boundary objections filed by the Forest Department.",
        actionItem: "Monitor RDO office notice board for SDLC resolution docket and attend hearing if called.",
        commonPitfall: "Failure to respond to SDLC query within the statutory 60-day objection period.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Revenue Divisional Officer (RDO / Sub-Collector) Office — SDLC Section Counter #2",
      },
      {
        stageNumber: 4,
        stageName: "District Level Committee (DLC) Final Approval & Joint Patta Distribution",
        actor: "District Collector / Magistrate (Chairperson DLC)",
        officeType: "District Collectorate Land Title Section",
        timeline: "Within 60 Days (Statutory FRA Guarantee)",
        description: "DLC issues final statutory sanction order; District Collector signs and stamps the registered Joint Land Title Deed (bearing names of both husband and wife) and updates revenue land records.",
        actionItem: "Collect physical embossed RoFR Land Title Deed and Forest Land Revenue Passbook.",
        commonPitfall: "Omission of spouse's name on title deed. Under FRA Section 4(4), joint registration of wife and husband is legally mandatory.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "District Collectorate — RoFR Land Records Counter #4 & Tribal Welfare Desk",
      },
    ],
    rejectionChecklist: [
      {
        check: "Are both husband and wife listed as joint claimants on Form A?",
        resolution: "Section 4(4) of FRA mandates joint title deed in the name of both spouses unless the claimant is single.",
      },
      {
        check: "Does the claimant have evidence of forest land occupation prior to 13 December 2005?",
        resolution: "Submit old forest encroachment challans, elder statements, or voter identity records showing residence prior to cut-off.",
      },
    ],
  },

  // --- PM-VIDYALAXMI HIGHER EDUCATION LOAN - TOTALLY ONLINE ---
  PM_Vidyalaxmi_Loan: {
    schemeId: "PM_Vidyalaxmi_Loan",
    schemeTitle: "PM-Vidyalaxmi Higher Education Loan & Central Interest Subsidy Scheme",
    shortCode: "PM-VIDYALAXMI",
    type: "loan",
    categoryLabel: "Central Collateral-Free Education Loan & Full Interest Subsidy",
    sponsoringBody: "Department of Higher Education, Ministry of Education, Government of India",
    benefitHeadline: "Up to ₹10,00,000 Collateral-Free Loan + 100% Full Interest Subsidy during Moratorium",
    statutoryTimeLimit: "15 Days (Direct Bank LOS SLA)",
    officialFee: "₹0.00 (Statutorily Free Processing for loans up to ₹10 Lakhs)",
    portalName: "PM-Vidyalaxmi Unified Portal",
    portalUrl: "https://pmvidyalaxmi.dos.gov.in",
    offlineCounter: "Zero Physical Branch Visits (100% Digital Execution via National Portal)",
    processMode: "TOTALLY_ONLINE",
    processModeLabel: "🌐 100% Fully Online Digital Portal (Zero Bank Branch Visits)",
    processModeDescription: "End-to-end digital processing through the PM-Vidyalaxmi central portal. Registration, NIRF top-860 college seat validation, bank Loan Origination System (LOS) underwriting, and DigiLocker credit occur 100% electronically with zero branch visits.",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card (Student & Co-borrower/Parent)",
        requirement: "Active mobile linked for instant DigiLocker e-KYC and digital Aadhaar e-Sign",
        mandatory: true,
      },
      {
        name: "PAN Card (Student & Parent)",
        requirement: "Automated digital credit bureau check (CIBIL/Equifax) via bank LOS API",
        mandatory: true,
      },
      {
        name: "DigiLocker 10th & 12th Academic Marksheets",
        requirement: "Direct digital pull into PM-Vidyalaxmi application form",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Income_Certificate",
        name: "Income Certificate (Current FY 2026-27)",
        authority: "Tahsildar / Sub-Divisional Magistrate",
        turnaround: "15 Days",
        statutoryCost: "₹25",
        validity: "Current FY",
        keyCondition: "Mandatory for 100% Central Interest Subsidy during moratorium (Family income ≤ ₹8,00,000)",
      },
      {
        certificateId: "College_Admission_Letter",
        name: "Admission Offer / Counseling Allotment Letter",
        authority: "NIRF Top 860 Ranked Institution / Central University",
        turnaround: "Instant",
        statutoryCost: "₹0",
        validity: "Current Academic Session",
        keyCondition: "Institution must be listed on the PM-Vidyalaxmi approved NIRF list with active AISHE code",
      },
    ],
    tier3Institutional: [
      {
        name: "Institutional Fee Structure Proforma",
        authority: "College Finance Officer / Registrar",
        action: "Itemized breakdown of tuition fees, hostel charges, exam fees, and book allowance",
        category: "Academic",
      },
      {
        name: "Bank Aadhaar e-Sign & Digital Mandate",
        authority: "Participating Scheduled Commercial Bank (SBI, Canara, PNB, BoB, etc.)",
        action: "Digital execution of loan agreement via Aadhaar OTP e-Sign; zero physical stamp paper",
        category: "Banking",
      },
    ],
    bankingRequirement: "Savings bank account in student's name for maintenance allowance; institutional college account for direct RTGS tuition credit.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Unified Portal Registration & DigiLocker e-KYC",
        actor: "Student Applicant",
        officeType: "PM-Vidyalaxmi Digital Portal",
        timeline: "Instant (30 Mins)",
        description: "Register on pmvidyalaxmi.dos.gov.in using Aadhaar OTP. Pull academic certificates, admission allotment, and income certificate directly via DigiLocker. Select up to 3 preferred scheduled banks.",
        actionItem: "Fill Common Education Loan Application Form (CELAF) and attach digital fee structure.",
        commonPitfall: "Applying through third-party unverified loan aggregators. Use strictly the official government portal.",
        stageMode: "ONLINE",
        portalLink: "https://pmvidyalaxmi.dos.gov.in",
        portalActionText: "Open PM-Vidyalaxmi Portal",
      },
      {
        stageNumber: 2,
        stageName: "Automated Bank LOS Evaluation & Instant In-Principle Sanction",
        actor: "Scheduled Commercial Bank (Digital Underwriting Engine)",
        officeType: "Centralized Bank Loan Origination System (LOS)",
        timeline: "Within 7–15 Days",
        description: "Participating bank processes CELAF application electronically through automated API checks. If admission is within NIRF top 860 institutions, loan up to ₹10 Lakhs is sanctioned collateral-free and guarantor-free.",
        actionItem: "Review sanction letter on portal dashboard and complete Aadhaar OTP e-Sign.",
        commonPitfall: "Submitting fee quote with unapproved capitation or private hostel charges.",
        stageMode: "ONLINE",
        portalLink: "https://pmvidyalaxmi.dos.gov.in",
        portalActionText: "Track Digital Bank Sanction",
      },
      {
        stageNumber: 3,
        stageName: "Direct Electronic Fee Disbursal & Central Subsidy Tagging",
        actor: "Disbursal Bank & Canara Bank Central Subsidy Nodal Desk",
        officeType: "Electronic Treasury & Core Banking RTGS",
        timeline: "Direct Electronic Disbursement to College",
        description: "Tuition fee is directly credited via RTGS to the institution's verified college bank account. The loan is automatically registered under the Central Sector Interest Subsidy (CSIS) scheme for zero interest during course tenure + 1 year moratorium.",
        actionItem: "Download digital fee disbursement confirmation voucher and submit copy to college accounts section.",
        commonPitfall: "Providing invalid institutional bank IFSC or college AISHE code on application form.",
        stageMode: "ONLINE",
        portalLink: "https://pmvidyalaxmi.dos.gov.in",
        portalActionText: "Download Fee Disbursal Voucher",
      },
    ],
    rejectionChecklist: [
      {
        check: "Is your institution ranked in the top 860 under NIRF or is it a designated national institute?",
        resolution: "Verify college status on the PM-Vidyalaxmi portal NIRF search tool before submitting CELAF.",
      },
      {
        check: "Is your family income under ₹8,00,000 for 100% interest subsidy eligibility?",
        resolution: "Upload a valid Revenue Authority Income Certificate issued in the current financial year to claim interest waiver.",
      },
    ],
  },

  // --- STATUTORY REVENUE SERVICE: CASTE / TRIBE CERTIFICATE ---
  Caste_Certificate: {
    schemeId: "Caste_Certificate",
    schemeTitle: "Permanent Caste / Tribe / Community Certificate (SC / ST / OBC)",
    shortCode: "REV-CERT-CASTE",
    type: "certificate",
    categoryLabel: "Statutory Revenue Certificate (Permanent Validity)",
    sponsoringBody: "State Revenue Department & District Magistrate Administration",
    benefitHeadline: "Permanent Statutory Legal Certificate for Educational Reservations, Fee Waivers & Government Schemes",
    statutoryTimeLimit: "21 Days (State Right to Public Services Act SLA)",
    officialFee: "₹15 – ₹30 (Official RTSA Service Charge; ₹0 cyber cafe extortion)",
    portalName: "State e-District / MeeSeva / RTPS Portal",
    portalUrl: "https://services.india.gov.in",
    offlineCounter: "Tahsildar / Mandal Revenue Office (MRO) Citizen Service Counter #1",
    processMode: "HYBRID",
    processModeLabel: "⚡ Hybrid Workflow: Online Submission + Local Revenue Field Inquiry",
    processModeDescription: "Initial application is filed via state portal (e-District, MeeSeva, e-Sevai, RTPS) or CSC kiosk, followed by mandatory local Village Revenue Officer (VRO) inquiry and Tahsildar digital signature.",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Applicant",
        requirement: "Active mobile linked for digital e-KYC and address verification",
        mandatory: true,
      },
      {
        name: "School Transfer Certificate (TC) / Marksheet",
        requirement: "Original memo citing recorded community / social category",
        mandatory: true,
      },
      {
        name: "Active Mobile & Email",
        requirement: "For SMS application dispatch notifications and digital download PIN",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Father_Caste_Certificate",
        name: "Father's / Blood Relative Caste Certificate",
        authority: "Tahsildar / Sub-Divisional Officer",
        turnaround: "Issued Document",
        statutoryCost: "₹0 (Existing Record)",
        validity: "Permanent",
        keyCondition: "Patrilineal proof establishing hereditary social category entitlement under civil law",
      },
      {
        certificateId: "Ration_Card_Residence",
        name: "Family Ration Card / Domicile Proof",
        authority: "Food & Civil Supplies Department",
        turnaround: "Issued Document",
        statutoryCost: "₹0 (Existing Record)",
        validity: "Active",
        keyCondition: "Proof of long-standing residence in the state jurisdiction",
      },
    ],
    tier3Institutional: [
      {
        name: "Self-Declaration Community Affidavit",
        authority: "Notary Public / Executive Magistrate",
        action: "Sworn legal declaration on non-judicial stamp paper affirming family community status",
        category: "Civic",
      },
      {
        name: "VRO Field Inspection Panchanama",
        authority: "Village Revenue Officer (VRO) / Revenue Inspector",
        action: "Local field inquiry verifying applicant's community standing and neighborhood reputation",
        category: "Civic",
      },
    ],
    bankingRequirement: "No bank account required for certificate issuance. Digital certificate with QR barcode is issued directly into DigiLocker and citizen portal.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Online Portal / CSC Kiosk Submission",
        actor: "Citizen / CSC Operator",
        officeType: "MeeSeva / e-Sevai / e-District Citizen Counter",
        timeline: "Day 1 (Instant)",
        description: "Submit application form along with Aadhaar, father's caste proof, and school record. Pay official statutory fee of ₹25–30 and obtain computerized receipt with acknowledgment number.",
        actionItem: "Collect computerized acknowledgment receipt bearing unique application number.",
        commonPitfall: "Paying ₹200–500 to private middlemen. Statutory fee is strictly ₹25–30.",
        stageMode: "HYBRID",
        portalLink: "https://services.india.gov.in",
        portalActionText: "Open National Services Portal",
        physicalDeskLocation: "MeeSeva / CSC Digital Seva Kiosk / Taluk Reception Desk",
      },
      {
        stageNumber: 2,
        stageName: "Village Revenue Officer (VRO) Field Verification",
        actor: "Village Revenue Officer (VRO)",
        officeType: "Village Secretariat / Gram Panchayat Desk",
        timeline: "Within 7 Days",
        description: "VRO inspects records, conducts local community inquiry, verifies father's land/caste details, and submits spot Panchanama to Revenue Inspector.",
        actionItem: "Be accessible in your village/locality and keep original family caste proofs ready for physical inspection.",
        commonPitfall: "Unavailability during spot field verification causing delay or pending inquiry status.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Village Secretariat (Grama Sachivalayam) / Taluk VRO Desk",
      },
      {
        stageNumber: 3,
        stageName: "Revenue Inspector (RI) Scrutiny & Endorsement",
        actor: "Revenue Inspector (RI)",
        officeType: "Mandal / Hobli Revenue Office",
        timeline: "Within 14 Days",
        description: "RI scrutinizes VRO field inquiry report against state caste gazette schedules and forwards recommendation to Tahsildar.",
        actionItem: "Track application progress online via MeeSeva/e-District acknowledgment number.",
        commonPitfall: "Discrepancy in spelling of sub-caste between applicant school record and father's certificate.",
        stageMode: "ONLINE",
        physicalDeskLocation: "Mandal / Taluk Office — Revenue Inspector Section",
      },
      {
        stageNumber: 4,
        stageName: "Tahsildar / MRO Statutory Approval & Digital Signature",
        actor: "Tahsildar / Mandal Revenue Officer (MRO)",
        officeType: "Tahsildar Executive Court",
        timeline: "Within 21 Days (Statutory RTSA SLA)",
        description: "Tahsildar issues statutory sanction, applies Class-2 digital signature, and system embeds verifiable QR code and 16-digit barcoded certificate ID.",
        actionItem: "Download digital certificate directly from portal or pull into DigiLocker; collect printed copy from CSC center.",
        commonPitfall: "Laminated certificates with unreadable QR codes. Always retain the original digital PDF.",
        stageMode: "ONLINE",
        portalLink: "https://services.india.gov.in",
        portalActionText: "Download Digital Caste Certificate",
        physicalDeskLocation: "Tahsildar Citizen Delivery Counter #1",
      },
    ],
    rejectionChecklist: [
      {
        check: "Does the sub-caste name match the official state gazette schedule exactly?",
        resolution: "Ensure the community name matches the government gazette spelling rather than colloquial local titles.",
      },
      {
        check: "Do you have patrilineal community proof from the father's bloodline?",
        resolution: "Under civil law, social status is patrilineal. Provide father's, grandfather's, or real uncle's caste certificate.",
      },
    ],
  },

  // --- MEDICAL & HEALTHCARE EXPENSES ---
  Ayushman_PMJAY: {
    schemeId: "Ayushman_PMJAY",
    schemeTitle: "Ayushman Bharat PM-JAY & Rashtriya Arogya Nidhi (RAN) Medical Expense Assistance",
    shortCode: "AB-PMJAY-RAN",
    type: "healthcare",
    categoryLabel: "National Health Assurance & Critical Illness Financial Relief",
    sponsoringBody: "National Health Authority (NHA) & Ministry of Health and Family Welfare (MoHFW)",
    benefitHeadline: "₹5,00,000 / Family / Year Cashless Treatment + Up to ₹15 Lakh Critical Care under RAN",
    statutoryTimeLimit: "Instant e-Card at Hospital Kiosk; Pre-Auth within 2 Hours",
    officialFee: "₹0 (100% Statutorily Free)",
    portalName: "NHA Beneficiary Portal (BIS / TMS)",
    portalUrl: "https://beneficiary.nha.gov.in",
    offlineCounter: "Ayushman Mitra Helpdesk at District Hospital / Empaneled Medical College",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card (Patient & Family Head)",
        requirement: "Biometric or OTP verification on NHA Beneficiary Identification System (BIS)",
        mandatory: true,
      },
      {
        name: "Ration Card (NFSA / BPL / Antyodaya / State Food Security)",
        requirement: "Family member list must match names on Aadhaar to establish household eligibility",
        mandatory: true,
      },
      {
        name: "Active Mobile Phone",
        requirement: "For receiving Aadhaar OTP and transaction OTP at hospital admission",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Income_Certificate",
        name: "Income Certificate (Current FY)",
        authority: "Tehsildar / Sub-Divisional Magistrate",
        turnaround: "15 Days",
        statutoryCost: "₹25",
        validity: "Current FY 2026-27 (Mandatory if applying for supplementary Rashtriya Arogya Nidhi relief)",
        keyCondition: "Annual family income must be under ₹2,50,000",
      },
      {
        certificateId: "Resident_Proof",
        name: "State Domicile / Residence Proof",
        authority: "Tahsil / Municipal Corporation",
        turnaround: "15 Days",
        statutoryCost: "₹25",
        validity: "Permanent",
        keyCondition: "Confirms state health agency coverage for specialized state top-ups",
      },
    ],
    tier3Institutional: [
      {
        name: "Government Hospital Specialist Doctor Referral",
        authority: "Civil Surgeon / Medical Superintendent / HOD",
        action: "Doctor referral or clinical admission requisition for specialized secondary/tertiary surgery",
        category: "Healthcare",
      },
      {
        name: "Treatment Cost Estimate Proforma (for RAN / Major Illnesses)",
        authority: "Government Hospital Medical Superintendent",
        action: "Official itemized quote for implants, chemotherapy, cardiac stents, or surgical packages",
        category: "Healthcare",
      },
      {
        name: "Ayushman Mitra Pre-Authorization Request",
        authority: "Empaneled Hospital Ayushman Desk",
        action: "Digital pre-auth raised on NHA Transaction Management System (TMS) before procedure",
        category: "Healthcare",
      },
    ],
    bankingRequirement: "Cashless direct hospital settlement via NHA TMS. No patient bank account needed for treatment; patient pays ₹0 out of pocket.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Pre-Flight Eligibility & e-KYC Verification",
        actor: "Beneficiary / Ayushman Mitra",
        timeline: "Instant (15 mins)",
        description: "Verify household name in the SECC / NFSA database using Aadhaar or Ration Card at any empaneled hospital kiosk.",
        actionItem: "Generate Ayushman Bharat PVC Card on spot with zero fee.",
        commonPitfall: "Spelling variation between Ration card and Aadhaar. Carry both along with voter ID or passport.",
      },
      {
        stageNumber: 2,
        stageName: "Clinical Evaluation & Referral",
        actor: "Government Medical Officer / Empaneled Specialist",
        timeline: "Day 1",
        description: "Specialist diagnoses medical condition and prescribes an empaneled surgical or medical treatment package.",
        actionItem: "Obtain doctor prescription and clinical diagnostic reports (MRI, Biopsy, Blood tests).",
        commonPitfall: "Getting treatment at an un-empaneled private nursing home where Ayushman benefits cannot be claimed.",
      },
      {
        stageNumber: 3,
        stageName: "Hospital TMS Pre-Authorization",
        actor: "Hospital Ayushman Mitra & State Health Agency (SHA)",
        timeline: "Within 2 - 4 Hours",
        description: "Hospital uploads doctor recommendation and diagnostic scans to the NHA TMS portal to obtain government pre-auth.",
        actionItem: "Ensure hospital initiates TMS claim before surgery or ICU transfer.",
        commonPitfall: "Hospital asking for cash deposit as 'security'. Under NHA rules, taking cash for empaneled packages is strictly illegal.",
      },
      {
        stageNumber: 4,
        stageName: "100% Cashless Surgery / Inpatient Care",
        actor: "Empaneled Hospital Medical Team",
        timeline: "Duration of Admission",
        description: "Patient receives surgery, implants, nursing care, room rent, and ICU treatment without paying a single rupee.",
        actionItem: "Sign biometric discharge voucher only upon completion of full medical treatment.",
        commonPitfall: "Paying out-of-pocket for surgical consumables. All medicines, implants, and blood components are 100% covered.",
      },
      {
        stageNumber: 5,
        stageName: "Discharge & 15-Day Free Post-Care Medication",
        actor: "Hospital Pharmacy & Discharge Desk",
        timeline: "At Discharge",
        description: "Hospital provides discharge summary and dispenses 15 days of take-home medications at ₹0 cost.",
        actionItem: "Collect detailed discharge summary and follow-up appointment slip.",
        commonPitfall: "Leaving without collecting the mandatory 15-day post-discharge medication pack.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Is the hospital actively empaneled under AB-PMJAY for your specific surgical specialty?",
        resolution: "Verify hospital empanelment status at beneficiary.nha.gov.in or call toll-free 14555 before admission.",
      },
      {
        check: "Are you being asked to pay cash advance for surgical consumables?",
        resolution: "Immediately quote Section 4 of NHA guidelines to the hospital Nodal Officer or dial 14555 to report extortion.",
      },
    ],
  },

  // --- SCHOLARSHIP: POST-MATRIC ST ---
  PostMatric_ST: {
    schemeId: "PostMatric_ST",
    schemeTitle: "Centrally Sponsored Post-Matric Scholarship for Scheduled Tribe (ST) Students",
    shortCode: "MoTA-PMS-ST",
    type: "scholarship",
    categoryLabel: "Centrally Sponsored Higher Education Scholarship",
    sponsoringBody: "Ministry of Tribal Affairs (MoTA), Government of India (75:25 Central:State)",
    benefitHeadline: "100% Compulsory Tuition Waiver + Up to ₹1,200/mo Hosteller Stipend",
    statutoryTimeLimit: "30 Days after College INO Verification",
    officialFee: "₹0.00 (Free Application)",
    portalName: "National Scholarship Portal (NSP) / State Tribal DBT",
    portalUrl: "https://scholarships.gov.in",
    offlineCounter: "District Welfare Officer (DWO) / College Scholarship Clerk Desk",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Student",
        requirement: "Must have exact full name matching Class 10th certificate and active mobile linked",
        mandatory: true,
      },
      {
        name: "Class 10th Secondary Board Marksheet & Certificate",
        requirement: "Sole authentic proof for date of birth and spelling of student & parents' names",
        mandatory: true,
      },
      {
        name: "Father's / Paternal Relative's 1950 Land Record (RoR)",
        requirement: "Required by Tehsildar to verify original tribal ancestry for Caste Validity",
        mandatory: true,
      },
      {
        name: "Family Ration Card / BPL Card",
        requirement: "Identifies family composition and basic address verification",
        mandatory: false,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Caste_Certificate",
        name: "Scheduled Tribe (ST) Certificate & Validity",
        authority: "Sub-Divisional Officer (SDO) / Tehsildar / District Magistrate",
        turnaround: "30 Days",
        statutoryCost: "₹30",
        validity: "Permanent / Lifetime",
        keyCondition: "Must explicitly specify notified tribe under Presidential Order",
      },
      {
        certificateId: "Income_Certificate",
        name: "Statutory Family Income Certificate",
        authority: "Tehsildar / Competent Revenue Authority",
        turnaround: "15 Days",
        statutoryCost: "₹25",
        validity: "Issued in Current FY 2026-27 (Valid for 1 Year)",
        keyCondition: "Total annual family income from all sources must not exceed ₹2,50,000",
      },
    ],
    tier3Institutional: [
      {
        name: "College Bonafide Student Certificate",
        authority: "College Principal / Registrar Office",
        action: "Must confirm current academic year enrollment in regular full-time mode",
        category: "Academic",
      },
      {
        name: "College Non-Refundable Fee Structure Breakdown",
        authority: "College Accounts Section",
        action: "Itemizes tuition, examination, and laboratory fees for 100% reimbursement",
        category: "Academic",
      },
      {
        name: "Hosteller Certificate (if claiming hostel stipend)",
        authority: "Hostel Chief Warden",
        action: "Certifies resident status to unlock higher ₹1,200/mo stipend vs ₹550 day-scholar rate",
        category: "Academic",
      },
      {
        name: "Aadhaar NPCI DBT Bank Account Mandate",
        authority: "Designated Nationalized Bank Branch",
        action: "Bank manager submits Annexure I mandate into NPCI APBS Mapper",
        category: "Banking",
      },
    ],
    bankingRequirement: "Aadhaar MUST be seeded on the NPCI DBT Mapper. Simple core banking linking is INSUFFICIENT.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Pre-Flight Audit & Prerequisite Assembly",
        actor: "Student (Self)",
        timeline: "Week 1 - 2",
        description: "Obtain Income Certificate (< ₹2.5L) from Tehsildar and check NPCI bank account seeding status.",
        actionItem: "Run JanSetu Document Audit to catch any initial spelling mismatch before portal entry.",
        commonPitfall: "Using previous year's expired income certificate or submitting unseeded bank account.",
      },
      {
        stageNumber: 2,
        stageName: "NSP / State Portal Online Submission",
        actor: "Student",
        timeline: "Before Portal Deadline",
        description: "Complete e-KYC on National Scholarship Portal with Aadhaar OTP, enter college admission details, and upload documents.",
        actionItem: "Save generated Application ID and print acknowledgment slip.",
        commonPitfall: "Selecting wrong course type (Distance instead of Regular) or incorrect admission category.",
      },
      {
        stageNumber: 3,
        stageName: "Institute Nodal Officer (INO) Physical Audit",
        actor: "College Principal / INO Clerk",
        timeline: "Within 10 Days of Submission",
        description: "College INO logs into NSP admin portal, cross-checks uploaded certificates against physical originals, and marks 'VERIFIED'.",
        actionItem: "Physically submit printed acknowledgment and attested photocopies to college scholarship clerk.",
        commonPitfall: "Application silently languishing on college clerk's pending desk until verification portal closes.",
      },
      {
        stageNumber: 4,
        stageName: "District Welfare Officer (DWO) Sanction",
        actor: "District Welfare Officer / State Tribal Dept",
        timeline: "15 - 20 Days post-INO",
        description: "DWO verifies district quota, income authenticity via revenue database, and generates merit sanction order.",
        actionItem: "Track application status weekly on NSP; respond promptly if marked 'Defective'.",
        commonPitfall: "If marked 'Defective' for unclear document scan, student must re-upload within 72 hours.",
      },
      {
        stageNumber: 5,
        stageName: "PFMS Treasury Direct Benefit Transfer (DBT)",
        actor: "Public Financial Management System (PFMS) & Ministry",
        timeline: "Direct Disbursal",
        description: "Ministry generates digital payment file. PFMS credits 100% tuition directly to college/student and monthly stipend to bank account.",
        actionItem: "Verify credit SMS from PFMS via Aadhaar Payment Bridge.",
        commonPitfall: "Inactive bank account causing payment bounce back to central treasury.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Does your name on the Class 10 marksheet have initials while Aadhaar has full name?",
        resolution: "Execute JanSetu Name Affidavit and submit to college INO along with application.",
      },
      {
        check: "Is your bank account seeded on the NPCI Mapper?",
        resolution: "Download pre-filled JanSetu NPCI Annexure I Mandate and have bank branch manager seal it.",
      },
    ],
  },

  // --- SCHOLARSHIP: AICTE PRAGATI FOR GIRLS ---
  AICTE_Pragati: {
    schemeId: "AICTE_Pragati",
    schemeTitle: "AICTE Pragati Scholarship Scheme for Girl Students (Technical Degree & Diploma)",
    shortCode: "AICTE-PRAGATI",
    type: "scholarship",
    categoryLabel: "Central Merit Scholarship for Women in Technical Education",
    sponsoringBody: "All India Council for Technical Education (AICTE), Ministry of Education",
    benefitHeadline: "₹50,000 / Year Contingency & Tuition Grant",
    statutoryTimeLimit: "Annual Cycle (Disbursed in single lump sum)",
    officialFee: "₹0.00",
    portalName: "National Scholarship Portal (NSP)",
    portalUrl: "https://scholarships.gov.in",
    offlineCounter: "AICTE Institute Verification Cell / College Technical Desk",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Female Student",
        requirement: "Must show student as Female with mobile number linked",
        mandatory: true,
      },
      {
        name: "Class 10th & 12th Qualifying Exam Marksheets",
        requirement: "Proof of qualifying eligibility for admission into degree/diploma program",
        mandatory: true,
      },
      {
        name: "Centralized Admission Counseling (CAP) Allotment Letter",
        requirement: "Proof that admission was obtained via merit counseling (JEE / State CET)",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Income_Certificate",
        name: "Annual Family Income Certificate",
        authority: "Tehsildar / Sub-Divisional Officer",
        turnaround: "15 Days",
        statutoryCost: "₹25",
        validity: "Current FY 2026-27",
        keyCondition: "Annual family income must be under ₹8,00,000",
      },
      {
        certificateId: "Sibling_Affidavit",
        name: "Notarized Sibling Affidavit (Parental Declaration)",
        authority: "Executive Magistrate / Notary Public",
        turnaround: "Same Day",
        statutoryCost: "₹50 Stamp Paper",
        validity: "Academic Year",
        keyCondition: "Affirms candidate is one of maximum TWO daughters availing Pragati benefits",
      },
    ],
    tier3Institutional: [
      {
        name: "AICTE Approved Institution Bonafide Certificate",
        authority: "College Principal / Dean",
        action: "Certifies that the specific technical course and institution have active AICTE approval",
        category: "Academic",
      },
      {
        name: "First Year Tuition Fee Receipt",
        authority: "College Accounts Section",
        action: "Verifies regular admission and paid academic tuition",
        category: "Academic",
      },
      {
        name: "Aadhaar Seeded Bank Account in Student's Solo Name",
        authority: "Nationalized Bank Branch",
        action: "Must be in student's sole name (joint accounts with parents are strictly rejected)",
        category: "Banking",
      },
    ],
    bankingRequirement: "Solo bank account seeded with Aadhaar on NPCI. Joint accounts with father/mother lead to immediate PFMS rejection.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Central Counseling Admission & Notary Affidavit",
        actor: "Student & Parents",
        timeline: "Post-Admission (Month 1)",
        description: "Secure admission through government counseling and execute the mandatory sibling declaration on ₹50 non-judicial stamp paper.",
        actionItem: "Verify your college has active AICTE code for your specific engineering branch.",
        commonPitfall: "Management quota admissions are ineligible. Must have government counseling rank allotment letter.",
      },
      {
        stageNumber: 2,
        stageName: "NSP Pragati Portal Online Application",
        actor: "Student",
        timeline: "September - October",
        description: "Register on scholarships.gov.in under AICTE Scheme section. Enter AICTE institute code and upload certificates.",
        actionItem: "Select 'AICTE - Pragati Scholarship Scheme for Girl Students'.",
        commonPitfall: "Entering wrong AICTE permanent institute ID resulting in mismatch.",
      },
      {
        stageNumber: 3,
        stageName: "Institute Verification Officer Sign-off",
        actor: "College AICTE Nodal Officer",
        timeline: "Within 14 Days",
        description: "College checks student's regular attendance, AICTE approval code, and merit admission status.",
        actionItem: "Submit physical copies of counseling letter and sibling affidavit to college office.",
        commonPitfall: "Not checking with college clerk before deadline to ensure verification is clicked.",
      },
      {
        stageNumber: 4,
        stageName: "AICTE Central Screening & Sanction Order",
        actor: "AICTE HQ, New Delhi",
        timeline: "November - December",
        description: "AICTE scrutinizes all applications nationwide and releases official merit list of selected girl candidates.",
        actionItem: "Check AICTE website and NSP portal for name in provisional merit list.",
        commonPitfall: "Income certificate issued by unauthorized local leader instead of Tehsildar.",
      },
      {
        stageNumber: 5,
        stageName: "Direct Disbursal of ₹50,000 Grant via PFMS",
        actor: "PFMS Treasury",
        timeline: "January - February",
        description: "Entire ₹50,000 lump sum is credited directly into student's Aadhaar-seeded solo bank account.",
        actionItem: "Withdraw or transfer funds for tuition, laptop purchase, books, or living expenses.",
        commonPitfall: "Account marked dormant due to zero transactions in preceding 6 months.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Are you admitted through Management or NRI quota?",
        resolution: "Only candidates admitted through centralized state/national merit counseling are eligible.",
      },
      {
        check: "Are more than 2 daughters from your family availing Pragati?",
        resolution: "Scheme is strictly capped at maximum two daughters per household.",
      },
    ],
  },

  // --- SCHOLARSHIP: UGC ISHAAN UDAY (NER) ---
  Ishaan_Uday_NER: {
    schemeId: "Ishaan_Uday_NER",
    schemeTitle: "UGC Ishaan Uday Special Scholarship Scheme for North Eastern Region (NER)",
    shortCode: "UGC-ISHAAN-UDAY",
    type: "scholarship",
    categoryLabel: "Special Regional Higher Education Scholarship",
    sponsoringBody: "University Grants Commission (UGC), Ministry of Education (10,000 fresh awards/year)",
    benefitHeadline: "Up to ₹7,800 / month (Technical/Medical) or ₹5,400 / month (General Degree)",
    statutoryTimeLimit: "Monthly DBT Disbursement for entire duration of degree",
    officialFee: "₹0.00",
    portalName: "National Scholarship Portal (NSP)",
    portalUrl: "https://scholarships.gov.in",
    offlineCounter: "UGC Desk / University Registrar Office",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card with NER Address",
        requirement: "Identifies permanent domicile within one of the 8 North Eastern States",
        mandatory: true,
      },
      {
        name: "Class 12th Board Marksheet & Passing Certificate",
        requirement: "Proof of passing Class 12 from a recognized school in the North East region",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Domicile_Certificate",
        name: "Permanent Resident Certificate (PRC) / Domicile of NER State",
        authority: "Deputy Commissioner (DC) / Sub-Divisional Officer (Civil)",
        turnaround: "21 Days",
        statutoryCost: "₹30",
        validity: "Permanent",
        keyCondition: "Must be issued by Assam, Arunachal, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, or Tripura",
      },
      {
        certificateId: "Income_Certificate",
        name: "Family Income Certificate",
        authority: "Tehsildar / SDO / Circle Officer",
        turnaround: "15 Days",
        statutoryCost: "₹25",
        validity: "Current FY 2026-27",
        keyCondition: "Annual family income must be under ₹4,50,000",
      },
    ],
    tier3Institutional: [
      {
        name: "UGC Recognized University / College Bonafide",
        authority: "College Registrar / Principal",
        action: "Confirms regular full-time enrollment in general degree, engineering, medical, or paramedical course",
        category: "Academic",
      },
      {
        name: "Aadhaar NPCI DBT Bank Account",
        authority: "Canara Bank / Public Sector Bank",
        action: "Canara Bank manages the UGC DBT scholarship portal on behalf of UGC",
        category: "Banking",
      },
    ],
    bankingRequirement: "Aadhaar seeded bank account. Canara Bank manages UGC DBT portal.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Obtain North East PRC & Income Proof",
        actor: "Student & Circle Officer",
        timeline: "Week 1 - 3",
        description: "Obtain your state Permanent Resident Certificate from the DC/SDO office and current income certificate from Circle Officer.",
        actionItem: "Verify domicile matches your permanent home state address.",
        commonPitfall: "Submitting temporary resident proof instead of statutory Permanent Resident Certificate.",
      },
      {
        stageNumber: 2,
        stageName: "NSP Online Application (Ishaan Uday)",
        actor: "Student",
        timeline: "October - November",
        description: "Select UGC Ishaan Uday on NSP. Fill 12th board marks, college enrollment details, and upload PRC and Income docs.",
        actionItem: "Save application submission PDF and upload legible high-resolution scans.",
        commonPitfall: "Applying under general state scholarship instead of the dedicated UGC Ishaan Uday quota.",
      },
      {
        stageNumber: 3,
        stageName: "College Verification by University Nodal Officer",
        actor: "University Nodal Officer",
        timeline: "Within 15 Days",
        description: "College verifies that the student passed Class 12 from a school within NER and is enrolled full-time.",
        actionItem: "Submit photocopies of Class 12 marksheet and PRC to college scholarship desk.",
        commonPitfall: "Enrolled in distance/open university courses (IGNOU) which are ineligible for Ishaan Uday.",
      },
      {
        stageNumber: 4,
        stageName: "UGC Merit List Compilation (10,000 Slots)",
        actor: "UGC North Eastern Bureau",
        timeline: "December - January",
        description: "UGC prepares state-wise quota list based on Class 12 percentage and releases award letters.",
        actionItem: "Track provisional merit list notification on UGC and NSP portals.",
        commonPitfall: "Not renewing annually before cutoff date in 2nd and 3rd year.",
      },
      {
        stageNumber: 5,
        stageName: "Monthly Disbursal into Bank Account",
        actor: "Canara Bank / PFMS DBT Gateway",
        timeline: "Monthly Disbursal",
        description: "Stipend of ₹7,800/month (technical) or ₹5,400/month (general) is disbursed monthly via Direct Benefit Transfer.",
        actionItem: "Maintain regular attendance in college to ensure semester continuity mark.",
        commonPitfall: "Bank account reaching dormant status due to lack of debits/credits.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Are you enrolled in an Open University (IGNOU / Distance mode)?",
        resolution: "Ishaan Uday strictly requires regular, full-time on-campus enrollment.",
      },
      {
        check: "Is your permanent residence outside the 8 North Eastern States?",
        resolution: "Scheme is exclusively reserved for candidates with permanent domicile in the 8 NE States.",
      },
    ],
  },

  // --- STATUTORY CERTIFICATE: INCOME & ASSET CERTIFICATE ---
  Income_Certificate: {
    schemeId: "Income_Certificate",
    schemeTitle: "Statutory Family Income & Asset Certificate (Tahsil / Revenue Administration)",
    shortCode: "REVENUE-INC-CERT",
    type: "certificate",
    categoryLabel: "Mandatory Civic Prerequisite for All Welfare & Scholarship Schemes",
    sponsoringBody: "State Revenue & Disaster Management Department (Right to Public Services Act)",
    benefitHeadline: "Unlocks 100% of Government Scholarships, Subsidized Housing & Fee Waivers",
    statutoryTimeLimit: "15 Working Days (State RTSA Legal Guarantee)",
    officialFee: "₹25 – ₹30 (Statutory Service Charge)",
    portalName: "State e-District / JharSewa / Odisha e-District / MeeSeva",
    portalUrl: "https://serviceonline.gov.in",
    offlineCounter: "Tahsil Office / Common Service Center (CSC) / RTPS Counter",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Family Head & Applicant",
        requirement: "Address must match revenue village or urban municipal ward",
        mandatory: true,
      },
      {
        name: "Ration Card (NFSA / State Food Security Card)",
        requirement: "Identifies total count of family members and earning status",
        mandatory: true,
      },
      {
        name: "Salary Slip / Form 16 (Salaried) OR Self-Declaration Affidavit (Agriculture/Daily Wage)",
        requirement: "Itemized source-of-income breakdown from agriculture, labor, business, or employment",
        mandatory: true,
      },
      {
        name: "Electricity Bill / Property Tax Receipt",
        requirement: "Establishes local residence and consumer tariff category",
        mandatory: false,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Self_Affidavit",
        name: "Self-Declaration Income Affidavit",
        authority: "Notary Public / Executive Magistrate",
        turnaround: "Same Day",
        statutoryCost: "₹20 Stamp",
        validity: "One-Time for application",
        keyCondition: "Declares all family sources of income under oath",
      },
    ],
    tier3Institutional: [
      {
        name: "Revenue Inspector (RI) / Lekhpal Field Panchanama",
        authority: "Local Revenue Inspector (Halka / Circle)",
        action: "Officer conducts spot inquiry with neighbors and verifies agricultural land or daily wage",
        category: "Civic",
      },
      {
        name: "Tehsildar / Sub-Divisional Magistrate Digital Sign-off",
        authority: "Office of the Tahsildar",
        action: "Verifies RI recommendation and attaches digital cryptographic signature to certificate",
        category: "Civic",
      },
    ],
    bankingRequirement: "No bank account required. Fee paid at CSC counter or online portal payment gateway (₹25).",
    stages: [
      {
        stageNumber: 1,
        stageName: "Application Lodgment at CSC / e-District",
        actor: "Citizen / CSC Operator",
        timeline: "Day 1",
        description: "Submit online form on State e-District portal or at village CSC counter. Pay official fee of ₹25.",
        actionItem: "Collect computerized acknowledgment slip with unique Application Tracking Number.",
        commonPitfall: "Paying ₹200+ extortion fee to unauthorized cyber cafe operators. Demand official receipt.",
      },
      {
        stageNumber: 2,
        stageName: "File Routing to Revenue Inspector (RI)",
        actor: "Tahsil Record Clerk",
        timeline: "Day 2 - 4",
        description: "System automatically routes application to local Revenue Inspector (RI) / Patwari of the village/ward.",
        actionItem: "Keep phone active; RI may contact applicant for land/occupation verification.",
        commonPitfall: "Application stalled if applicant provides an incomplete or uncontactable telephone number.",
      },
      {
        stageNumber: 3,
        stageName: "Neighborhood Spot Inquiry & Panchanama",
        actor: "Revenue Inspector / Lekhpal",
        timeline: "Day 5 - 9",
        description: "RI inspects agricultural landholding or verifies informal daily wage with village head/neighbors and submits digital report.",
        actionItem: "Present ration card and land deed (if any) during inquiry.",
        commonPitfall: "Failure to produce land record (RoR) if family owns agricultural parcel.",
      },
      {
        stageNumber: 4,
        stageName: "Tehsildar Scrutiny & Sanction",
        actor: "Tahsildar / Additional Tahsildar",
        timeline: "Day 10 - 14",
        description: "Tehsildar reviews RI recommendation, approves statutory income figure, and applies digital signature token.",
        actionItem: "Track progress using the e-District Application Number via SMS or portal.",
        commonPitfall: "Ignoring deficiency query on portal; respond within 7 days if clarification is requested.",
      },
      {
        stageNumber: 5,
        stageName: "Issuance of Digitally Signed Certificate",
        actor: "e-District Portal / Citizen",
        timeline: "Day 15 (RTSA Mandate)",
        description: "QR-coded, digitally signed Income Certificate is issued. Download directly from home or collect from CSC.",
        actionItem: "Verify QR code using mobile phone scanner to ensure validity before applying for scholarships.",
        commonPitfall: "Downloading fake certificate from unverified agents without official government QR code.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Are you being charged more than ₹30 by an offline counter?",
        resolution: "Quote your state Right to Public Services Act (RTSA) schedule. Central cap is ₹25–₹30.",
      },
      {
        check: "Did the Tahsil office delay your certificate past 15 working days?",
        resolution: "File an instant online First Appeal under the Right to Public Services Act against the Tehsildar.",
      },
    ],
  },

  // --- TAMIL NADU: PUDHUMAI PENN SCHEME ---
  TN_Pudhumai_Penn: {
    schemeId: "TN_Pudhumai_Penn",
    schemeTitle: "Moovalur Ramamirtham Ammaiyar Higher Education Assurance (Pudhumai Penn Scheme)",
    shortCode: "TN-PUDHUMAI-PENN",
    type: "scholarship",
    categoryLabel: "Tamil Nadu Flagship Higher Education Scheme for Women",
    sponsoringBody: "Social Welfare and Women Empowerment Department, Government of Tamil Nadu",
    benefitHeadline: "₹1,000 / Month Direct DBT into Bank Account (₹12,000 / Year)",
    statutoryTimeLimit: "Monthly DBT on the 7th of every month",
    officialFee: "₹0.00 (100% Free Scheme)",
    portalName: "Tamil Nadu Pudhumai Penn Portal",
    portalUrl: "https://pudhumaipenn.tn.gov.in",
    offlineCounter: "College Scholarship Clerk / District Social Welfare Officer (DSWO) Desk",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Female Student",
        requirement: "Active mobile linked for e-KYC and SMS transaction alerts",
        mandatory: true,
      },
      {
        name: "EMIS Student ID (Education Management Info System)",
        requirement: "14-digit state EMIS tracking code from school education records",
        mandatory: true,
      },
      {
        name: "Class 6th to 12th Continuous Government School Study Bonafide",
        requirement: "Must certify continuous schooling in Tamil Nadu Government Schools (Corporation, Municipality, Tribal, Adi Dravidar schools included)",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Govt_School_Bonafide",
        name: "Class 6-12 Govt School Study Bonafide Certificate",
        authority: "Headmaster of Government Higher Secondary School / DEO",
        turnaround: "1 - 3 Days",
        statutoryCost: "₹0.00",
        validity: "Permanent",
        keyCondition: "Mandatory statutory proof. No parental income limit applies for Pudhumai Penn!",
      },
    ],
    tier3Institutional: [
      {
        name: "College UMIS Portal Bonafide Endorsement",
        authority: "College Principal / UMIS Nodal Officer",
        action: "Principal verifies regular college attendance on state University Management Information System",
        category: "Academic",
      },
      {
        name: "Aadhaar Seeded Solo Bank Account in Student's Name",
        authority: "Nationalized / Scheduled Commercial Bank",
        action: "Direct Benefit Transfer credited via Indian Overseas Bank / Canara Bank treasury gateway",
        category: "Banking",
      },
    ],
    bankingRequirement: "Solo bank account in student's name seeded with Aadhaar on the NPCI mapper. ₹1,000 credited on the 7th of every month.",
    stages: [
      {
        stageNumber: 1,
        stageName: "School EMIS & Bonafide Generation",
        actor: "Student & School Headmaster",
        timeline: "Post-Admission (Month 1)",
        description: "Obtain the official 6th-12th Government School Study Certificate with EMIS validation from your high school headmaster.",
        actionItem: "Collect sealed certificate from school and upload to college scholarship coordinator.",
        commonPitfall: "Break in government schooling (e.g. studied Class 9 in a private school disqualifies candidate).",
      },
      {
        stageNumber: 2,
        stageName: "UMIS College Online Registration",
        actor: "College Nodal Officer & Student",
        timeline: "August - October",
        description: "College enters student's EMIS number into the Tamil Nadu UMIS (pudhumaipenn.tn.gov.in) portal.",
        actionItem: "Verify bank account number and Aadhaar linking on the portal confirmation screen.",
        commonPitfall: "Submitting parent's joint bank account instead of student's individual savings account.",
      },
      {
        stageNumber: 3,
        stageName: "College Principal Digital Sign-off",
        actor: "College Principal",
        timeline: "Within 7 Days",
        description: "Principal verifies college enrollment in recognized UG degree or diploma program and forwards batch file.",
        actionItem: "Check with college scholarship section that student profile is marked 'FORWARDED'.",
        commonPitfall: "Profile remaining in 'DRAFT' status on college dashboard before state portal closing date.",
      },
      {
        stageNumber: 4,
        stageName: "District Social Welfare Officer (DSWO) Sanction",
        actor: "DSWO (District Collectorate)",
        timeline: "Within 14 Days",
        description: "DSWO conducts automated EMIS database matching with School Education Department to verify continuous government schooling.",
        actionItem: "Track sanction notification via SMS.",
        commonPitfall: "Aadhaar demographic mismatch with school marksheets.",
      },
      {
        stageNumber: 5,
        stageName: "Monthly Direct Benefit Transfer (DBT)",
        actor: "Tamil Nadu State Treasury",
        timeline: "Every Month (7th)",
        description: "₹1,000 is directly credited into the student's bank account every month until completion of degree.",
        actionItem: "Check bank SMS notification on the 7th of every month.",
        commonPitfall: "Dormant bank account blocking treasury transfer.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Did you study in a private-aided or matriculation school for even 1 year between Class 6 and 12?",
        resolution: "Pudhumai Penn legally requires all 7 years (Class 6 to 12) to be in Government Schools.",
      },
      {
        check: "Are you availing another state/central scholarship?",
        resolution: "Pudhumai Penn is an educational incentive and can be legally received alongside ANY other scholarship!",
      },
    ],
  },

  // --- TAMIL NADU: FIRST GRADUATE SCHEME ---
  TN_First_Graduate: {
    schemeId: "TN_First_Graduate",
    schemeTitle: "Tamil Nadu First Graduate Tuition Fee Concession (Mudhal Thalaimurai Pattadhari)",
    shortCode: "TN-FIRST-GRADUATE",
    type: "scholarship",
    categoryLabel: "Tamil Nadu Professional Education Fee Concession",
    sponsoringBody: "Directorate of Technical Education (DoTE) / Higher Education Dept, Govt of Tamil Nadu",
    benefitHeadline: "₹25,000 to ₹30,000 / Year Tuition Fee Concession (Deducted upfront on College Fee Bill)",
    statutoryTimeLimit: "Deducted at the time of College Admission Verification",
    officialFee: "₹60 (e-Sevai Certificate Application Fee)",
    portalName: "TNEA & TNeGA e-Sevai Portal",
    portalUrl: "https://www.tneaonline.org",
    offlineCounter: "e-Sevai Center / Tahsildar Office & Allotted Engineering College Desk",
    tier1BaseIdentity: [
      {
        name: "Candidate Class 10th & 12th Board Marksheets",
        requirement: "Proof of passing qualifying examination for professional degree entry",
        mandatory: true,
      },
      {
        name: "Father & Mother School Transfer Certificates (TC)",
        requirement: "Must show parents have not completed any college degree or diploma",
        mandatory: true,
      },
      {
        name: "Elder Siblings School Transfer Certificates (if applicable)",
        requirement: "Proves that elder brothers or sisters have not pursued undergraduate degrees",
        mandatory: true,
      },
      {
        name: "Tamil Nadu Smart Family Card / Ration Card",
        requirement: "Establishes entire household composition",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "TN_First_Graduate_Cert",
        name: "First Graduate Certificate (Mudhal Pattadhari)",
        authority: "Tahsildar / Sub-Divisional Magistrate (via e-Sevai REV-104)",
        turnaround: "15 Days",
        statutoryCost: "₹60",
        validity: "Permanent / Lifetime",
        keyCondition: "Issued through e-Sevai portal. No member in immediate family holds an undergraduate degree!",
      },
      {
        certificateId: "Joint_Declaration",
        name: "First Graduate Joint Declaration Form",
        authority: "Signed jointly by Applicant and Parents on ₹20 Stamp Paper",
        turnaround: "Same Day",
        statutoryCost: "₹20 Stamp",
        validity: "Academic Degree Tenure",
        keyCondition: "Affirms that neither parents nor siblings hold or are availing first graduate concessions",
      },
    ],
    tier3Institutional: [
      {
        name: "TNEA Single Window Merit Counseling Allotment Order",
        authority: "Tamil Nadu Engineering Admissions (Anna University / DoTE)",
        action: "Must be admitted through government single window counseling quota (not management quota)",
        category: "Academic",
      },
      {
        name: "College Admission Fee Concession Adjustment Voucher",
        authority: "Allotted Engineering / Medical College Accounts Desk",
        action: "College immediately subtracts ₹25,000–₹30,000 from the student's tuition fee demand note",
        category: "Academic",
      },
    ],
    bankingRequirement: "No student bank account needed for tuition concession. College accounts section adjusts ₹25,000 upfront.",
    stages: [
      {
        stageNumber: 1,
        stageName: "e-Sevai First Graduate Certificate Application",
        actor: "Applicant & e-Sevai Center",
        timeline: "Prior to TNEA Counseling",
        description: "Submit parent TCs, sibling TCs, and joint declaration at your nearest e-Sevai center (Code REV-104). Pay ₹60 official fee.",
        actionItem: "Download digitally signed First Graduate Certificate from e-Sevai portal within 15 days.",
        commonPitfall: "Missing Transfer Certificate of elder sibling resulting in rejection by Tahsildar.",
      },
      {
        stageNumber: 2,
        stageName: "TNEA Single Window Counseling Selection",
        actor: "Candidate",
        timeline: "July - August",
        description: "During TNEA online registration, mark 'YES' for First Graduate Tuition Concession and upload the e-Sevai certificate.",
        actionItem: "Ensure TNEA provisional seat allotment order explicitly displays 'FIRST GRADUATE: YES'.",
        commonPitfall: "Forgetting to tick the First Graduate checkbox during counseling form submission.",
      },
      {
        stageNumber: 3,
        stageName: "Physical Document Audit at College",
        actor: "College Admission Officer",
        timeline: "Day of College Admission",
        description: "Present the original e-Sevai First Graduate Certificate and signed joint declaration to college accounts.",
        actionItem: "Verify college deducts ₹25,000 from the tuition fee receipt before making payment.",
        commonPitfall: "Allowing college clerks to charge full tuition with promise of refund later. Under DoTE rules, fee MUST be deducted upfront.",
      },
      {
        stageNumber: 4,
        stageName: "DoTE State Reimbursement Claim",
        actor: "College & Directorate of Technical Education",
        timeline: "Semester 1",
        description: "College submits the first graduate batch claim to DoTE for reimbursement of the waived tuition fee.",
        actionItem: "Ensure your name appears in the college First Graduate verified list.",
        commonPitfall: "Transferring to management quota in 2nd year cancels future fee concessions.",
      },
      {
        stageNumber: 5,
        stageName: "4-Year Continuous Tuition Exemption",
        actor: "State Higher Education Dept",
        timeline: "Every Academic Year",
        description: "Student pays ₹25,000 less tuition fee every single year for all 4 years of their degree program.",
        actionItem: "Maintain regular academic enrollment; no annual re-application to Tahsildar needed.",
        commonPitfall: "Discontinuing course or getting rusticated.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Does your father, mother, elder brother, or elder sister hold an undergraduate degree?",
        resolution: "The scheme strictly requires that NO person in the family has completed a college degree.",
      },
      {
        check: "Are you admitted through Management or NRI quota?",
        resolution: "First Graduate fee concession is strictly restricted to government single-window counseling seats.",
      },
    ],
  },

  // --- TAMIL NADU: 7.5% GOVT SCHOOL QUOTA ---
  TN_7_5_Govt_School_Quota: {
    schemeId: "TN_7_5_Govt_School_Quota",
    schemeTitle: "7.5% Preferential Quota 100% Full Fee Exemption for Government School Students",
    shortCode: "TN-7.5-GOVT-QUOTA",
    type: "scholarship",
    categoryLabel: "Tamil Nadu Statutory 7.5% Preferential Reservation Act",
    sponsoringBody: "Government of Tamil Nadu Statutory Enactment",
    benefitHeadline: "100% Full Tuition, Hostel, and Mess Fee Exemption (Zero Out-of-Pocket Expense)",
    statutoryTimeLimit: "Immediate 100% Fee Exemption upon seat allotment",
    officialFee: "₹0.00 (Statutorily Free)",
    portalName: "TNEA / TN Medical Selection Committee",
    portalUrl: "https://www.tneaonline.org",
    offlineCounter: "Allotted College Admission Desk",
    tier1BaseIdentity: [
      {
        name: "Allotment Order under 7.5% Preferential Quota",
        requirement: "Issued by TNEA (Engineering) or DME (Medical) under 7.5% quota",
        mandatory: true,
      },
      {
        name: "Class 6th to 12th Continuous Government School Study Certificate",
        requirement: "Sealed and verified by Government School Headmaster and District Educational Officer (DEO)",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Govt_School_Bonafide",
        name: "Govt School Study Bonafide with EMIS",
        authority: "DEO / Chief Educational Officer (CEO)",
        turnaround: "1 - 3 Days",
        statutoryCost: "₹0.00",
        validity: "Permanent",
        keyCondition: "Mandatory statutory verification of 7-year government schooling",
      },
    ],
    tier3Institutional: [
      {
        name: "College 100% Zero-Fee Admission Receipt",
        authority: "Allotted College Principal / Accounts Office",
        action: "Issues official receipt showing ₹0 payable for tuition, hostel, and mess charges",
        category: "Academic",
      },
    ],
    bankingRequirement: "100% cashless fee exemption. State Government reimburses entire cost directly to college.",
    stages: [
      {
        stageNumber: 1,
        stageName: "7.5% Quota Merit Counseling Seat Allotment",
        actor: "Selection Committee (TNEA / DME)",
        timeline: "Counseling Day",
        description: "Candidate secures admission under the 7.5% preferential reservation quota for government school students.",
        actionItem: "Download provisional allotment letter clearly stating 'Allotted under 7.5% Govt School Quota'.",
        commonPitfall: "Failing to produce the DEO-signed 6th-12th study certificate during counseling verification.",
      },
      {
        stageNumber: 2,
        stageName: "College Zero-Fee Admission Enrollment",
        actor: "College Principal",
        timeline: "Within Allotment Reporting Date",
        description: "Report to allotted government or self-financing college. College enrolls student without charging ANY fee.",
        actionItem: "Collect ₹0 fee receipt and free hostel room allotment slip.",
        commonPitfall: "College demanding 'caution deposit' or 'building fund'. Demanding any fee is punishable by law.",
      },
      {
        stageNumber: 3,
        stageName: "State Treasury Reimbursement to College",
        actor: "TN State Higher Education Department",
        timeline: "Annual Settlement",
        description: "Tamil Nadu Government releases tuition, hostel, and examination fee reimbursement directly to the college.",
        actionItem: "Focus 100% on academic studies.",
        commonPitfall: "None.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Did you join the college through management quota?",
        resolution: "The 7.5% fee exemption is strictly for students admitted through the government 7.5% counseling quota.",
      },
    ],
  },

  // --- TAMIL NADU: CMCHIS HEALTH INSURANCE ---
  TN_CMCHIS_Medical: {
    schemeId: "TN_CMCHIS_Medical",
    schemeTitle: "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS - Tamil Nadu)",
    shortCode: "TN-CMCHIS-HEALTH",
    type: "healthcare",
    categoryLabel: "Tamil Nadu State Universal Health Assurance & Inpatient Care",
    sponsoringBody: "Health and Family Welfare Department, Government of Tamil Nadu & United India Insurance",
    benefitHeadline: "₹5,00,000 / Family / Year Cashless Treatment across 1,600+ hospitals",
    statutoryTimeLimit: "Instant Smart Card at District Collectorate; Pre-Auth within 2 Hours",
    officialFee: "₹0.00 (Statutorily Free)",
    portalName: "CMCHIS Portal",
    portalUrl: "https://www.cmchistn.com",
    offlineCounter: "CMCHIS Kiosk at District Collectorate / Govt District Headquarter Hospital",
    tier1BaseIdentity: [
      {
        name: "Tamil Nadu Smart Family Card (Ration Card)",
        requirement: "Must show family composition and local address in Tamil Nadu",
        mandatory: true,
      },
      {
        name: "Aadhaar Card of Patient & Family Members",
        requirement: "For biometric fingerprint / OTP authentication on CMCHIS portal",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Income_Certificate",
        name: "Income Certificate (< ₹1,20,000)",
        authority: "Tahsildar (via e-Sevai / Revenue Desk)",
        turnaround: "15 Days",
        statutoryCost: "₹60 (e-Sevai)",
        validity: "Current FY 2026-27",
        keyCondition: "Annual family income must be under ₹1,20,000 (waived for specific vulnerable groups)",
      },
    ],
    tier3Institutional: [
      {
        name: "Government Hospital Specialist Referral / Emergency Slip",
        authority: "Civil Surgeon / Government Medical Officer",
        action: "Clinical diagnosis and requisition for specialized treatment/surgery",
        category: "Healthcare",
      },
      {
        name: "Empaneled Hospital CMCHIS Pre-Authorization Approval",
        authority: "Third Party Administrator (TPA) / United India Insurance",
        action: "Digital cashless pre-auth sanctioned on CMCHIS portal before surgery",
        category: "Healthcare",
      },
    ],
    bankingRequirement: "100% cashless hospital settlement. No cash out of pocket for inpatient treatment.",
    stages: [
      {
        stageNumber: 1,
        stageName: "CMCHIS Biometric Smart Card Enrollment",
        actor: "Beneficiary & Kiosk Operator",
        timeline: "Instant (at Collectorate Kiosk)",
        description: "Carry Smart Ration card and Aadhaar to District Collectorate CMCHIS kiosk. Enroll biometrics and get laminated smart card.",
        actionItem: "Collect your URN (Unique Registration Number) smart card.",
        commonPitfall: "Name mismatch between Smart Ration card and Aadhaar.",
      },
      {
        stageNumber: 2,
        stageName: "Clinical Requisition & Hospital Pre-Auth",
        actor: "Specialist Doctor & Hospital CMCHIS Cell",
        timeline: "Within 2 Hours",
        description: "Hospital CMCHIS desk scans your card, matches diagnosis with 1,513 approved packages, and obtains insurance pre-auth.",
        actionItem: "Confirm cashless pre-authorization is approved before elective surgery.",
        commonPitfall: "Hospital asking for cash deposit for consumables. Strictly prohibited under CMCHIS guidelines.",
      },
      {
        stageNumber: 3,
        stageName: "100% Cashless Medical Treatment & Surgery",
        actor: "Empaneled Hospital",
        timeline: "Duration of Inpatient Care",
        description: "Patient undergoes surgery, ICU care, diagnostics, and nursing without paying a single rupee.",
        actionItem: "Sign biometric discharge voucher only upon complete treatment.",
        commonPitfall: "Paying out of pocket for post-op medicines. 15-day discharge medicines are free.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Is the hospital empaneled under CMCHIS for your specific specialty?",
        resolution: "Check empaneled list on cmchistn.com or call toll-free helpline 1800-425-3993.",
      },
    ],
  },

  // --- ANDHRA PRADESH FLAGSHIP SCHEMES ---
  AP_Jagananna_Vidya_Deevena: {
    schemeId: "AP_Jagananna_Vidya_Deevena",
    schemeTitle: "Jagananna Vidya Deevena (Full Fee Reimbursement - RTF)",
    shortCode: "AP-JVD-RTF",
    type: "scholarship",
    categoryLabel: "Andhra Pradesh Higher Education Full Tuition Reimbursement",
    sponsoringBody: "Higher Education & Social Welfare Department, Government of Andhra Pradesh",
    benefitHeadline: "100% Full Tuition Fee Reimbursement (Direct Credit to Mother's Bank Account)",
    statutoryTimeLimit: "Quarterly release following college biometric attendance sync",
    officialFee: "₹0.00 (Statutorily 100% Free under Navasakam Guidelines)",
    portalName: "Jnanabhumi / Navasakam Portal",
    portalUrl: "https://jnanabhumi.ap.gov.in",
    offlineCounter: "Grama / Ward Sachivalayam (Village / Ward Secretariat) & College Principal Desk",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Student & Mother",
        requirement: "Biometric e-KYC authentication on Jnanabhumi and Navasakam portal",
        mandatory: true,
      },
      {
        name: "AP Rice Card (White BPL Ration Card)",
        requirement: "Valid civil supplies household card with applicant and mother listed",
        mandatory: true,
      },
      {
        name: "Domestic Electricity Bill (< 300 units/month)",
        requirement: "Consumption under 3,600 units/year verified via AP Discom consumer number",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "AP_Integrated_Community_Cert",
        name: "Integrated Community, Nativity & DOB Certificate (REV-01)",
        authority: "Tahsildar / Mandal Revenue Officer (MRO)",
        turnaround: "15 Days",
        statutoryCost: "₹45",
        validity: "Permanent / Lifetime",
        keyCondition: "Issued through AP MeeSeva / Ward Sachivalayam for SC, ST, BC, EBC, Kapu, Minority",
      },
      {
        certificateId: "Income_Certificate",
        name: "AP MeeSeva Income Certificate (REV-02)",
        authority: "Mandal Revenue Officer (MRO)",
        turnaround: "15 Days",
        statutoryCost: "₹45",
        validity: "Current FY 2026-27",
        keyCondition: "Annual household earnings must be under ₹2,50,000",
      },
    ],
    tier3Institutional: [
      {
        name: "College Biometric Attendance Record (≥ 75%)",
        authority: "College Principal / Jnanabhumi Nodal Officer",
        action: "Student biometric attendance must exceed 75% for each academic quarter",
        category: "Academic",
      },
      {
        name: "Convenor Quota Allotment Order",
        authority: "AP State Council of Higher Education (APSCHE)",
        action: "Admission must be through state merit counseling (EAPCET / ICET / ECET / PGCET)",
        category: "Academic",
      },
      {
        name: "Mother's Aadhaar-Seeded Bank Account (NPCI DBT Mapper)",
        authority: "Nationalized Bank / Andhra Pragathi Grameena Bank",
        action: "Quarterly tuition fee disbursed directly into mother's account for onward payment to college",
        category: "Banking",
      },
    ],
    bankingRequirement: "Savings account strictly in mother's name seeded with Aadhaar on NPCI DBT Mapper. Payments credited quarterly directly by AP Treasury.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Ward / Grama Sachivalayam Volunteer & WEA Verification",
        actor: "Welfare & Education Assistant (WEA)",
        timeline: "Admission Month",
        description: "Village/Ward Secretariat team verifies household BPL status, electricity meter units, and agricultural land in Spandana database.",
        actionItem: "Ensure mother and student names are mapped in the secretariat household family cluster.",
        commonPitfall: "Electricity consumption over 300 units/month or family member owning four-wheeler (disqualifies applicant).",
      },
      {
        stageNumber: 2,
        stageName: "Jnanabhumi College Online Registration & e-KYC",
        actor: "College Nodal Officer & Student",
        timeline: "Within 15 Days of Admission",
        description: "College enters student admission hall ticket number on jnanabhumi.ap.gov.in. Student and mother complete biometric authentication.",
        actionItem: "Complete fingerprint/iris e-KYC authentication at the college scholarship counter.",
        commonPitfall: "Mismatch between college admission register name and Aadhaar spelling.",
      },
      {
        stageNumber: 3,
        stageName: "Quarterly Biometric Attendance Synchronization",
        actor: "College Principal & Biometric Device",
        timeline: "Continuous (Monthly)",
        description: "Daily Aadhaar-based biometric attendance data syncs automatically with the state higher education server.",
        actionItem: "Maintain regular daily attendance above the mandatory 75% quarterly threshold.",
        commonPitfall: "Attendance dropping below 75% freezes RTF fee reimbursement for that quarter.",
      },
      {
        stageNumber: 4,
        stageName: "District Social Welfare Officer (DSWO) Sanction",
        actor: "DSWO & State Welfare Directorate",
        timeline: "End of Quarter",
        description: "Welfare department cross-checks Jnanabhumi batch lists and releases the state sanction order.",
        actionItem: "Track sanction approval on the Navasakam citizen search module.",
        commonPitfall: "Pending social audit objection at Grama Sachivalayam.",
      },
      {
        stageNumber: 5,
        stageName: "Direct Benefit Transfer (DBT) to Mother's Account",
        actor: "AP CFMS Treasury",
        timeline: "Quarterly Disbursement Day",
        description: "100% tuition reimbursement is credited into the mother's Aadhaar-linked bank account. Mother pays fees to college within 7 days.",
        actionItem: "Obtain bank transfer SMS and remit fee acknowledgment receipt to college registrar.",
        commonPitfall: "Mother's bank account unseeded with NPCI causing payment failure or bounce.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Does your domestic electricity consumption exceed 300 units/month (3,600 units/year)?",
        resolution: "Request an inspection by the Discom Assistant Engineer via Grama Sachivalayam to certify single-meter household.",
      },
      {
        check: "Is the student's admission under Management / NRI / Spot quota?",
        resolution: "Jagananna Vidya Deevena is strictly statutory for Convenor Merit quota admissions through APSCHE counseling.",
      },
      {
        check: "Is mother's bank account seeded with Aadhaar on the NPCI DBT mapper?",
        resolution: "Submit an Aadhaar NPCI Mandate Form at your bank branch and verify active status on the UIDAI portal.",
      },
    ],
  },

  AP_Jagananna_Vasathi_Deevena: {
    schemeId: "AP_Jagananna_Vasathi_Deevena",
    schemeTitle: "Jagananna Vasathi Deevena (Food & Hostel Maintenance Allowance - MTF)",
    shortCode: "AP-JVD-MTF",
    type: "scholarship",
    categoryLabel: "Andhra Pradesh Food & Hostel Maintenance Support",
    sponsoringBody: "Social Welfare Department, Government of Andhra Pradesh",
    benefitHeadline: "₹20,000 / Year for Degree/Engineering; ₹15,000 for Polytechnic; ₹10,000 for ITI",
    statutoryTimeLimit: "Bi-annual installments (July and December releases)",
    officialFee: "₹0.00 (Statutorily 100% Free)",
    portalName: "Jnanabhumi / Navasakam Portal",
    portalUrl: "https://jnanabhumi.ap.gov.in",
    offlineCounter: "Grama / Ward Sachivalayam & College Principal Office",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Student & Mother",
        requirement: "Biometric e-KYC linked on Jnanabhumi",
        mandatory: true,
      },
      {
        name: "AP White Rice Card / BPL Household ID",
        requirement: "Confirmed BPL status with annual family income below ₹2.5 Lakhs",
        mandatory: true,
      },
      {
        name: "College Bonafide Student & Hostel Certificate",
        requirement: "Certifying regular full-time enrollment as day scholar or hosteller",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "AP_Integrated_Community_Cert",
        name: "Integrated Community, Nativity & DOB Certificate",
        authority: "Tahsildar / Mandal Revenue Officer (MRO)",
        turnaround: "15 Days",
        statutoryCost: "₹45",
        validity: "Permanent",
        keyCondition: "Valid category determination for SC, ST, BC, EBC, Minority, Kapu",
      },
      {
        certificateId: "Income_Certificate",
        name: "Income Certificate (Current FY)",
        authority: "Tahsildar / MRO",
        turnaround: "15 Days",
        statutoryCost: "₹45",
        validity: "Current FY",
        keyCondition: "Family income under ₹2.5 Lakhs per annum",
      },
    ],
    tier3Institutional: [
      {
        name: "College Biometric Attendance Verification (≥ 75%)",
        authority: "College Principal",
        action: "Attendance tracked electronically on Jnanabhumi biometric portal",
        category: "Academic",
      },
      {
        name: "Mother's Solo Savings Account (NPCI DBT Seeded)",
        authority: "Nationalized Bank",
        action: "Direct Treasury payment transfer in two equal semi-annual installments",
        category: "Banking",
      },
    ],
    bankingRequirement: "Credited directly into mother's Aadhaar-seeded bank account in two equal installments (₹10,000 + ₹10,000 for Engineering/Degree students).",
    stages: [
      {
        stageNumber: 1,
        stageName: "Hostel & Enrollment Certification",
        actor: "College Principal & Warden",
        timeline: "Semester Reopening",
        description: "College verifies regular attendance and uploads student status on the Jnanabhumi portal.",
        actionItem: "Ensure your name is endorsed in the college Jnanabhumi batch.",
        commonPitfall: "Late submission of hostel admission slip to college desk.",
      },
      {
        stageNumber: 2,
        stageName: "Ward / Grama Sachivalayam Social Audit",
        actor: "Welfare & Education Assistant",
        timeline: "Bi-annual audit",
        description: "Grama Sachivalayam displays provisional beneficiary lists for public social audit.",
        actionItem: "Check beneficiary list on Sachivalayam notice board or Spandana portal.",
        commonPitfall: "Missing name due to inactive rice card or unlinked Aadhaar.",
      },
      {
        stageNumber: 3,
        stageName: "Biometric e-KYC by Student & Mother",
        actor: "Student, Mother & College/Sachivalayam",
        timeline: "Within 10 Days of list release",
        description: "Both mother and student complete Aadhaar biometric verification.",
        actionItem: "Authenticate fingerprint or facial recognition on the Jnanabhumi app.",
        commonPitfall: "Mother's biometric failure due to worn fingerprints (use iris or facial OTP).",
      },
      {
        stageNumber: 4,
        stageName: "District Welfare Sanction & Treasury Clearance",
        actor: "District Social Welfare Officer",
        timeline: "Within 15 Days",
        description: "DSWO approves sanction list and transmits payment file to CFMS treasury.",
        actionItem: "Verify payment bill token generation on CFMS citizen portal.",
        commonPitfall: "Bank account in dormant status rejecting credit.",
      },
      {
        stageNumber: 5,
        stageName: "DBT Disbursement Release",
        actor: "AP Finance Department",
        timeline: "Installment Date",
        description: "Funds credited directly to mother's savings account for student living expenses.",
        actionItem: "Verify bank balance via SMS or passbook update.",
        commonPitfall: "Bank deducting balance against old unpaid loan debts.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Has student maintained minimum 75% biometric attendance?",
        resolution: "Check attendance log with college nodal officer before each semester audit.",
      },
      {
        check: "Is mother's bank account linked to Aadhaar on the NPCI mapper?",
        resolution: "Visit your bank branch and submit the Aadhaar NPCI seeding form.",
      },
    ],
  },

  AP_YSR_Aarogyasri: {
    schemeId: "AP_YSR_Aarogyasri",
    schemeTitle: "Dr. YSR Aarogyasri Comprehensive Health Assurance Scheme",
    shortCode: "AP-YSR-AAROGYASRI",
    type: "healthcare",
    categoryLabel: "Andhra Pradesh Flagship Universal Cashless Health Cover",
    sponsoringBody: "Dr. YSR Aarogyasri Health Care Trust, Government of Andhra Pradesh",
    benefitHeadline: "Up to ₹25,00,000 / Family / Year Cashless Treatment across 3,255 Inpatient Procedures",
    statutoryTimeLimit: "Instant e-Card Search; Pre-Authorization within 2 Hours",
    officialFee: "₹0.00 (100% Statutorily Free across all Empaneled Hospitals)",
    portalName: "Dr. YSR Aarogyasri Portal",
    portalUrl: "https://aarogyasri.ap.gov.in",
    offlineCounter: "Aarogya Mithra Helpdesk at Empaneled Government / Private Hospital & Grama Sachivalayam",
    tier1BaseIdentity: [
      {
        name: "Dr. YSR Aarogyasri Card or AP Rice Card",
        requirement: "Card number starting with WAP/RAP or QR code validated at Aarogya Mithra kiosk",
        mandatory: true,
      },
      {
        name: "Aadhaar Card of Patient & Family Head",
        requirement: "Biometric e-KYC or OTP verification at hospital reception",
        mandatory: true,
      },
      {
        name: "Active Mobile Number",
        requirement: "For OTP verification, pre-authorization notifications, and Aarogya Aasara alerts",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Income_Certificate",
        name: "Income Eligibility Proof (Rice Card / MeeSeva Certificate)",
        authority: "Civil Supplies / Revenue Department (MRO)",
        turnaround: "Instant (Rice Card) or 15 Days (MeeSeva)",
        statutoryCost: "₹0 (Rice Card) / ₹45 (MeeSeva)",
        validity: "Active / Current FY",
        keyCondition: "Household income under ₹5,00,000/year (or holding valid AP Rice Card)",
      },
      {
        certificateId: "Resident_Proof",
        name: "AP Residence Proof / Grama Sachivalayam Family Card",
        authority: "Tahsildar / Village Secretariat",
        turnaround: "15 Days",
        statutoryCost: "₹45",
        validity: "Permanent",
        keyCondition: "Confirms AP residency for specialized surgeries and super-specialty referrals",
      },
    ],
    tier3Institutional: [
      {
        name: "Specialist Doctor Diagnosis & Clinical Requisition",
        authority: "Empaneled Hospital Consultant / Civil Surgeon",
        action: "Clinical diagnosis mapped to one of 3,255 empaneled treatment packages",
        category: "Healthcare",
      },
      {
        name: "Aarogya Mithra Online Pre-Authorization Request",
        authority: "Hospital Aarogya Mithra Kiosk",
        action: "Digital pre-auth raised on Trust Transaction Management System (TMS)",
        category: "Healthcare",
      },
      {
        name: "Aarogya Aasara Bank Passbook (Post-Operative Allowance)",
        authority: "Nationalized Bank",
        action: "Direct Benefit Transfer of ₹225/day post-operative recuperative subsistence allowance",
        category: "Banking",
      },
    ],
    bankingRequirement: "100% cashless direct hospital settlement by Trust. Zero out-of-pocket payment by patient. Post-op recuperation cash (₹225/day up to ₹5,000) credited directly to patient's bank account via Aarogya Aasara.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Aarogya Mithra Kiosk Verification",
        actor: "Patient & Aarogya Mithra",
        timeline: "Immediate upon arrival (15 mins)",
        description: "Patient approaches the Aarogya Mithra desk at any network hospital with their Rice Card or Aarogyasri card.",
        actionItem: "Complete biometric search on the Trust portal and receive outpatient token.",
        commonPitfall: "Approaching a non-empaneled hospital or private clinic where cashless benefit is invalid.",
      },
      {
        stageNumber: 2,
        stageName: "Clinical Workup & Package Selection",
        actor: "Empaneled Specialist Doctor",
        timeline: "Day 1",
        description: "Doctor conducts examinations, reviews diagnostic scans (CT/MRI/Echo), and selects the approved surgical/medical package.",
        actionItem: "Provide diagnostic test reports to Aarogya Mithra for uploading.",
        commonPitfall: "Missing lab or radiology evidence required by Trust medical auditors.",
      },
      {
        stageNumber: 3,
        stageName: "Electronic Pre-Authorization Approval",
        actor: "Trust Medical Auditor (Online)",
        timeline: "Within 2 Hours (Instant for Emergencies)",
        description: "Trust medical auditor reviews clinical images and issues digital pre-authorization sanction letter.",
        actionItem: "Confirm pre-authorization status with Aarogya Mithra before elective surgery.",
        commonPitfall: "Hospital asking for cash deposit for consumables (strictly illegal under Trust rules).",
      },
      {
        stageNumber: 4,
        stageName: "100% Cashless Surgery & Inpatient Care",
        actor: "Empaneled Hospital Care Team",
        timeline: "Duration of Hospitalization",
        description: "Patient receives surgery, ICU nursing, medicines, and food completely free of cost.",
        actionItem: "Ensure discharge summary and 15-day free follow-up medicines are provided.",
        commonPitfall: "Paying out of pocket for pharmacy items inside the network hospital.",
      },
      {
        stageNumber: 5,
        stageName: "Discharge & YSR Aarogya Aasara Payment",
        actor: "Aarogya Mithra & AP CFMS",
        timeline: "Discharge Day to 48 Hours",
        description: "Aarogya Mithra records biometric discharge. Post-operative allowance of ₹225/day is triggered to patient's bank account.",
        actionItem: "Sign electronic discharge voucher and verify Aarogya Aasara bank details.",
        commonPitfall: "Providing invalid IFSC or unlinked bank account delaying post-op relief cash.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Is the hospital empaneled under Dr. YSR Aarogyasri for your specific specialty?",
        resolution: "Check empaneled hospital directory on aarogyasri.ap.gov.in or call 104 toll-free helpline.",
      },
      {
        check: "Does hospital staff demand cash deposits or payments for medicines/implants?",
        resolution: "Immediately call the 104 Aarogyasri Anti-Grievance Helpline or lodge a complaint with the District Coordinator.",
      },
    ],
  },

  AP_Amma_Vodi: {
    schemeId: "AP_Amma_Vodi",
    schemeTitle: "Jagananna Amma Vodi / Thalliki Vandanam (School Education DBT)",
    shortCode: "AP-AMMA-VODI",
    type: "scholarship",
    categoryLabel: "Andhra Pradesh School Education Financial Support for Mothers",
    sponsoringBody: "School Education Department, Government of Andhra Pradesh",
    benefitHeadline: "₹15,000 / Year Direct Benefit Transfer to Mother's Bank Account",
    statutoryTimeLimit: "Annual single disbursement in June/July for academic school reopening",
    officialFee: "₹0.00 (Statutorily 100% Free)",
    portalName: "Jagananna Amma Vodi Official Portal",
    portalUrl: "https://jaganannaammavodi.ap.gov.in",
    offlineCounter: "Grama / Ward Sachivalayam & School Headmaster Desk",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Child & Mother",
        requirement: "Biometric e-KYC linked on Child Info School Education portal",
        mandatory: true,
      },
      {
        name: "AP White Rice Card / BPL Household ID",
        requirement: "Family income under ₹2.5 Lakhs and domestic power consumption under 300 units/mo",
        mandatory: true,
      },
      {
        name: "School Enrollment Record (Class 1 to 12)",
        requirement: "Enrolled in recognized Government, Aided, or Private school in Andhra Pradesh",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Income_Certificate",
        name: "BPL Status / Income Verification",
        authority: "Grama Sachivalayam / Mandal Revenue Officer",
        turnaround: "15 Days",
        statutoryCost: "₹0 (Rice Card) / ₹45",
        validity: "Current FY",
        keyCondition: "Household verified through Navasakam volunteer database",
      },
    ],
    tier3Institutional: [
      {
        name: "Student School Biometric Attendance (≥ 75%)",
        authority: "School Headmaster / Child Info Portal",
        action: "Minimum 75% student attendance during the previous academic year",
        category: "Academic",
      },
      {
        name: "Mother's Aadhaar-Seeded Solo Bank Account",
        authority: "Nationalized Bank",
        action: "Direct Benefit Transfer of ₹15,000 credited directly into mother's account",
        category: "Banking",
      },
    ],
    bankingRequirement: "Savings account strictly in mother's name seeded with Aadhaar on the NPCI DBT mapper.",
    stages: [
      {
        stageNumber: 1,
        stageName: "School Child Info Data Synchronization",
        actor: "School Headmaster",
        timeline: "April - May",
        description: "Headmaster verifies student attendance, mother's Aadhaar, and bank account on the state Child Info database.",
        actionItem: "Verify student and mother details on the school draft verification roll.",
        commonPitfall: "Spelling mismatch between school admission record and Aadhaar.",
      },
      {
        stageNumber: 2,
        stageName: "Grama / Ward Sachivalayam Social Audit Display",
        actor: "Welfare & Education Assistant",
        timeline: "June",
        description: "Provisional eligible and ineligible lists published at Village and Ward Secretariats for public social audit.",
        actionItem: "Verify name on the secretariat social audit board; submit objections within 7 days.",
        commonPitfall: "Ignoring the 7-day grievance redressal window if marked ineligible.",
      },
      {
        stageNumber: 3,
        stageName: "Biometric e-KYC by Mother",
        actor: "Mother & Sachivalayam Volunteer",
        timeline: "June",
        description: "Mother completes doorstep biometric verification via the volunteer mobile application.",
        actionItem: "Authenticate biometric thumb impression or facial scan.",
        commonPitfall: "Mother unavailable at residential address during verification cycle.",
      },
      {
        stageNumber: 4,
        stageName: "District Collectorate Sanction",
        actor: "District Collector & DEO",
        timeline: "June End",
        description: "District administration signs off on the final welfare release order.",
        actionItem: "Track final beneficiary status online at jaganannaammavodi.ap.gov.in.",
        commonPitfall: "Electricity consumption exceeding 300 units/mo in previous 6 months.",
      },
      {
        stageNumber: 5,
        stageName: "Direct Benefit Transfer Release",
        actor: "AP CFMS Treasury",
        timeline: "July Academic Launch",
        description: "₹15,000 credited directly into mother's bank account (₹1,000 deducted for School Sanitation Fund).",
        actionItem: "Check SMS credit notification and update bank passbook.",
        commonPitfall: "Bank account in frozen or dormant status rejecting DBT transfer.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Did the student maintain minimum 75% attendance throughout the school year?",
        resolution: "Headmaster must verify clinical medical leave if attendance fell between 60% and 75%.",
      },
      {
        check: "Is the mother's bank account seeded on the NPCI Aadhaar mapper?",
        resolution: "Submit Aadhaar seeding mandate at bank branch immediately to prevent payment bounce.",
      },
    ],
  },

  AP_Jnanabhumi_PostMatric: {
    schemeId: "AP_Jnanabhumi_PostMatric",
    schemeTitle: "Jnanabhumi Post-Matric Welfare Scholarship (SC, ST, BC, Kapu, Minorities & EBC)",
    shortCode: "AP-JNANABHUMI-PMS",
    type: "scholarship",
    categoryLabel: "Andhra Pradesh Statutory Post-Matric Education Support",
    sponsoringBody: "Social Welfare, Tribal Welfare & BC Welfare Departments, Government of Andhra Pradesh",
    benefitHeadline: "100% Tuition Waiver + Annual Academic Maintenance & Book Grants",
    statutoryTimeLimit: "30 Days SLA from college biometric authentication",
    officialFee: "₹0.00 (Statutorily 100% Free)",
    portalName: "Jnanabhumi Education Portal",
    portalUrl: "https://jnanabhumi.ap.gov.in",
    offlineCounter: "College Principal Office & District Social Welfare Officer (DSWO)",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Applicant & Parents",
        requirement: "Biometric e-KYC linked on Jnanabhumi",
        mandatory: true,
      },
      {
        name: "Class 10th / SSC Marks Memo",
        requirement: "For date of birth and legal name verification",
        mandatory: true,
      },
      {
        name: "AP White Rice Card / BPL Household ID",
        requirement: "Valid civil supplies household card with annual income under ₹2.5 Lakhs",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "AP_Integrated_Community_Cert",
        name: "Integrated Community, Nativity & Date of Birth Certificate (REV-01)",
        authority: "Tahsildar / Mandal Revenue Officer (MRO)",
        turnaround: "15 Days",
        statutoryCost: "₹45",
        validity: "Permanent",
        keyCondition: "Issued through AP MeeSeva / Ward Sachivalayam",
      },
      {
        certificateId: "Income_Certificate",
        name: "MeeSeva Income Certificate (REV-02)",
        authority: "Mandal Revenue Officer (MRO)",
        turnaround: "15 Days",
        statutoryCost: "₹45",
        validity: "Current FY",
        keyCondition: "Family income under ₹2,50,000 per annum",
      },
    ],
    tier3Institutional: [
      {
        name: "College Admission Bonafide & Fee Structure",
        authority: "College Principal / Registrar",
        action: "Institution certifies student course type, duration, and approved fee structure",
        category: "Academic",
      },
      {
        name: "Aadhaar NPCI DBT Seeded Bank Account",
        authority: "Nationalized Bank",
        action: "Direct Treasury credit for maintenance stipends",
        category: "Banking",
      },
    ],
    bankingRequirement: "Aadhaar-seeded savings account on NPCI mapper for Direct Benefit Transfer of monthly maintenance allowances.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Online Portal Application & Document Upload",
        actor: "Applicant & College Nodal Officer",
        timeline: "Within 30 Days of Admission",
        description: "Submit post-matric scholarship application on jnanabhumi.ap.gov.in with MeeSeva certificate numbers.",
        actionItem: "Save application submission acknowledgment number.",
        commonPitfall: "Uploading expired income certificate from prior financial year.",
      },
      {
        stageNumber: 2,
        stageName: "Biometric e-KYC at College",
        actor: "Student & College Verifier",
        timeline: "Within 7 Days",
        description: "Complete fingerprint or iris biometric authentication at the college scholarship desk.",
        actionItem: "Ensure biometric scan status shows 'VERIFIED' on student portal dashboard.",
        commonPitfall: "Failure to complete biometric authentication before institute closing date.",
      },
      {
        stageNumber: 3,
        stageName: "College Principal Digital Endorsement",
        actor: "College Principal",
        timeline: "Within 7 Days",
        description: "Principal verifies student admission against university quota and digitally signs batch file.",
        actionItem: "Follow up with college scholarship clerk to confirm batch submission.",
        commonPitfall: "Application remaining in 'PENDING AT INO' status past deadline.",
      },
      {
        stageNumber: 4,
        stageName: "District Social Welfare Officer (DSWO) Verification",
        actor: "DSWO (District Collectorate)",
        timeline: "Within 15 Days",
        description: "DSWO scrutinizes category certificates and issues sanction order for tuition and maintenance.",
        actionItem: "Monitor portal tracking weekly; answer any clarification queries promptly.",
        commonPitfall: "Failing to rectify defective notices within 72 hours.",
      },
      {
        stageNumber: 5,
        stageName: "Direct Treasury Disbursement",
        actor: "AP CFMS Treasury",
        timeline: "Disbursement Window",
        description: "Tuition fees disbursed to institute account; maintenance allowance credited to student's bank account.",
        actionItem: "Verify credit via bank SMS or PFMS portal tracking.",
        commonPitfall: "Unseeded bank account causing DBT bounce.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Are you availing any other government scholarship simultaneously?",
        resolution: "Government rules strictly prohibit availing dual scholarships for the same academic degree.",
      },
      {
        check: "Is your MeeSeva Integrated Caste Certificate barcoded and digitally signed by the MRO?",
        resolution: "Verify certificate authenticity on onlineap.meeseva.gov.in using the transaction ID.",
      },
    ],
  },

  AP_Integrated_Community_Cert: {
    schemeId: "AP_Integrated_Community_Cert",
    schemeTitle: "Integrated Community, Nativity & Date of Birth Certificate (MeeSeva / Sachivalayam REV-01)",
    shortCode: "AP-MEESEVA-REV01",
    type: "certificate",
    categoryLabel: "Andhra Pradesh Statutory Revenue Service",
    sponsoringBody: "Revenue Department, Government of Andhra Pradesh",
    benefitHeadline: "Official Statutory Certificate Required for Jnanabhumi, Vidya Deevena & State Counseling",
    statutoryTimeLimit: "15 Statutory SLA Days (AP Right to Public Services Act)",
    officialFee: "₹45.00 (Statutory MeeSeva User Charge; ₹0 at Village/Ward Secretariat)",
    portalName: "AP MeeSeva / Grama Sachivalayam Portal",
    portalUrl: "https://onlineap.meeseva.gov.in",
    offlineCounter: "Grama / Ward Sachivalayam & MeeSeva Citizen Service Centers",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Applicant & Father",
        requirement: "Biometric authentication on AP MeeSeva portal",
        mandatory: true,
      },
      {
        name: "Class 10th / SSC Marks Memo or Transfer Certificate",
        requirement: "Official verification of date of birth and school study details",
        mandatory: true,
      },
      {
        name: "Paternal Blood Relative Caste Certificate",
        requirement: "MeeSeva barcoded caste certificate of father, paternal uncle, or siblings",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "Resident_Proof",
        name: "Nativity / Residence Proof",
        authority: "Village Revenue Officer (VRO) / Tahsildar",
        turnaround: "7 Days",
        statutoryCost: "₹45",
        validity: "Permanent",
        keyCondition: "Continuous residence in Andhra Pradesh",
      },
    ],
    tier3Institutional: [
      {
        name: "Village Revenue Officer (VRO) Field Inquiry Report",
        authority: "Grama / Ward Sachivalayam VRO",
        action: "Physical verification of caste community and family genealogy in village records",
        category: "Civic",
      },
      {
        name: "Revenue Inspector (RI) Verification Endorsement",
        authority: "Mandal Revenue Office",
        action: "Scrutiny of VRO report and family genealogies in land/revenue registers",
        category: "Civic",
      },
    ],
    bankingRequirement: "Statutory revenue certificate service. No bank account required. Statutory user charge is ₹45 at MeeSeva centers or ₹0 at Sachivalayam.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Application Submission & Biometric e-KYC",
        actor: "Applicant & MeeSeva Operator / Sachivalayam WEA",
        timeline: "Day 1",
        description: "Submit application on onlineap.meeseva.gov.in with SSC memo and father's caste certificate. Pay ₹45 statutory fee.",
        actionItem: "Obtain AP MeeSeva transaction tracking number (REV-01-XXXX).",
        commonPitfall: "Paying more than the statutory ₹45 fee. Demand official computerized receipt.",
      },
      {
        stageNumber: 2,
        stageName: "VRO Field Inquiry & Panchanama",
        actor: "Village Revenue Officer (Grama Sachivalayam)",
        timeline: "Days 2 to 5",
        description: "VRO conducts local inquiry, checks village community records, and uploads recommendation report.",
        actionItem: "Provide father's school TC or old revenue record during VRO verification.",
        commonPitfall: "Absence of paternal blood relative caste documentation.",
      },
      {
        stageNumber: 3,
        stageName: "Revenue Inspector (RI) Scrutiny",
        actor: "Revenue Inspector (Mandal Office)",
        timeline: "Days 6 to 10",
        description: "RI cross-verifies VRO report against Mandal revenue registers and forwards to Tahsildar.",
        actionItem: "Track file status using MeeSeva tracking link on Spandana.",
        commonPitfall: "File pending in RI queue; call 1902 if delayed beyond 10 days.",
      },
      {
        stageNumber: 4,
        stageName: "Tahsildar / MRO Digital Signature",
        actor: "Tahsildar / Mandal Revenue Officer",
        timeline: "Days 11 to 15",
        description: "Tahsildar reviews inquiry findings and digitally signs the barcoded certificate.",
        actionItem: "Receive SMS alert with approval and download link.",
        commonPitfall: "Discrepancy in community sub-caste spelling.",
      },
      {
        stageNumber: 5,
        stageName: "Certificate Download & Jnanabhumi Upload",
        actor: "Applicant",
        timeline: "Within 15 Days",
        description: "Download the digitally signed barcoded certificate from onlineap.meeseva.gov.in or collect printout from MeeSeva.",
        actionItem: "Upload certificate to Jnanabhumi and counseling portals.",
        commonPitfall: "Submitting unverified manual certificates without digital barcode.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Do you have caste documentation of a paternal blood relative (father, paternal uncle)?",
        resolution: "Maternal caste records cannot be used under statutory Andhra Pradesh revenue law.",
      },
      {
        check: "Has the application exceeded the 15-day statutory SLA under the AP Right to Public Services Act?",
        resolution: "File an escalation immediately on the AP Spandana Portal (spandana.ap.gov.in) or call toll-free 1902.",
      },
    ],
  },

  AP_YSR_Cheyutha: {
    schemeId: "AP_YSR_Cheyutha",
    schemeTitle: "YSR Cheyutha Scheme (Direct Financial Support for Women Aged 45–60)",
    shortCode: "AP-YSR-CHEYUTHA",
    type: "scholarship",
    categoryLabel: "Andhra Pradesh Women Livelihood & Economic Empowerment",
    sponsoringBody: "Society for Elimination of Rural Poverty (SERP), Government of Andhra Pradesh",
    benefitHeadline: "₹18,750 / Year for 4 Consecutive Years (Total ₹75,000 Direct Cash Transfer)",
    statutoryTimeLimit: "30 Days from Social Audit Publication",
    officialFee: "₹0.00 (Statutorily 100% Free Doorstep Service)",
    portalName: "AP Navasakam Beneficiary Management",
    portalUrl: "https://navasakam.ap.gov.in",
    offlineCounter: "Grama / Ward Sachivalayam",
    tier1BaseIdentity: [
      {
        name: "Aadhaar Card of Female Beneficiary",
        requirement: "Date of birth proving age between 45 and 60 years",
        mandatory: true,
      },
      {
        name: "AP White Rice Card / BPL Household ID",
        requirement: "Total family income under ₹2.5 Lakhs and electricity consumption under 300 units/mo",
        mandatory: true,
      },
      {
        name: "Active Mobile Number",
        requirement: "Linked to Aadhaar for OTP authentication and payment alerts",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: [
      {
        certificateId: "AP_Integrated_Community_Cert",
        name: "Integrated Community Certificate (SC, ST, BC, Minority)",
        authority: "Tahsildar / Mandal Revenue Officer (MRO)",
        turnaround: "15 Days",
        statutoryCost: "₹45",
        validity: "Permanent",
        keyCondition: "Beneficiary must belong to SC, ST, BC, or Minority communities",
      },
    ],
    tier3Institutional: [
      {
        name: "Grama Sachivalayam WEA Field Verification",
        authority: "Welfare & Education Assistant (WEA)",
        action: "Door-to-door physical assessment of age, community, and economic standing",
        category: "Civic",
      },
      {
        name: "Solo Savings Account in Beneficiary's Name (NPCI Seeded)",
        authority: "Nationalized Bank / Andhra Pragathi Grameena Bank",
        action: "Direct Treasury payment transfer of ₹18,750 annually",
        category: "Banking",
      },
    ],
    bankingRequirement: "Solo savings bank account in beneficiary woman's name seeded with Aadhaar on NPCI DBT Mapper.",
    stages: [
      {
        stageNumber: 1,
        stageName: "Door-to-Door Volunteer Navasakam Survey",
        actor: "Ward / Village Volunteer",
        timeline: "Annual Survey Window",
        description: "Volunteer visits beneficiary household, verifies age (45-60) via Aadhaar and Rice Card, and captures mobile survey.",
        actionItem: "Show Aadhaar card and Rice card to your assigned secretariat volunteer.",
        commonPitfall: "Age falling below 45 or exceeding 60 years on Aadhaar records.",
      },
      {
        stageNumber: 2,
        stageName: "Grama / Ward Sachivalayam Social Audit",
        actor: "Welfare & Education Assistant",
        timeline: "Within 10 Days",
        description: "Provisional list published at the secretariat for social audit review and grievance collection.",
        actionItem: "Check your name on the secretariat social audit notice board.",
        commonPitfall: "Missing grievance submission deadline if marked rejected.",
      },
      {
        stageNumber: 3,
        stageName: "Biometric e-KYC Verification",
        actor: "Beneficiary & Volunteer",
        timeline: "Within 7 Days",
        description: "Beneficiary completes biometric fingerprint or iris e-KYC verification on the volunteer mobile app.",
        actionItem: "Ensure e-KYC status confirms successful authentication.",
        commonPitfall: "Biometric failure for senior women (use facial recognition mode).",
      },
      {
        stageNumber: 4,
        stageName: "District Collectorate Sanction",
        actor: "Project Director (DRDA) & District Collector",
        timeline: "Within 15 Days",
        description: "District administration scrutinizes final eligible lists and sanctions fund release.",
        actionItem: "Track sanction token on the Navasakam citizen search portal.",
        commonPitfall: "Family member in government service or paying income tax.",
      },
      {
        stageNumber: 5,
        stageName: "Direct Benefit Transfer Release",
        actor: "AP CFMS Treasury",
        timeline: "Disbursement Day",
        description: "₹18,750 credited directly to beneficiary's Aadhaar-linked savings account.",
        actionItem: "Confirm credit via bank SMS notification.",
        commonPitfall: "Bank account in dormant or frozen state rejecting transaction.",
      },
    ],
    rejectionChecklist: [
      {
        check: "Is the beneficiary's age on Aadhaar strictly between 45 and 60 years?",
        resolution: "Age calculation is strictly statutory based on UIDAI records on the cut-off date.",
      },
      {
        check: "Is the bank account in the woman's solo name and seeded with NPCI?",
        resolution: "Joint accounts or unseeded accounts cause instant payment failure on the state treasury gateway.",
      },
    ],
  },
};

// 2. HELPER: Get Dedicated Roadmap for Any Scheme
export function getSchemeRoadmap(schemeOrId: string | SchemeOrService): SchemeRoadmap {
  const inputId = typeof schemeOrId === "string" ? schemeOrId : schemeOrId.id;
  const scheme = SCHEMES_DATABASE.find(
    (s) =>
      s.id === inputId ||
      s.shortCode === inputId ||
      s.id.toLowerCase() === inputId.toLowerCase() ||
      s.shortCode.toLowerCase() === inputId.toLowerCase()
  );
  const schemeId = scheme ? scheme.id : inputId;

  // If already explicitly configured in SCHEME_ROADMAPS
  const existing = SCHEME_ROADMAPS[schemeId] || SCHEME_ROADMAPS[inputId];
  if (existing) {
    // Derive mode if not explicitly set
    const processMode: SchemeProcessMode = existing.processMode || (
      existing.type === "loan" || existing.schemeId.includes("Vidyalaxmi") || existing.schemeId.includes("Pragati") || existing.schemeId.includes("Ishaan")
        ? "TOTALLY_ONLINE"
        : existing.schemeId.includes("FRA") || existing.schemeId.includes("Jungle") || existing.schemeId.includes("RoFR")
        ? "TOTALLY_OFFLINE"
        : "HYBRID"
    );

    const processModeLabel = existing.processModeLabel || (
      processMode === "TOTALLY_ONLINE"
        ? "🌐 100% Fully Online Digital Portal (Zero Physical Visits)"
        : processMode === "TOTALLY_OFFLINE"
        ? "🏛️ 100% In-Person Physical Process Only (Zero Online Portals)"
        : "⚡ Hybrid Workflow: Online Submission + Local Field Verification Desks"
    );

    const processModeDescription = existing.processModeDescription || (
      processMode === "TOTALLY_ONLINE"
        ? "All application steps, e-KYC, institutional authentication, and benefit release occur 100% electronically on official digital portals."
        : processMode === "TOTALLY_OFFLINE"
        ? "Statutorily governed by in-person Gram Sabha quorum resolutions, physical field boundary surveys, and Revenue Court verification. No online portal is legally authorized."
        : "Initial application is submitted via official portal or MeeSeva/CSC kiosk, followed by mandatory in-person verification at designated local desks."
    );

    // Ensure all stages have mode, portal links, and physical desk locations
    const enrichedStages: RoadmapStage[] = existing.stages.map((stage) => {
      let stageMode = stage.stageMode;
      let portalLink = stage.portalLink;
      let portalActionText = stage.portalActionText;
      let physicalDeskLocation = stage.physicalDeskLocation;

      if (!stageMode) {
        if (processMode === "TOTALLY_OFFLINE") {
          stageMode = "OFFLINE";
          physicalDeskLocation = physicalDeskLocation || stage.officeType || existing.offlineCounter;
        } else if (processMode === "TOTALLY_ONLINE") {
          stageMode = "ONLINE";
          portalLink = portalLink || existing.portalUrl;
          portalActionText = portalActionText || "Open Stage Portal Action";
        } else {
          // HYBRID
          const isOnlineStep = stage.stageNumber === 1 || stage.officeType?.toLowerCase().includes("online") || stage.officeType?.toLowerCase().includes("portal") || stage.actor?.toLowerCase().includes("pfms");
          stageMode = isOnlineStep ? "ONLINE" : "OFFLINE";
          if (isOnlineStep && existing.portalUrl) {
            portalLink = portalLink || existing.portalUrl;
            portalActionText = portalActionText || "Open Online Portal";
          }
          if (stageMode === "OFFLINE") {
            physicalDeskLocation = physicalDeskLocation || stage.officeType || existing.offlineCounter;
          }
        }
      }

      return {
        ...stage,
        stageMode,
        portalLink,
        portalActionText,
        physicalDeskLocation,
      };
    });

    return {
      ...existing,
      processMode,
      processModeLabel,
      processModeDescription,
      stages: enrichedStages,
    };
  }

  // Fallback builder for any other scheme in SCHEMES_DATABASE
  const title = scheme ? scheme.title : schemeId;
  const type = scheme ? scheme.type : "scholarship";
  const portalName = scheme ? scheme.portalName : "National Scholarship Portal";
  const portalUrl = scheme ? scheme.officialPortalUrl : "https://scholarships.gov.in";
  const offlineCounter = scheme?.offlineSubmission.centerName || "Common Service Center (CSC)";

  const isForestOrLandRights = schemeId.includes("FRA") || schemeId.includes("Jungle") || schemeId.includes("RoFR") || (scheme?.type as string) === "land_rights";
  const isEducationLoan = schemeId.includes("Loan") || schemeId.includes("Vidyalaxmi") || (scheme?.type as string) === "loan" || (scheme?.title || "").toLowerCase().includes("loan");
  const isDirectCash =
    schemeId.includes("Pudhumai") ||
    schemeId.includes("Tamil_Pudhalvan") ||
    schemeId.includes("Amma_Vodi") ||
    schemeId.includes("Pension") ||
    schemeId.includes("Cheyutha") ||
    schemeId.includes("Aasara") ||
    schemeId.includes("KMUT") ||
    schemeId.includes("Marriage") ||
    schemeId.includes("Vahana") ||
    schemeId.includes("Rythu") ||
    schemeId.includes("Kalaignar");

  let processMode: SchemeProcessMode = "HYBRID";
  let processModeLabel = "⚡ Hybrid Workflow: Online Submission + Local Field Verification Desks";
  let processModeDescription = "Initial application is submitted via official portal or MeeSeva/CSC kiosk, followed by mandatory in-person verification at designated local desks.";

  if (isForestOrLandRights) {
    processMode = "TOTALLY_OFFLINE";
    processModeLabel = "🏛️ 100% In-Person Physical Process Only (Zero Online Portals)";
    processModeDescription = "Statutorily governed by Section 6 of the Forest Rights Act 2006. Claims require physical Gram Sabha quorum resolutions, joint on-site boundary surveys, and verification by the SDLC and District Collector. No private online portal is legally authorized.";
  } else if (isEducationLoan) {
    processMode = "TOTALLY_ONLINE";
    processModeLabel = "🌐 100% Fully Online Digital Portal (Zero Bank Branch Visits)";
    processModeDescription = "End-to-end digital processing through official portal. Student registration, institutional fee validation, bank Loan Origination System (LOS) underwriting, and fund disbursement occur 100% electronically with zero branch visits.";
  } else if (!portalUrl && offlineCounter) {
    processMode = "TOTALLY_OFFLINE";
    processModeLabel = "🏛️ 100% In-Person Physical Process Only (Offline Desks)";
    processModeDescription = "This scheme is administered statutorily through physical counters with zero online submission.";
  }

  // Dynamic Stages Pipeline according to statutory category
  let dynamicStages: RoadmapStage[] = [];

  if (isForestOrLandRights) {
    // 4 STAGES: Jungle / Forest Rights Act
    dynamicStages = [
      {
        stageNumber: 1,
        stageName: "Gram Sabha FRC Physical Claim Filing & Resolution",
        actor: "Forest Rights Committee (FRC) / Village Gram Sabha",
        officeType: "Gram Panchayat Hall (FRC Desk)",
        timeline: "Day 1 – 15 (Scheduled Gram Sabha Meeting)",
        description: "Submit Form A claim proforma physically before the village Forest Rights Committee along with elder witness statements and traditional cultivation evidence.",
        actionItem: "Ensure claim is entered into the Gram Sabha FRC register and obtain counter-signature.",
        commonPitfall: "Trusting online brokers or paying unauthorized fees. Forest rights claims are 100% statutorily free.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Gram Panchayat Hall — FRC Secretary Desk",
      },
      {
        stageNumber: 2,
        stageName: "Joint Field Verification & GPS Boundary Demarcation",
        actor: "Joint Inspection Team (Forest Beat Officer, Mandal Surveyor, FRC)",
        officeType: "Forest Beat Office & Survey Field Camp",
        timeline: "Within 30 Days",
        description: "Forest Beat Officer, Mandal Revenue Surveyor, and FRC members physically walk the plot boundaries, record GPS coordinates, and prepare spot Panchanama.",
        actionItem: "Be physically present on the forest land parcel with neighboring cultivators to attest field boundaries.",
        commonPitfall: "Absence on inspection day leading to adverse remarks or disputed boundary entries.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Forest Beat Camp & Demarcated Land Parcel",
      },
      {
        stageNumber: 3,
        stageName: "Sub-Divisional Level Committee (SDLC) Scrutiny",
        actor: "Sub-Divisional Magistrate (SDM / RDO) & Forest Division Officer",
        officeType: "Revenue Divisional Officer (RDO) Court",
        timeline: "Within 15 Days",
        description: "SDLC convenes statutory hearing to scrutinize Gram Sabha resolutions, survey dockets, and examine any boundary objections.",
        actionItem: "Monitor RDO office notice board for SDLC resolution docket and attend hearing if called.",
        commonPitfall: "Failure to respond to SDLC query within the statutory 60-day objection period.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Revenue Divisional Officer (RDO / Sub-Collector) Office — SDLC Section Counter #2",
      },
      {
        stageNumber: 4,
        stageName: "District Level Committee (DLC) Final Approval & Joint Patta Distribution",
        actor: "District Collector / Magistrate (Chairperson DLC)",
        officeType: "District Collectorate Land Title Section",
        timeline: "Within 60 Days (Statutory FRA Guarantee)",
        description: "DLC issues final statutory sanction order; District Collector signs and stamps the registered Joint Land Title Deed (bearing names of both husband and wife).",
        actionItem: "Collect physical embossed RoFR Land Title Deed and Forest Land Revenue Passbook.",
        commonPitfall: "Omission of spouse's name on title deed. Under FRA Section 4(4), joint registration is legally mandatory.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "District Collectorate — RoFR Land Records Counter #4",
      },
    ];
  } else if (isEducationLoan) {
    // 3 STAGES: Central Education Loan
    dynamicStages = [
      {
        stageNumber: 1,
        stageName: "Unified Portal Registration & DigiLocker e-KYC",
        actor: "Student Applicant",
        officeType: "PM-Vidyalaxmi Digital Portal",
        timeline: "Instant (30 Mins)",
        description: `Register on ${portalName} (${portalUrl}) using Aadhaar OTP. Pull academic certificates and income certificate directly via DigiLocker.`,
        actionItem: "Fill Common Education Loan Application Form (CELAF) and attach digital fee structure.",
        commonPitfall: "Applying through third-party unverified loan aggregators. Use strictly the official government portal.",
        stageMode: "ONLINE",
        portalLink: portalUrl,
        portalActionText: "Open Central Loan Portal",
      },
      {
        stageNumber: 2,
        stageName: "Automated Bank LOS Evaluation & Digital Sanction",
        actor: "Scheduled Commercial Bank (Digital Underwriting Engine)",
        officeType: "Centralized Bank Loan Origination System (LOS)",
        timeline: "Within 7–15 Days",
        description: "Participating bank processes CELAF application electronically through automated API checks and grants collateral-free in-principle sanction.",
        actionItem: "Review sanction letter on portal dashboard and complete Aadhaar OTP e-Sign.",
        commonPitfall: "Submitting fee quote with unapproved capitation or private hostel charges.",
        stageMode: "ONLINE",
        portalLink: portalUrl,
        portalActionText: "Track Digital Bank Sanction",
      },
      {
        stageNumber: 3,
        stageName: "Direct Electronic Fee Disbursal & Central Subsidy Tagging",
        actor: "Disbursal Bank & Canara Bank Central Subsidy Nodal Desk",
        officeType: "Electronic Treasury & Core Banking RTGS",
        timeline: "Direct Electronic Disbursement to College",
        description: "Tuition fee is directly credited via RTGS to the institution's verified college bank account, and enrolled for full interest subsidy during moratorium.",
        actionItem: "Download digital fee disbursement confirmation voucher and submit copy to college accounts section.",
        commonPitfall: "Providing invalid institutional bank IFSC or college AISHE code on application form.",
        stageMode: "ONLINE",
        portalLink: portalUrl,
        portalActionText: "Download Fee Disbursal Voucher",
      },
    ];
  } else if (isDirectCash) {
    // 3 STAGES: State Direct Benefit Transfers
    dynamicStages = [
      {
        stageNumber: 1,
        stageName: "Aadhaar e-KYC & Beneficiary Enrollment",
        actor: "Beneficiary / Village Volunteer",
        officeType: "Grama / Ward Sachivalayam or School",
        timeline: "Day 1",
        description: `Online registration with biometric Aadhaar e-KYC and student/household verification on ${portalName}.`,
        actionItem: "Ensure mobile number is linked to Aadhaar for OTP verification.",
        commonPitfall: "Spelling variation between ration card and bank passbook.",
        stageMode: "HYBRID",
        portalLink: portalUrl,
        portalActionText: "Open Beneficiary Portal",
        physicalDeskLocation: "Grama / Ward Sachivalayam (Village Secretariat Desk #1)",
      },
      {
        stageNumber: 2,
        stageName: "Social Audit & Field Eligibility Scrutiny",
        actor: "Ward Secretary / CDPO / Field Officer",
        officeType: "Local Civic Directorate / Municipal Office",
        timeline: "Within 10 Days",
        description: "Field officer verifies government school attendance (6–12), land records, and electricity meter limits.",
        actionItem: "Review draft beneficiary social audit list displayed at local secretariat.",
        commonPitfall: "Failure to raise objection during social audit display window.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Village Secretariat Public Notice Board & Ward Secretary Desk",
      },
      {
        stageNumber: 3,
        stageName: "Direct Electronic Treasury Disbursal (e-Kuber DBT)",
        actor: "State Treasury Directorate",
        officeType: "State Electronic Treasury / RBI APBS",
        timeline: "Direct Monthly / Scheduled Credit",
        description: "Funds are released directly into the verified Aadhaar-seeded bank account.",
        actionItem: "Check bank SMS confirmation or verify account credit on portal.",
        commonPitfall: "Dormant bank account or unseeded NPCI mapper preventing credit.",
        stageMode: "ONLINE",
        portalLink: portalUrl,
        portalActionText: "Check Treasury Credit Status",
      },
    ];
  } else if (type === "certificate") {
    // 4 STAGES: Statutory Revenue Certificates
    dynamicStages = [
      {
        stageNumber: 1,
        stageName: "Citizen Online / MeeSeva Submission",
        actor: "Citizen / CSC Operator",
        officeType: "MeeSeva / Village CSC Desk",
        timeline: "Day 1",
        description: `Submit application on ${portalName} with self-declaration affidavit and ancestral proof.`,
        actionItem: "Obtain digital application transaction number (e.g., AP/TN Application ID).",
        commonPitfall: "Submitting without father's or ancestral revenue record.",
        stageMode: "HYBRID",
        portalLink: portalUrl,
        portalActionText: "Open Citizen Portal",
        physicalDeskLocation: offlineCounter || "MeeSeva / e-Sevai / CSC Kiosk",
      },
      {
        stageNumber: 2,
        stageName: "Village Field Inquiry & Local Spot Verification",
        actor: "Village Revenue Officer (VRO / VAO)",
        officeType: "Grama Sachivalayam / Village Revenue Secretariat",
        timeline: "Within 5–7 Days",
        description: "Field officer conducts local inquiry, verifies native residence and community records.",
        actionItem: "Be available during village spot verification or keep neighbor witnesses informed.",
        commonPitfall: "Applicant not available at registered permanent residential address.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Village Revenue Secretariat — VRO Inquiry Desk",
      },
      {
        stageNumber: 3,
        stageName: "Revenue Inspector Statutory Scrutiny",
        actor: "Revenue Inspector (RI)",
        officeType: "Mandal / Firka Revenue Office",
        timeline: "Within 3 Days",
        description: "Supervising officer reviews VRO field inquiry report and legal gazette records.",
        actionItem: "Check online portal status for RI endorsement clearance.",
        commonPitfall: "Land/Income discrepancies between revenue survey records and affidavit.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Mandal Revenue Office — Revenue Inspector (RI) Desk",
      },
      {
        stageNumber: 4,
        stageName: "Digital Signing & Certificate Issuance",
        actor: "Tahsildar / Mandal Revenue Officer (MRO)",
        officeType: "Tahsil / Taluk Office",
        timeline: "Within 15 Days (RTSA Guarantee)",
        description: "Competent revenue authority digitally signs the barcoded, QR-coded statutory certificate.",
        actionItem: "Download official digitally signed PDF from citizen portal or MeeSeva kiosk.",
        commonPitfall: "Expired link or not downloading within the statutory validity window.",
        stageMode: "ONLINE",
        portalLink: portalUrl,
        portalActionText: "Download Official Certificate PDF",
      },
    ];
  } else if (type === "healthcare") {
    // 4 STAGES: Healthcare
    dynamicStages = [
      {
        stageNumber: 1,
        stageName: "Ayushman Kiosk e-KYC & Verification",
        actor: "Ayushman Mitra / Arogya Mithra",
        officeType: "Empaneled Hospital Helpdesk",
        timeline: "Instant (15 mins)",
        description: "Verify beneficiary entitlement on SECC / NFSA database using Aadhaar or Ration Card.",
        actionItem: "Generate Golden Health PVC Card on spot at zero charge.",
        commonPitfall: "Going to an un-empaneled private nursing home.",
        stageMode: "HYBRID",
        portalLink: portalUrl,
        portalActionText: "Open Beneficiary Portal",
        physicalDeskLocation: offlineCounter || "Empaneled Hospital Ayushman Helpdesk",
      },
      {
        stageNumber: 2,
        stageName: "Clinical Diagnosis & Specialist Prescription",
        actor: "Empaneled Specialist Doctor",
        officeType: "Hospital Inpatient Department",
        timeline: "Day 1 of Admission",
        description: "Doctor diagnoses medical condition and prescribes an empaneled surgical or medical package.",
        actionItem: "Collect clinical diagnostic scans and specialist admission requisition.",
        commonPitfall: "Paying cash for diagnostic scans at empaneled hospital.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Hospital OPD / Specialist Clinical Consulting Room",
      },
      {
        stageNumber: 3,
        stageName: "State Health Agency (SHA) Pre-Authorization",
        actor: "State Health Agency / TPA Medical Auditor",
        officeType: "Online National Health Authority TMS Portal",
        timeline: "Within 2 to 4 Hours",
        description: "Hospital uploads clinical reports to NHA portal for government treatment sanction.",
        actionItem: "Ensure hospital initiates TMS claim before ICU admission or surgery.",
        commonPitfall: "Hospital asking for cash deposit as security deposit (strictly illegal).",
        stageMode: "ONLINE",
        portalLink: portalUrl,
        portalActionText: "Track Hospital TMS Pre-Auth",
      },
      {
        stageNumber: 4,
        stageName: "100% Cashless Medical Care & Biometric Discharge",
        actor: "Hospital Medical Team & Pharmacy",
        officeType: "Empaneled Hospital Discharge Desk",
        timeline: "Duration of Treatment + 15 Days Meds",
        description: "Patient receives complete cashless surgery, medications, implants, and 15 days of take-home medicine.",
        actionItem: "Sign biometric discharge voucher only after full treatment completion.",
        commonPitfall: "Leaving without collecting mandatory 15-day post-care medication pack.",
        stageMode: "OFFLINE",
        physicalDeskLocation: "Hospital Patient Billing & Discharge Desk #3",
      },
    ];
  } else {
    // 5 STAGES: Central / Merit Scholarships
    dynamicStages = [
      {
        stageNumber: 1,
        stageName: "Pre-Flight Document Gathering & Online Submission",
        actor: "Applicant (Student)",
        officeType: "Online National Scholarship Portal (NSP)",
        timeline: "Before Portal Deadline",
        description: `Submit online application on ${portalName} with Aadhaar OTP authentication.`,
        actionItem: "Download and print application submission acknowledgment.",
        commonPitfall: "Uploading blurry or unreadable scanned copies.",
        stageMode: "ONLINE",
        portalLink: portalUrl,
        portalActionText: "Open Application Portal",
      },
      {
        stageNumber: 2,
        stageName: "First-Tier Institutional Bonafide Verification",
        actor: "Institute Nodal Officer (INO) / College Principal",
        officeType: "College / University Academic Office",
        timeline: "Within 10 Days of Submission",
        description: "College verification officer cross-verifies student admission, attendance, and fee structure.",
        actionItem: "Submit physical copies to verification clerk immediately after online entry.",
        commonPitfall: "Delaying physical document submission past the institute closing date.",
        stageMode: "HYBRID",
        physicalDeskLocation: "College Academic Section — INO Verification Desk (Room #102)",
      },
      {
        stageNumber: 3,
        stageName: "District Welfare Officer (DNO) Scrutiny",
        actor: "District Welfare / Social Justice Officer",
        officeType: "District Collectorate Welfare Wing",
        timeline: "15 Days",
        description: "Competent district authority verifies caste, income authenticity, and student quota.",
        actionItem: "Monitor online status weekly; address any defective notice promptly.",
        commonPitfall: "Failing to rectify defective notices within the 72-hour window.",
        stageMode: "ONLINE",
        portalLink: portalUrl,
        portalActionText: "Check DNO Scrutiny Status",
      },
      {
        stageNumber: 4,
        stageName: "State Directorate (SNO) Merit Sanction",
        actor: "State Nodal Officer (SNO)",
        officeType: "State Higher Education / Tribal Directorate",
        timeline: "Within 20 Days",
        description: "State directorate creates verified merit list and generates financial sanction orders.",
        actionItem: "Track application status on portal for SNO sanction order number.",
        commonPitfall: "Institute not recognized under AISHE code.",
        stageMode: "ONLINE",
        portalLink: portalUrl,
        portalActionText: "Track SNO Sanction Order",
      },
      {
        stageNumber: 5,
        stageName: "Direct Disbursal via PFMS / APBS",
        actor: "Public Financial Management System (PFMS)",
        officeType: "Central Treasury / National Payments Gateway",
        timeline: "Direct Disbursal",
        description: "Scholarship grant is credited directly into the verified Aadhaar-seeded bank account.",
        actionItem: "Verify credit via bank SMS or download official payment voucher.",
        commonPitfall: "Dormant bank account or unseeded NPCI mapper preventing credit.",
        stageMode: "ONLINE",
        portalLink: "https://pfms.nic.in",
        portalActionText: "Track PFMS Payment Status",
      },
    ];
  }

  return {
    schemeId,
    schemeTitle: title,
    shortCode: scheme?.shortCode || schemeId,
    type,
    categoryLabel:
      isForestOrLandRights
        ? "Statutory Forest Land Ownership & Scheduled Tribe Rights"
        : isEducationLoan
        ? "Central Collateral-Free Education Loan & Full Interest Subsidy"
        : type === "healthcare"
        ? "Health Assurance Scheme"
        : type === "certificate"
        ? "Statutory Revenue Service"
        : "Central Welfare Scholarship",
    sponsoringBody: scheme?.sponsoringBody || scheme?.ministry || "Government of India",
    benefitHeadline: scheme?.benefitAmount || "Financial Assistance / Fee Exemption",
    statutoryTimeLimit: scheme?.offlineSubmission.statutoryDaysLimit ? `${scheme.offlineSubmission.statutoryDaysLimit} Days SLA` : "30 Days standard processing",
    officialFee: scheme?.offlineSubmission.officialStatutoryFee || "₹0.00",
    portalName,
    portalUrl,
    offlineCounter,
    processMode,
    processModeLabel,
    processModeDescription,
    tier1BaseIdentity: [
      {
        name: isForestOrLandRights ? "Form A - Forest Rights Claim Proforma" : "Aadhaar Card of Applicant",
        requirement: isForestOrLandRights ? "Physically signed by claimant and spouse with village elder witnesses" : "Active mobile linked for OTP e-KYC authentication",
        mandatory: true,
      },
      {
        name: isForestOrLandRights ? "Pre-2005 Forest Residency Proof (Voter ID / Ration Card)" : "Class 10th / 12th Certificate or Birth Certificate",
        requirement: isForestOrLandRights ? "Physical proof of occupation in forest hamlet before 13 Dec 2005" : "Official verification of date of birth and legal name spelling",
        mandatory: true,
      },
      {
        name: isForestOrLandRights ? "Aadhaar Card of Claimant & Spouse (Joint Patta)" : "Active Mobile & Email",
        requirement: isForestOrLandRights ? "Mandatory for joint title deed under FRA Section 4(4)" : "For OTP verification and portal tracking notifications",
        mandatory: true,
      },
    ],
    tier2StatutoryCertificates: (scheme?.prerequisites || []).map((prereqId) => {
      const prereq = SCHEMES_DATABASE.find((s) => s.id === prereqId);
      return {
        certificateId: prereqId,
        name: prereq?.title || prereqId.replace("_", " "),
        authority: "Tehsildar / Sub-Divisional Officer",
        turnaround: prereq?.offlineSubmission.statutoryDaysLimit ? `${prereq.offlineSubmission.statutoryDaysLimit} Days` : "15 Days",
        statutoryCost: prereq?.offlineSubmission.officialStatutoryFee || "₹25",
        validity: prereqId.includes("Income") ? "Current FY (1 Year)" : "Permanent / Lifetime",
        keyCondition: `Mandatory prerequisite to unlock ${scheme?.shortCode || "this scheme"}`,
      };
    }),
    tier3Institutional: [
      {
        name: isForestOrLandRights
          ? "Gram Sabha Quorum Resolution"
          : type === "healthcare"
          ? "Hospital Doctor Referral & Estimate"
          : type === "certificate"
          ? "Self-Declaration Affidavit / Notary Attestation"
          : "College Bonafide Student Certificate",
        authority: isForestOrLandRights
          ? "Village Gram Sabha (Presided by FRC Chairperson)"
          : type === "healthcare"
          ? "Government Medical Superintendent"
          : type === "certificate"
          ? "Notary Public / Oath Commissioner"
          : "College Principal / Registrar",
        action: type === "certificate"
          ? "Sworn legal declaration on non-judicial stamp paper affirming eligibility criteria"
          : "Official verification on institutional letterhead / register",
        category: type === "healthcare" ? "Healthcare" : isForestOrLandRights || type === "certificate" ? "Civic" : "Academic",
      },
      {
        name: isForestOrLandRights
          ? "Joint Forest Beat & Revenue Survey GPS Map"
          : type === "certificate"
          ? "Local Revenue Field Inquiry (VRO / RI)"
          : "Aadhaar NPCI DBT Bank Account",
        authority: isForestOrLandRights
          ? "Mandal Revenue Surveyor & Forest Beat Officer"
          : type === "certificate"
          ? "Village Revenue Officer (VRO) / Revenue Inspector"
          : "Nationalized Bank Branch",
        action: isForestOrLandRights
          ? "Demarcation of physical boundaries signed on field Panchanama"
          : type === "certificate"
          ? "On-ground family standing and demographic verification report submitted to Tahsildar"
          : "Account must be seeded on NPCI DBT Mapper for electronic fund transfer",
        category: isForestOrLandRights || type === "certificate" ? "Civic" : "Banking",
      },
    ],
    bankingRequirement: isForestOrLandRights
      ? "No bank account required. Title deed is registered directly in state land records."
      : type === "certificate"
      ? "No bank account required. Statutory certificate is issued directly with digital QR barcode to DigiLocker."
      : "Aadhaar seeded bank account on NPCI mapper for Direct Benefit Transfer.",
    stages: dynamicStages,
    rejectionChecklist: isForestOrLandRights
      ? [
          {
            check: "Are both husband and wife listed as joint claimants on Form A?",
            resolution: "Section 4(4) of FRA mandates joint title deed in the name of both spouses unless the claimant is single.",
          },
          {
            check: "Does the claimant have evidence of forest land occupation prior to 13 December 2005?",
            resolution: "Submit old forest encroachment challans, elder statements, or voter identity records showing residence prior to cut-off.",
          },
        ]
      : [
          {
            check: "Are all required certificates issued in the current financial year?",
            resolution: "Renew Income Certificate if issued before April 1, 2026.",
          },
          {
            check: "Is your bank account seeded on the NPCI mapper?",
            resolution: "Submit JanSetu Annexure I mandate form to your bank branch.",
          },
        ],
  };
}

// 3. MULTI-SCHEME MERGER ENGINE
export interface MergedRoadmapResult {
  selectedSchemes: SchemeRoadmap[];
  totalCombinedBenefit: string;
  totalStatutoryFees: string;
  sharedBaseDocuments: {
    docName: string;
    requirement: string;
    sharedCount: number;
    usedInSchemes: string[];
  }[];
  sharedStatutoryCertificates: {
    certificateId: string;
    name: string;
    authority: string;
    turnaround: string;
    statutoryCost: string;
    sharedCount: number;
    usedInSchemes: string[];
    isOverlapping: boolean;
  }[];
  institutionalRequirementsGrouped: {
    category: "Academic" | "Healthcare" | "Banking" | "Civic";
    items: {
      name: string;
      authority: string;
      action: string;
      usedInScheme: string;
    }[];
  }[];
  consolidatedVisitPlan: {
    location: string;
    purpose: string;
    documentsToCarry: string[];
    servicesAddressed: string[];
    statutoryFee: string;
    timeEfficiencyNote: string;
  }[];
}

export function getMergedRoadmap(schemeIds: string[]): MergedRoadmapResult {
  const validIds = schemeIds.filter((id) => SCHEME_ROADMAPS[id] || SCHEMES_DATABASE.some((s) => s.id === id));
  const roadmaps = validIds.map((id) => getSchemeRoadmap(id));

  // 1. Combine & Deduplicate Base Documents
  const baseDocsMap = new Map<string, { requirement: string; schemes: string[] }>();
  for (const r of roadmaps) {
    for (const doc of r.tier1BaseIdentity) {
      const existing = baseDocsMap.get(doc.name);
      if (existing) {
        existing.schemes.push(r.shortCode);
      } else {
        baseDocsMap.set(doc.name, {
          requirement: doc.requirement,
          schemes: [r.shortCode],
        });
      }
    }
  }

  const sharedBaseDocuments = Array.from(baseDocsMap.entries()).map(([docName, data]) => ({
    docName,
    requirement: data.requirement,
    sharedCount: data.schemes.length,
    usedInSchemes: data.schemes,
  }));

  // 2. Combine & Deduplicate Statutory Certificates
  const certsMap = new Map<string, { cert: RoadmapStatutoryCertificate; schemes: string[] }>();
  for (const r of roadmaps) {
    for (const c of r.tier2StatutoryCertificates) {
      const existing = certsMap.get(c.certificateId);
      if (existing) {
        existing.schemes.push(r.shortCode);
      } else {
        certsMap.set(c.certificateId, {
          cert: c,
          schemes: [r.shortCode],
        });
      }
    }
  }

  const sharedStatutoryCertificates = Array.from(certsMap.entries()).map(([, data]) => ({
    certificateId: data.cert.certificateId,
    name: data.cert.name,
    authority: data.cert.authority,
    turnaround: data.cert.turnaround,
    statutoryCost: data.cert.statutoryCost,
    sharedCount: data.schemes.length,
    usedInSchemes: data.schemes,
    isOverlapping: data.schemes.length > 1,
  }));

  // 3. Group Institutional Requirements
  const instMap = new Map<string, { name: string; authority: string; action: string; usedInScheme: string }[]>();
  for (const r of roadmaps) {
    for (const item of r.tier3Institutional) {
      const list = instMap.get(item.category) || [];
      list.push({
        name: item.name,
        authority: item.authority,
        action: item.action,
        usedInScheme: r.shortCode,
      });
      instMap.set(item.category, list);
    }
  }

  const institutionalRequirementsGrouped = Array.from(instMap.entries()).map(([category, items]) => ({
    category: category as "Academic" | "Healthcare" | "Banking" | "Civic",
    items,
  }));

  // 4. Build Consolidated Physical Visit Plan
  const consolidatedVisitPlan = [
    {
      location: "Tahsil / Revenue Office (or Village CSC Center)",
      purpose: "Apply for foundational statutory certificates in a single administrative transaction",
      documentsToCarry: [
        "Aadhaar Card (Original + 2 photocopies)",
        "Ration Card / BPL Card",
        "Father's / Ancestor's Land Record (RoR) / 1950 Proof",
        "Self-declaration Income & Asset Affidavit",
      ],
      servicesAddressed: sharedStatutoryCertificates.map((c) => c.name),
      statutoryFee: "₹25 – ₹60 total (Official RTSA Service Charge)",
      timeEfficiencyNote: "Applying for Income & Caste certificates in one visit saves 15 days of redundant travel.",
    },
    {
      location: "Nationalized Bank Branch (Customer Service Desk)",
      purpose: "Aadhaar NPCI DBT Mapper Seeding (Annexure I)",
      documentsToCarry: [
        "Pre-filled JanSetu NPCI Seeding Mandate Form (Annexure I)",
        "Bank Passbook (Account in student's sole name)",
        "Aadhaar Card (Physical copy)",
      ],
      servicesAddressed: ["Aadhaar Payment Bridge System (APBS) activation for all central DBT grants"],
      statutoryFee: "₹0.00 (Free banking service mandated by RBI)",
      timeEfficiencyNote: "Mandatory for all scholarship schemes and cash transfers. Do this before portal submission.",
    },
  ];

  // Add College or Hospital visit if applicable
  const hasAcademic = roadmaps.some((r) => r.type === "scholarship");
  const hasHealthcare = roadmaps.some((r) => r.type === "healthcare");

  if (hasAcademic) {
    consolidatedVisitPlan.push({
      location: "College / Institute Scholarship & Academic Office",
      purpose: "Obtain Bonafide Certificate, Fee Receipt, and INO verification",
      documentsToCarry: [
        "Printed Online Scholarship Application Form",
        "Attested Photocopies of 10th/12th Marksheet & Caste/Income Certificates",
        "Counseling Allotment Letter",
      ],
      servicesAddressed: roadmaps.filter((r) => r.type === "scholarship").map((r) => r.shortCode),
      statutoryFee: "₹0.00",
      timeEfficiencyNote: "Submit physical file directly to the College INO clerk within 7 days of portal submission.",
    });
  }

  if (hasHealthcare) {
    consolidatedVisitPlan.push({
      location: "District Hospital / Empaneled Medical College (Ayushman Kiosk)",
      purpose: "Ayushman Bharat PVC Card generation & Inpatient Pre-Authorization",
      documentsToCarry: [
        "Patient & Family Head Aadhaar Cards",
        "Ration Card / NFSA ID",
        "Doctor's Clinical Referral or Treatment Estimate Slip",
      ],
      servicesAddressed: ["Cashless Medical Treatment & Surgery Pre-Auth"],
      statutoryFee: "₹0.00 (Statutorily 100% Free)",
      timeEfficiencyNote: "Ayushman Mitra desk generates e-card instantly with biometric KYC. Never pay any fee.",
    });
  }

  // Combined benefits calculation
  const totalCombinedBenefit = roadmaps.map((r) => r.benefitHeadline).join(" + ");
  const totalStatutoryFees = "₹25 – ₹60 (Statutory government charges only; ₹0 for cyber cafes)";

  return {
    selectedSchemes: roadmaps,
    totalCombinedBenefit,
    totalStatutoryFees,
    sharedBaseDocuments,
    sharedStatutoryCertificates,
    institutionalRequirementsGrouped,
    consolidatedVisitPlan,
  };
}
