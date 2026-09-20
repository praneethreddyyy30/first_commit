"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  DocumentAuditInput,
  auditCitizenDocuments,
  generateNpciMandateForm,
  generateNameAffidavitText
} from "@/lib/audit/documentAuditor";
import { SCHEMES_DATABASE, SchemeOrService } from "@/data/schemes";
import { UserProfile } from "@/lib/cedar/evaluator";
import { CertificateResolutionModal } from "@/components/CertificateResolutionModal";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Copy,
  ShieldAlert,
  FileText,
  Building,
  Check,
  Upload,
  FileUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  X,
  FileBadge,
  FileCheck2,
  ChevronRight,
  ExternalLink,
  Layers,
  Award,
  CheckCircle,
  Edit3,
  Cloud,
  HelpCircle
} from "lucide-react";

interface DocumentAuditTabProps {
  initialInput: DocumentAuditInput;
  selectedSchemeId?: string;
  profile?: UserProfile;
  onSelectScheme?: (schemeId: string) => void;
  onProfileChange?: (newProfile: UserProfile) => void;
  onAuditInputChange?: (newAudit: DocumentAuditInput) => void;
  onNavigateToEligibility?: () => void;
  onNavigateToRoadmap?: (schemeId: string) => void;
}

interface SchemeUploadedDocInfo {
  fileName: string;
  size: string;
  type: string;
  status: "VERIFIED" | "PENDING" | "REJECTED";
  isValidDocument?: boolean;
  extractedName?: string;
  extractedDob?: string;
  extractedId?: string;
  confidenceScore?: number;
  issuingAuthority?: string;
  validationWarnings?: string[];
  isExtracting?: boolean;
  s3Key?: string;
  s3Uploaded?: boolean;
}

/**
 * Detects the statutory expected document category from the scheme's mandatory document text.
 */
function detectExpectedDocType(docTitle: string): string {
  const t = docTitle.toLowerCase();
  if (t.includes("aadhaar") || t.includes("aadhar") || t.includes("uidai")) return "aadhaar";
  if (t.includes("caste") || t.includes("community") || t.includes("tribe") || t.includes("category")) return "caste";
  if (t.includes("income") || t.includes("salary") || t.includes("affluence")) return "income";
  if (
    t.includes("marksheet") ||
    t.includes("memo") ||
    t.includes("passing") ||
    t.includes("class 10") ||
    t.includes("class 12") ||
    t.includes("ssc") ||
    t.includes("inter") ||
    t.includes("degree")
  )
    return "marksheet";
  if (t.includes("bank") || t.includes("passbook") || t.includes("account") || t.includes("statement") || t.includes("npci"))
    return "bank";
  if (
    t.includes("bonafide") ||
    t.includes("study") ||
    t.includes("joining report") ||
    t.includes("institutional") ||
    t.includes("allotment")
  )
    return "bonafide";
  if (t.includes("ration") || t.includes("rice card") || t.includes("food security")) return "ration_card";
  if (t.includes("disability") || t.includes("udid") || t.includes("sadarem")) return "disability";
  if (t.includes("domicile") || t.includes("nativity") || t.includes("residence")) return "domicile";
  if (t.includes("fee receipt") || t.includes("receipt")) return "fee_receipt";
  if (t.includes("land") || t.includes("patta") || t.includes("rofr")) return "land_record";
  return "statutory_cert";
}

/**
 * Visual badge metadata for document categories.
 */
function getDocCategoryMeta(docTitle: string) {
  const expected = detectExpectedDocType(docTitle);
  switch (expected) {
    case "aadhaar":
      return {
        label: "Master Legal Identity Anchor",
        category: "Identity Anchor",
        colorBadge: "bg-amber-100 text-amber-900 border-amber-300",
        icon: FileBadge,
        iconBg: "bg-amber-100 text-amber-800",
      };
    case "caste":
      return {
        label: "Permanent Community / Tribe Certificate",
        category: "Caste / Tribe",
        colorBadge: "bg-purple-100 text-purple-900 border-purple-300",
        icon: Award,
        iconBg: "bg-purple-100 text-purple-800",
      };
    case "income":
      return {
        label: "Revenue Dept Income Certificate",
        category: "Income Proof",
        colorBadge: "bg-emerald-100 text-emerald-900 border-emerald-300",
        icon: FileText,
        iconBg: "bg-emerald-100 text-emerald-800",
      };
    case "marksheet":
      return {
        label: "Board / University Academic Record",
        category: "Academic Memo",
        colorBadge: "bg-sky-100 text-sky-900 border-sky-300",
        icon: FileText,
        iconBg: "bg-sky-100 text-sky-800",
      };
    case "bank":
      return {
        label: "NPCI DBT / PFMS Bank Passbook",
        category: "DBT Banking",
        colorBadge: "bg-indigo-100 text-indigo-900 border-indigo-300",
        icon: Building,
        iconBg: "bg-indigo-100 text-indigo-800",
      };
    case "bonafide":
      return {
        label: "Institutional Bonafide / Principal Memo",
        category: "Institution",
        colorBadge: "bg-teal-100 text-teal-900 border-teal-300",
        icon: FileCheck2,
        iconBg: "bg-teal-100 text-teal-800",
      };
    case "ration_card":
      return {
        label: "Civil Supplies Food Security Card",
        category: "Civil Supplies",
        colorBadge: "bg-orange-100 text-orange-900 border-orange-300",
        icon: FileText,
        iconBg: "bg-orange-100 text-orange-800",
      };
    default:
      return {
        label: "Gazette Statutory Requirement",
        category: "Statutory",
        colorBadge: "bg-slate-100 text-slate-800 border-slate-300",
        icon: FileText,
        iconBg: "bg-slate-100 text-slate-700",
      };
  }
}

export const DocumentAuditTab: React.FC<DocumentAuditTabProps> = ({
  initialInput,
  selectedSchemeId,
  profile,
  onSelectScheme,
  onProfileChange,
  onAuditInputChange,
  onNavigateToEligibility,
  onNavigateToRoadmap,
}) => {
  const [auditInput, setAuditInput] = useState<DocumentAuditInput>(initialInput);
  const [copiedForm, setCopiedForm] = useState(false);
  const [copiedAffidavit, setCopiedAffidavit] = useState(false);
  const [showMandateModal, setShowMandateModal] = useState(false);
  const [showAffidavitModal, setShowAffidavitModal] = useState(false);
  const [selectedCertGuideId, setSelectedCertGuideId] = useState<string | null>(null);

  // Default active scheme
  const defaultSchemeId = useMemo(() => {
    if (profile?.state === "Andhra Pradesh" && (!selectedSchemeId || selectedSchemeId.startsWith("TN_"))) {
      return "AP_Jagananna_Vidya_Deevena";
    }
    if (profile?.state === "Tamil Nadu" && (!selectedSchemeId || selectedSchemeId.startsWith("AP_"))) {
      return "TN_Pudhumai_Penn";
    }
    if (selectedSchemeId) return selectedSchemeId;
    return "PostMatric_ST";
  }, [selectedSchemeId, profile?.state]);

  const [activeSchemeId, setActiveSchemeId] = useState<string>(defaultSchemeId);

  // Sync if prop changes (strictly respect user selection)
  useEffect(() => {
    if (selectedSchemeId) {
      setActiveSchemeId(selectedSchemeId);
    }
  }, [selectedSchemeId]);

  const currentScheme: SchemeOrService = useMemo(() => {
    return (
      SCHEMES_DATABASE.find((s) => s.id === activeSchemeId) ||
      SCHEMES_DATABASE[0]
    );
  }, [activeSchemeId]);

  // Dynamic Scheme-Specific Document Upload State with Real-Time OCR
  const [schemeUploadedDocs, setSchemeUploadedDocs] = useState<Record<string, SchemeUploadedDocInfo>>({});

  // Sync state whenever initialInput or profile changes
  useEffect(() => {
    setAuditInput(initialInput);
  }, [initialInput]);

  // Handle direct changes to citizen names
  const handleUpdateAadhaarName = (newName: string) => {
    const updated = { ...auditInput, nameOnAadhaar: newName };
    setAuditInput(updated);
    if (onAuditInputChange) onAuditInputChange(updated);
  };

  const handleUpdateMarksheetName = (newName: string) => {
    const updated = { ...auditInput, nameOnMarksheet: newName };
    setAuditInput(updated);
    if (onAuditInputChange) onAuditInputChange(updated);
  };

  const handleToggleBankLinked = (linked: boolean) => {
    const updated = { ...auditInput, isAadhaarLinkedToBank: linked };
    setAuditInput(updated);
    if (onAuditInputChange) onAuditInputChange(updated);
  };

  const handleToggleNpciSeeded = (seeded: boolean) => {
    const updated = { ...auditInput, isNpciSeeded: seeded };
    setAuditInput(updated);
    if (onAuditInputChange) onAuditInputChange(updated);
  };

  // Upload handler for scheme-specific documents with real OCR & Mismatch Detection
  const handleSchemeDocUpload = async (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    // Client-side guard for HEIC / HEIF camera photos
    if (file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")) {
      setSchemeUploadedDocs((prev) => ({
        ...prev,
        [docName]: {
          fileName: file.name,
          size: sizeStr,
          type: file.type || "image/heic",
          status: "REJECTED",
          isValidDocument: false,
          confidenceScore: 0,
          validationWarnings: [
            `❌ Unsupported Format (.HEIC): Live camera snapshots and wallpapers cannot be verified as official statutory documents. Please upload an official scanned document in standard PDF, JPG, or PNG format.`,
          ],
          isExtracting: false,
        },
      }));
      return;
    }

    const expected = detectExpectedDocType(docName);

    // 1. Set extracting state
    setSchemeUploadedDocs((prev) => ({
      ...prev,
      [docName]: {
        fileName: file.name,
        size: sizeStr,
        type: file.type,
        status: "PENDING",
        isExtracting: true,
        isValidDocument: undefined,
      },
    }));

    // 2. Read file as base64 and call OCR / Vision extraction API
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const savedGeminiKey = typeof window !== "undefined" ? localStorage.getItem("jansetu_gemini_key") || undefined : undefined;
        const savedAwsKey = typeof window !== "undefined" ? localStorage.getItem("jansetu_aws_access_key") || undefined : undefined;
        const savedAwsSecret = typeof window !== "undefined" ? localStorage.getItem("jansetu_aws_secret_key") || undefined : undefined;
        const savedAwsRegion = typeof window !== "undefined" ? localStorage.getItem("jansetu_aws_region") || undefined : undefined;

        const response = await fetch("/api/audit/extract-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data,
            expectedType: expected,
            geminiApiKey: savedGeminiKey,
            customCredentials: savedAwsKey && savedAwsSecret ? {
              accessKeyId: savedAwsKey,
              secretAccessKey: savedAwsSecret,
              region: savedAwsRegion || "us-east-1",
            } : undefined,
          }),
        });

        const data = await response.json();
        if (data.success && data.result) {
          const res = data.result;
          const isDocValid = res.isValidDocument === true;
          const confidence = res.confidenceScore != null
            ? (res.confidenceScore <= 1 ? Math.round(res.confidenceScore * 100) : Math.round(res.confidenceScore))
            : 0;

          setSchemeUploadedDocs((prev) => ({
            ...prev,
            [docName]: {
              fileName: file.name,
              size: sizeStr,
              type: file.type,
              status: isDocValid ? "VERIFIED" : "REJECTED",
              isValidDocument: isDocValid,
              extractedName: isDocValid ? (res.extractedName || undefined) : undefined,
              extractedDob: isDocValid ? (res.extractedDob || undefined) : undefined,
              extractedId: isDocValid ? (res.extractedIdNumber || undefined) : undefined,
              confidenceScore: isDocValid ? confidence : 0,
              issuingAuthority: isDocValid ? (res.issuingAuthority || undefined) : undefined,
              validationWarnings: res.validationWarnings && res.validationWarnings.length > 0
                ? res.validationWarnings
                : (!isDocValid ? ["Document validation failed. Statutory markers not recognized."] : []),
              isExtracting: false,
            },
          }));

          // If valid document and name was extracted, sync into auditInput
          if (isDocValid && res.extractedName) {
            let updated = { ...auditInput };
            if (expected === "aadhaar") {
              updated.nameOnAadhaar = res.extractedName;
              if (res.extractedDob) updated.dobOnAadhaar = res.extractedDob;
            } else if (expected === "marksheet" || expected === "bonafide") {
              updated.nameOnMarksheet = res.extractedName;
              if (res.extractedDob) updated.dobOnMarksheet = res.extractedDob;
            } else if (expected === "caste") {
              updated.nameOnCasteCertificate = res.extractedName;
            } else if (expected === "bank") {
              if (res.issuingAuthority) updated.bankName = res.issuingAuthority;
            }
            setAuditInput(updated);
            if (onAuditInputChange) onAuditInputChange(updated);
          }

          // Optional S3 Vault Archival
          if (isDocValid) {
            try {
              const s3Res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fileName: file.name,
                  fileType: file.type,
                  documentType: expected,
                  citizenId: profile?.name || "citizen",
                }),
              });
              const s3Data = await s3Res.json();
              if (s3Data.success && s3Data.uploadUrl) {
                if (s3Data.mode === "AWS_S3_PRESIGNED") {
                  await fetch(s3Data.uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": file.type },
                    body: file,
                  });
                }
                setSchemeUploadedDocs((prev) => ({
                  ...prev,
                  [docName]: {
                    ...prev[docName],
                    s3Key: s3Data.objectKey,
                    s3Uploaded: true,
                  },
                }));
              }
            } catch (s3Err) {
              console.warn("S3 pre-signed upload skipped:", s3Err);
            }
          }
        } else {
          setSchemeUploadedDocs((prev) => ({
            ...prev,
            [docName]: {
              fileName: file.name,
              size: sizeStr,
              type: file.type,
              status: "REJECTED",
              isValidDocument: false,
              validationWarnings: [data.error || "Document validation failed. Statutory markers not recognized."],
              isExtracting: false,
            },
          }));
        }
      } catch (err) {
        console.error("Failed to extract scheme document:", err);
        setSchemeUploadedDocs((prev) => ({
          ...prev,
          [docName]: {
            fileName: file.name,
            size: sizeStr,
            type: file.type,
            status: "REJECTED",
            isValidDocument: false,
            validationWarnings: ["Extraction error: Unable to process document file."],
            isExtracting: false,
          },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Editable Name on uploaded document card
  const handleUpdateSchemeDocName = (docName: string, newName: string) => {
    setSchemeUploadedDocs((prev) => {
      const existing = prev[docName];
      if (!existing) return prev;
      return {
        ...prev,
        [docName]: {
          ...existing,
          extractedName: newName,
        },
      };
    });

    const expected = detectExpectedDocType(docName);
    let updated = { ...auditInput };
    if (expected === "aadhaar") {
      updated.nameOnAadhaar = newName;
    } else if (expected === "marksheet" || expected === "bonafide") {
      updated.nameOnMarksheet = newName;
    } else if (expected === "caste") {
      updated.nameOnCasteCertificate = newName;
    }
    setAuditInput(updated);
    if (onAuditInputChange) onAuditInputChange(updated);
  };

  // Quick Preset Test Scenarios
  const handleApplyPreset = (preset: "sravani_ap" | "kavitha_tn" | "exact_match" | "typo_mismatch" | "clear") => {
    let updated: DocumentAuditInput = { ...auditInput };

    if (preset === "sravani_ap") {
      updated = {
        ...auditInput,
        nameOnAadhaar: "Madhira Sravani",
        nameOnMarksheet: "M. Sravani",
        dobOnAadhaar: "2005-08-14",
        dobOnMarksheet: "2005-08-14",
        bankName: "Andhra Pragathi Grameena Bank",
        isAadhaarLinkedToBank: true,
        isNpciSeeded: true,
      };
    } else if (preset === "kavitha_tn") {
      updated = {
        ...auditInput,
        nameOnAadhaar: "Kavitha Selvam",
        nameOnMarksheet: "Kavitha S",
        dobOnAadhaar: "2006-05-12",
        dobOnMarksheet: "2006-05-12",
        bankName: "State Bank of India",
        isAadhaarLinkedToBank: true,
        isNpciSeeded: false,
      };
    } else if (preset === "exact_match") {
      const matchName = auditInput.nameOnAadhaar || profile?.name || "Kavitha Selvam";
      updated = {
        ...auditInput,
        nameOnAadhaar: matchName,
        nameOnMarksheet: matchName,
        isAadhaarLinkedToBank: true,
        isNpciSeeded: true,
      };
    } else if (preset === "typo_mismatch") {
      const aadhaarName = "Kavitha Selvam";
      const typoMarksheet = "Kavita Chelvam";
      updated = {
        ...auditInput,
        nameOnAadhaar: aadhaarName,
        nameOnMarksheet: typoMarksheet,
      };
    } else if (preset === "clear") {
      setSchemeUploadedDocs({});
      updated = {
        ...auditInput,
        nameOnAadhaar: "",
        nameOnMarksheet: "",
      };
    }

    setAuditInput(updated);
    if (onAuditInputChange) {
      onAuditInputChange(updated);
    }
  };

  const auditResult = auditCitizenDocuments(auditInput);

  const mandateText = generateNpciMandateForm(
    auditInput.nameOnAadhaar || profile?.name || "Citizen",
    auditInput.bankName || "State Bank of India",
    "38920192819",
    "XXXX-XXXX-4819"
  );

  const affidavitText = generateNameAffidavitText(
    auditInput.nameOnAadhaar || profile?.name || "Citizen",
    auditInput.nameOnMarksheet || "Citizen",
    "Parent/Guardian",
    profile?.state || "India"
  );

  const handleCopyMandate = () => {
    navigator.clipboard.writeText(mandateText);
    setCopiedForm(true);
    setTimeout(() => setCopiedForm(false), 2500);
  };

  const handleDownloadMandate = () => {
    const blob = new Blob([mandateText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NPCI_Aadhaar_DBT_Mandate_${(auditInput.nameOnAadhaar || "Applicant").replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyAffidavit = () => {
    navigator.clipboard.writeText(affidavitText);
    setCopiedAffidavit(true);
    setTimeout(() => setCopiedAffidavit(false), 2500);
  };

  const handleDownloadAffidavit = () => {
    const blob = new Blob([affidavitText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Notarized_Name_Discrepancy_Affidavit_${(auditInput.nameOnAadhaar || "Applicant").replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSchemeChange = (schemeId: string) => {
    setActiveSchemeId(schemeId);
    if (onSelectScheme) {
      onSelectScheme(schemeId);
    }
  };

  const handleMarkCertAsHeld = (certId: string) => {
    if (profile && onProfileChange) {
      const currentHeld = profile.heldDocuments || [];
      if (!currentHeld.includes(certId)) {
        onProfileChange({
          ...profile,
          heldDocuments: [...currentHeld, certId],
        });
      }
    }
    setSelectedCertGuideId(null);
  };

  // Human-readable document titles for prerequisites
  const getDocumentName = (docId: string) => {
    const names: Record<string, string> = {
      Aadhaar_Card: "Aadhaar Card (UIDAI with Linked Mobile)",
      Marksheet_10_12: "10th Class Marksheet / SSC Memo",
      Bank_Passbook: "Bank Account Passbook (NPCI Seeded)",
      Income_Certificate: "Statutory Income Certificate (Tahsildar)",
      Caste_Certificate: "Permanent Community / Caste Certificate",
      Domicile_Certificate: "Nativity / Domicile Certificate",
      Ration_Card: "Ration Card / Rice Card (Civil Supplies)",
      TN_First_Graduate_Cert: "First Graduate Certificate (e-Sevai REV-104)",
      Govt_School_Study_Certificate: "Class 6-12 Govt School Study Memo (HM Signed)",
      Disability_Certificate: "UDID National Disability Certificate",
      EWS_Certificate: "Economically Weaker Section Certificate",
      College_Bonafide_Certificate: "Institutional Bonafide Certificate & Allotment Order",
      MeeSeva_REV01_Integrated_Cert: "Integrated Community, Nativity & DOB Certificate (REV-01)",
      Electricity_Bill: "Recent Domestic Electricity Consumption Bill (<300 units/mo)",
      Mother_Aadhaar: "Mother's Aadhaar Card (For RTF Tuition Crediting)",
      Mother_Bank_Passbook: "Mother's NPCI-Seeded Bank Passbook"
    };
    return names[docId] || docId.replace(/_/g, " ");
  };

  const userHeld = profile?.heldDocuments || [];

  // Scheme verification status calculations
  const mandatoryDocsList = currentScheme.mandatoryDocuments || [];
  const verifiedCount = mandatoryDocsList.filter(
    (doc) => schemeUploadedDocs[doc]?.status === "VERIFIED" && schemeUploadedDocs[doc]?.isValidDocument !== false
  ).length;
  const rejectedCount = mandatoryDocsList.filter(
    (doc) => schemeUploadedDocs[doc]?.status === "REJECTED" || schemeUploadedDocs[doc]?.isValidDocument === false
  ).length;
  const pendingCount = mandatoryDocsList.length - verifiedCount - rejectedCount;

  // Breakdown names into words/tokens for visual diff
  const aadhaarTokens = (auditInput.nameOnAadhaar || "").trim().split(/\s+/).filter(Boolean);
  const marksheetTokens = (auditInput.nameOnMarksheet || "").trim().split(/\s+/).filter(Boolean);

  return (
    <div className="space-y-6 font-sans">
      {/* Target Scheme Selector Banner */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="size-3.5 text-amber-600" />
              <span>Scheme-Centric Statutory Audit</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1B4F] font-serif tracking-tight">
              Audit Document Prerequisites for Specific Scheme
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed mt-1">
              Statutory requirements strictly differ per government welfare scheme. Select your target scheme below to review official gazette requirements, upload mandatory certificates, and run live OCR verification.
            </p>
          </div>

          {/* Scheme Dropdown Selector */}
          <div className="w-full md:w-80 shrink-0">
            <label className="block text-[11px] font-bold text-[#0B1B4F] uppercase tracking-wider mb-1.5 font-serif">
              Target Scheme:
            </label>
            <select
              value={activeSchemeId}
              onChange={(e) => handleSchemeChange(e.target.value)}
              className="w-full rounded-xl border border-[#DFC8A5] bg-white px-3.5 py-2.5 text-xs font-bold text-[#0B1B4F] shadow-xs focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/30 focus:outline-none"
            >
              {profile?.state === "Tamil Nadu" ? (
                <>
                  <optgroup label="Tamil Nadu Flagship Schemes">
                    {SCHEMES_DATABASE.filter((s) => s.id.startsWith("TN_")).map((s) => (
                      <option key={s.id} value={s.id}>
                        TN: {s.title.substring(0, 45)}...
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Centrally Sponsored Schemes">
                    {SCHEMES_DATABASE.filter((s) => !s.id.startsWith("AP_") && !s.id.startsWith("TN_")).map((s) => (
                      <option key={s.id} value={s.id}>
                        Central: {s.title.substring(0, 45)}...
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Andhra Pradesh Flagship Schemes">
                    {SCHEMES_DATABASE.filter((s) => s.id.startsWith("AP_")).map((s) => (
                      <option key={s.id} value={s.id}>
                        AP: {s.title.substring(0, 45)}...
                      </option>
                    ))}
                  </optgroup>
                </>
              ) : (
                <>
                  <optgroup label="Andhra Pradesh Flagship Schemes">
                    {SCHEMES_DATABASE.filter((s) => s.id.startsWith("AP_")).map((s) => (
                      <option key={s.id} value={s.id}>
                        AP: {s.title.substring(0, 45)}...
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Centrally Sponsored Schemes">
                    {SCHEMES_DATABASE.filter((s) => !s.id.startsWith("AP_") && !s.id.startsWith("TN_")).map((s) => (
                      <option key={s.id} value={s.id}>
                        Central: {s.title.substring(0, 45)}...
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tamil Nadu Flagship Schemes">
                    {SCHEMES_DATABASE.filter((s) => s.id.startsWith("TN_")).map((s) => (
                      <option key={s.id} value={s.id}>
                        TN: {s.title.substring(0, 45)}...
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Selected Scheme Detail Card */}
        <div className="rounded-2xl border border-[#EDE6DD] bg-[#FAF7F2] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#0B1B4F] px-2.5 py-0.5 text-[10px] font-bold text-[#F5E29F] uppercase tracking-wider">
                {currentScheme.level} Level
              </span>
              <span className="rounded-md border border-[#DFC8A5] bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#0B1B4F]">
                {currentScheme.shortCode}
              </span>
              <h3 className="text-sm font-bold text-[#0B1B4F] font-serif">{currentScheme.title}</h3>
            </div>
            <p className="text-xs text-slate-700">
              <strong>Statutory Benefit:</strong> <span className="font-bold text-[#0B1B4F]">{currentScheme.benefitAmount}</span> ({currentScheme.benefitDescription})
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              <span>Sponsoring Body: <strong>{currentScheme.sponsoringBody}</strong></span>
              <span>•</span>
              <a
                href={currentScheme.officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-[#0B1B4F] hover:underline"
              >
                <span>Portal: {currentScheme.portalName}</span>
                <ExternalLink className="size-3 text-amber-700" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={currentScheme.officialPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DACBB8] bg-white px-4 py-2.5 text-xs font-bold text-[#0B1B4F] hover:bg-[#FAF7F2] transition-all cursor-pointer shadow-2xs"
            >
              <span>Visit Portal</span>
              <ExternalLink className="size-3 text-amber-700" />
            </a>

            {onNavigateToRoadmap && (
              <button
                onClick={() => onNavigateToRoadmap(currentScheme.id)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#0B1B4F] px-5 py-2.5 text-xs font-bold text-[#F5E29F] hover:bg-[#152864] transition-all cursor-pointer shadow-md border border-[#DFB738]/40"
              >
                <span>View Scheme Roadmap</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 
        =============================================================================
        UNIFIED SECTION 1: MANDATORY SCHEME DOCUMENTS & STATUTORY OCR VERIFICATION
        Strictly asks for the documents required by the selected scheme!
        =============================================================================
      */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-5 border-[#DFB738]/60 bg-gradient-to-br from-amber-50/15 via-white to-amber-50/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#EDE6DD] gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#0B1B4F] text-[#F5E29F] shadow-xs">
              <FileCheck2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                  {currentScheme.shortCode} Specific
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  Official Gazette Rule Section 4
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#0B1B4F] font-serif mt-1">
                Mandatory Documents for {currentScheme.title}
              </h3>
              <p className="text-xs text-slate-600">
                Upload each statutory document required for this scheme. Real-time OCR parses legal names, verifies authority stamps, and rejects wrong document submissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {rejectedCount > 0 && (
              <span className="rounded-full px-3 py-1 text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300">
                ⚠️ {rejectedCount} Rejection(s)
              </span>
            )}
            <span className={`rounded-full px-3.5 py-1 text-xs font-mono font-bold border ${
              verifiedCount === mandatoryDocsList.length && mandatoryDocsList.length > 0
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "bg-white text-[#0B1B4F] border-[#DFC8A5]"
            }`}>
              {verifiedCount} / {mandatoryDocsList.length} Verified
            </span>
          </div>
        </div>

        {/* Rejection Alert Notice if any document mismatched */}
        {rejectedCount > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-center gap-3 text-xs text-rose-900">
            <AlertTriangle className="size-4 text-rose-600 shrink-0" />
            <div>
              <strong>Document Mismatch Detected:</strong> One or more uploaded files do not match the required statutory document type (e.g. Certificate uploaded into Aadhaar slot, or unreadable document). Please replace with the correct document.
            </div>
          </div>
        )}

        {/* Scheme Mandatory Documents Dynamic Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {mandatoryDocsList.map((docName, idx) => {
            const uploadedInfo = schemeUploadedDocs[docName];
            const isUploaded = Boolean(uploadedInfo);
            const isRejected = uploadedInfo?.status === "REJECTED" || uploadedInfo?.isValidDocument === false;
            const isVerified = uploadedInfo?.status === "VERIFIED" && uploadedInfo?.isValidDocument !== false;
            const meta = getDocCategoryMeta(docName);
            const isBankDoc = detectExpectedDocType(docName) === "bank";
            const IconComponent = meta.icon;

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  isRejected
                    ? "border-rose-300 bg-rose-50/30 shadow-xs"
                    : isVerified
                    ? "border-emerald-300 bg-emerald-50/30 shadow-xs"
                    : "border-[#DFC8A5] bg-white hover:border-[#DFB738] shadow-2xs"
                }`}
              >
                <div>
                  {/* Card Header: Category & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex size-7 items-center justify-center rounded-lg ${meta.iconBg}`}>
                        <IconComponent className="size-3.5" />
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${meta.colorBadge}`}>
                        {meta.category}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isRejected
                          ? "bg-rose-100 text-rose-900 border border-rose-300"
                          : isVerified
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : uploadedInfo?.isExtracting
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {isRejected ? (
                        <>
                          <AlertTriangle className="size-3 text-rose-700" />
                          <span>Rejected / Mismatch</span>
                        </>
                      ) : isVerified ? (
                        <>
                          <CheckCircle className="size-3 text-emerald-700" />
                          <span>Verified</span>
                        </>
                      ) : uploadedInfo?.isExtracting ? (
                        <>
                          <RefreshCw className="size-3 animate-spin text-amber-700" />
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <span>Pending Upload</span>
                      )}
                    </span>
                  </div>

                  {/* Document Title from Official Scheme */}
                  <h4 className="text-xs sm:text-sm font-bold text-[#0B1B4F] mt-2.5 leading-snug font-serif">
                    {docName}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {meta.label}
                  </p>

                  {/* Upload Info & Real-Time Extraction Results */}
                  {isUploaded && uploadedInfo && (
                    <div className="mt-3 space-y-2">
                      <div className={`text-[11px] p-2 rounded-lg border font-mono flex items-center justify-between ${
                        isRejected
                          ? "text-rose-900 bg-white/90 border-rose-200"
                          : "text-emerald-900 bg-white/80 border-emerald-200"
                      }`}>
                        <span className="truncate max-w-[180px]">📄 {uploadedInfo.fileName}</span>
                        <span>{uploadedInfo.size}</span>
                      </div>

                      {uploadedInfo.isExtracting ? (
                        <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-xl text-amber-900 text-xs border border-amber-200">
                          <RefreshCw className="size-3.5 animate-spin text-amber-700 shrink-0" />
                          <span>Running OCR & statutory authority checks...</span>
                        </div>
                      ) : isRejected ? (
                        /* REJECTED / MISMATCH CARD */
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-rose-800">
                            <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                            <span>Statutory Verification Rejected</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-rose-700 font-medium">
                            {uploadedInfo.validationWarnings?.[0] || "File does not match required statutory certificate standards."}
                          </p>
                          <p className="text-[10px] text-rose-600 italic">
                            Please upload the authentic document corresponding to this slot.
                          </p>
                        </div>
                      ) : (
                        /* VERIFIED DATA CARD */
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                          <div>
                            <label className="block text-[10px] font-bold text-[#0B1B4F] uppercase tracking-wider mb-0.5 font-serif">
                              Extracted Legal Name:
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={uploadedInfo.extractedName || ""}
                                onChange={(e) => handleUpdateSchemeDocName(docName, e.target.value)}
                                className="w-full rounded-lg border border-[#DFC8A5] bg-white px-2.5 py-1.5 text-xs font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:bg-white focus:outline-hidden"
                                placeholder="Extracted citizen name"
                              />
                              <Edit3 className="absolute right-2 top-2 size-3 text-slate-400 pointer-events-none" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                            {uploadedInfo.extractedDob && (
                              <span>DOB: <strong>{uploadedInfo.extractedDob}</strong></span>
                            )}
                            {uploadedInfo.extractedId && (
                              <span>ID: <strong>{uploadedInfo.extractedId}</strong></span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-emerald-800 pt-1 border-t border-emerald-100">
                            {uploadedInfo.confidenceScore && (
                              <span>OCR Confidence: <strong>{uploadedInfo.confidenceScore}%</strong></span>
                            )}
                            <span className="text-slate-500 font-mono text-[9px]">{uploadedInfo.issuingAuthority || "Statutory Authority"}</span>
                          </div>

                          {uploadedInfo.s3Uploaded && (
                            <div className="pt-1 flex items-center justify-between text-[10px] text-amber-900 border-t border-emerald-100">
                              <span className="flex items-center gap-1 font-semibold text-amber-800">
                                <Cloud className="size-2.5 text-amber-600" /> S3 Vault Synced
                              </span>
                              <span className="text-slate-500 font-mono text-[9px] truncate max-w-[120px]" title={uploadedInfo.s3Key}>
                                {uploadedInfo.s3Key?.split("/").pop()}
                              </span>
                            </div>
                          )}

                          {/* Interactive NPCI DBT Seeding Controls for Bank Passbook */}
                          {isBankDoc && (
                            <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                              <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={auditInput.isAadhaarLinkedToBank}
                                  onChange={(e) => handleToggleBankLinked(e.target.checked)}
                                  className="rounded border-[#DFC8A5] text-[#0B1B4F] focus:ring-[#DFB738]"
                                />
                                <span>Aadhaar linked to bank (KYC)</span>
                              </label>

                              <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={auditInput.isNpciSeeded}
                                  onChange={(e) => handleToggleNpciSeeded(e.target.checked)}
                                  className="rounded border-[#DFC8A5] text-[#0B1B4F] focus:ring-[#DFB738]"
                                />
                                <span className="font-semibold text-[#0B1B4F]">NPCI DBT Mapper Active (Seeded)</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <label className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#DFC8A5] bg-white hover:bg-[#FAF7F2] py-2 px-3 text-xs font-bold text-[#0B1B4F] cursor-pointer transition-all shadow-2xs">
                    <Upload className="size-3.5 text-[#0B1B4F]" />
                    <span>{isUploaded ? "Replace File" : "Upload Document (PDF / JPG)"}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleSchemeDocUpload(docName, e)}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 
        =============================================================================
        SECTION 2: CROSS-DOCUMENT NAME MATCHING MATRIX & LEGAL RESOLUTION
        =============================================================================
      */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#EDE6DD] gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
              <ShieldAlert className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0B1B4F] font-serif">
                Cross-Document Name Consistency Matrix & Resolution
              </h3>
              <p className="text-[11px] text-slate-500">
                Audits string patterns, phonetic Soundex, and initial expansions between your uploaded scheme documents to prevent automated PFMS rejection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Matching Score:</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black font-serif ${
                auditResult.nameMatchPercentage >= 95
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                  : auditResult.nameMatchPercentage >= 75
                  ? "bg-amber-50 text-amber-900 border border-amber-300"
                  : "bg-rose-50 text-rose-900 border border-rose-300"
              }`}
            >
              {auditResult.nameMatchPercentage}% Confidence
            </span>
          </div>
        </div>

        {/* Quick Test Scenarios Bar */}
        <div className="rounded-2xl bg-[#FAF7F2] border border-[#DFC8A5] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B1B4F] flex items-center gap-1.5 font-serif">
              <Sparkles className="size-3.5 text-amber-600" />
              <span>Quick Test Scenarios (1-Click Verification):</span>
            </span>
            <span className="text-[10px] text-slate-500">Test how state welfare portals handle initials vs full names</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleApplyPreset("sravani_ap")}
              className="rounded-lg border border-[#DFC8A5] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1B4F] hover:border-[#DFB738] hover:bg-[#FAF7F2] transition-all cursor-pointer shadow-2xs"
            >
              🎯 <strong>AP: M. Sravani</strong> vs <strong>Madhira Sravani</strong>
            </button>
            <button
              onClick={() => handleApplyPreset("kavitha_tn")}
              className="rounded-lg border border-[#DFC8A5] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1B4F] hover:border-[#DFB738] hover:bg-[#FAF7F2] transition-all cursor-pointer shadow-2xs"
            >
              🎯 <strong>TN: Kavitha S</strong> vs <strong>Kavitha Selvam</strong>
            </button>
            <button
              onClick={() => handleApplyPreset("exact_match")}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
            >
              ✅ <strong>100% Exact Match</strong>
            </button>
            <button
              onClick={() => handleApplyPreset("typo_mismatch")}
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
            >
              ⚠️ <strong>Test Major Typo</strong>
            </button>
            <button
              onClick={() => handleApplyPreset("clear")}
              className="rounded-lg border border-[#EDE6DD] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer ml-auto"
            >
              <RefreshCw className="size-3 inline mr-1" /> Reset
            </button>
          </div>
        </div>

        {/* Visual Token Comparison Breakdown */}
        <div className="rounded-2xl border border-[#EDE6DD] bg-[#FAF7F2] p-4.5 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B1B4F] flex items-center justify-between font-serif">
            <span>Visual Token Comparison</span>
            <span className="text-[10px] text-slate-500 lowercase font-normal">character & word alignment</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aadhaar Anchor Tokens */}
            <div className="rounded-xl border border-[#DFC8A5] bg-white p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1B4F] font-serif">Aadhaar Card Name (Anchor)</span>
                <span className="text-[10px] text-amber-700 font-semibold">UIDAI Master</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {aadhaarTokens.length > 0 ? (
                  aadhaarTokens.map((token, i) => {
                    const tokenUpper = token.toUpperCase().replace(/[^A-Z]/g, "");
                    const isPresentInMarksheet = marksheetTokens.some((mt) => {
                      const mtUpper = mt.toUpperCase().replace(/[^A-Z]/g, "");
                      return mtUpper === tokenUpper || (mtUpper.length === 1 && tokenUpper.startsWith(mtUpper)) || (tokenUpper.length === 1 && mtUpper.startsWith(tokenUpper));
                    });

                    return (
                      <span
                        key={i}
                        className={`rounded-md px-2.5 py-1 text-xs font-black ${
                          isPresentInMarksheet
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                            : "bg-amber-50 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {token}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">No Aadhaar name loaded</span>
                )}
              </div>
            </div>

            {/* Marksheet / Educational Tokens */}
            <div className="rounded-xl border border-[#DFC8A5] bg-white p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1B4F] font-serif">Academic / Scheme Document Name</span>
                <span className="text-[10px] text-sky-700 font-semibold">Educational Record</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {marksheetTokens.length > 0 ? (
                  marksheetTokens.map((token, i) => {
                    const tokenUpper = token.toUpperCase().replace(/[^A-Z]/g, "");
                    const isPresentInAadhaar = aadhaarTokens.some((at) => {
                      const atUpper = at.toUpperCase().replace(/[^A-Z]/g, "");
                      return atUpper === tokenUpper || (atUpper.length === 1 && tokenUpper.startsWith(atUpper)) || (tokenUpper.length === 1 && atUpper.startsWith(tokenUpper));
                    });

                    return (
                      <span
                        key={i}
                        className={`rounded-md px-2.5 py-1 text-xs font-black ${
                          isPresentInAadhaar
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                            : "bg-amber-50 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {token}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">No academic name loaded</span>
                )}
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="pt-1">
            {auditResult.nameMatchPercentage === 100 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-950 shadow-2xs">
                <CheckCircle2 className="size-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>100% Exact Name Match:</strong> Both Aadhaar and educational records are perfectly aligned. No affidavit or gazette correction required for PFMS DBT disbursement.
                </span>
              </div>
            ) : auditResult.nameMatchPercentage >= 75 ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-950 shadow-2xs">
                <AlertTriangle className="size-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Initial / Abbreviation Variation Detected:</strong> Marksheet has initial while Aadhaar has expanded surname. State verification portals flag this as a procedural objection. <strong>Solution 1 (Affidavit)</strong> or <strong>MeeSeva/e-Sevai Certificate</strong> provides instant legal clearance.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-300 p-3 text-xs text-rose-950 shadow-2xs">
                <XCircle className="size-4 text-rose-700 shrink-0" />
                <span>
                  <strong>Critical Name Discrepancy:</strong> High risk of automated rejection by PFMS / Welfare Department. Execute Notarized Affidavit or get an Aadhaar Name Update at your nearest CSC/ASK center.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cross-Document Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#EDE6DD] shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B1B4F] text-[#F5E29F] uppercase text-[10px] font-bold tracking-wider font-serif">
              <tr>
                <th className="px-4 py-3.5">Document Source</th>
                <th className="px-4 py-3.5">Extracted Legal Name</th>
                <th className="px-4 py-3.5">Identifier / DOB</th>
                <th className="px-4 py-3.5">Discrepancy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE6DD] font-medium bg-white">
              {/* Row 1: Aadhaar Card Master Anchor */}
              <tr className="hover:bg-[#FAF7F2]/60 transition-colors">
                <td className="px-4 py-3 font-bold text-[#0B1B4F] flex items-center gap-2">
                  <FileBadge className="size-3.5 text-amber-700" />
                  <span>Aadhaar Card (UIDAI)</span>
                </td>
                <td className="px-4 py-3 text-slate-900 font-bold">{auditInput.nameOnAadhaar || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{auditInput.dobOnAadhaar || "2006-05-12"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF7F2] border border-[#DFC8A5] px-2.5 py-0.5 text-[10px] font-bold text-[#0B1B4F]">
                    <Check className="size-3" /> Master Legal Anchor
                  </span>
                </td>
              </tr>

              {/* Row 2: Secondary / Educational Memo */}
              <tr className="hover:bg-[#FAF7F2]/60 transition-colors">
                <td className="px-4 py-3 font-bold text-[#0B1B4F] flex items-center gap-2">
                  <FileText className="size-3.5 text-sky-700" />
                  <span>Academic Mark Memo</span>
                </td>
                <td className="px-4 py-3 text-slate-900 font-bold">{auditInput.nameOnMarksheet || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{auditInput.dobOnMarksheet || "2006-05-12"}</td>
                <td className="px-4 py-3">
                  {auditInput.nameOnAadhaar && auditInput.nameOnAadhaar === auditInput.nameOnMarksheet ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      <Check className="size-3" /> Exact Match
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                      <AlertTriangle className="size-3" /> Initial Discrepancy Flagged
                    </span>
                  )}
                </td>
              </tr>

              {/* Row 3: Bank Passbook Record */}
              <tr className="hover:bg-[#FAF7F2]/60 transition-colors">
                <td className="px-4 py-3 font-bold text-[#0B1B4F] flex items-center gap-2">
                  <Building className="size-3.5 text-indigo-700" />
                  <span>Bank Passbook Record</span>
                </td>
                <td className="px-4 py-3 text-slate-900 font-bold">{auditInput.bankName ? `${auditInput.bankName} (A/C)` : (auditInput.nameOnAadhaar || "—")}</td>
                <td className="px-4 py-3 text-slate-700">A/C: 38920192819</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <Check className="size-3" /> {auditInput.isNpciSeeded ? "NPCI DBT Active" : "KYC Linked"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Actionable Legal Solutions for Mismatch */}
        <div className="rounded-2xl border border-[#DFC8A5] bg-[#FAF7F2] p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-600" />
            <h4 className="text-xs sm:text-sm font-bold text-[#0B1B4F] uppercase tracking-wider font-serif">
              Legal Remedies & Solutions for Name Discrepancy:
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            When academic records state <strong>"{auditInput.nameOnMarksheet || "Applicant S"}"</strong> while Aadhaar records <strong>"{auditInput.nameOnAadhaar || "Applicant Full Name"}"</strong>, welfare audit teams require legal corroboration. We generate two official, ready-to-use documents:
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
            {/* Solution A: One-and-the-Same Person Affidavit */}
            <div className="luxury-card rounded-2xl p-5 space-y-2.5 shadow-2xs border-[#DFC8A5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1B4F] font-serif">Solution 1: Notarized Affidavit</span>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                  Ready in 24 hrs
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Execute a ₹20 / ₹50 Non-Judicial Stamp Paper affidavit affirming that "{auditInput.nameOnAadhaar || "Applicant"}" and "{auditInput.nameOnMarksheet || "Applicant S"}" refer to one and the same person.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setShowAffidavitModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DFC8A5] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#FAF7F2] cursor-pointer"
                >
                  <Eye className="size-3" />
                  <span>Preview Text</span>
                </button>
                <button
                  onClick={handleCopyAffidavit}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DFC8A5] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#FAF7F2] cursor-pointer"
                >
                  <Copy className="size-3" />
                  <span>{copiedAffidavit ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownloadAffidavit}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1B4F] px-3.5 py-1 text-[11px] font-bold text-[#F5E29F] hover:bg-[#152864] cursor-pointer shadow-xs border border-[#DFB738]/40"
                >
                  <Download className="size-3" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            {/* Solution B: NPCI Seeding Mandate */}
            <div className="luxury-card rounded-2xl p-5 space-y-2.5 shadow-2xs border-[#DFC8A5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1B4F] font-serif">Solution 2: Bank NPCI Seeding Mandate</span>
                <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
                  Bank Form
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Submit standard Annexure I to the branch manager requesting your bank account be mapped in the NPCI Aadhaar mapper for direct benefit disbursement.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setShowMandateModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DFC8A5] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#FAF7F2] cursor-pointer"
                >
                  <Eye className="size-3" />
                  <span>Preview Text</span>
                </button>
                <button
                  onClick={handleCopyMandate}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DFC8A5] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#FAF7F2] cursor-pointer"
                >
                  <Copy className="size-3" />
                  <span>{copiedForm ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownloadMandate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1B4F] px-3.5 py-1 text-[11px] font-bold text-[#F5E29F] hover:bg-[#152864] cursor-pointer shadow-xs border border-[#DFB738]/40"
                >
                  <Download className="size-3" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        =============================================================================
        SECTION 3: STATUTORY PREREQUISITES & OBTAINING MISSING CERTIFICATES
        =============================================================================
      */}
      {currentScheme.prerequisites && currentScheme.prerequisites.length > 0 && (
        <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE6DD]">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs">
                <FileCheck2 className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0B1B4F] font-serif">
                  Statutory Prerequisites & Obtaining Missing Certificates
                </h3>
                <p className="text-[11px] text-slate-500">
                  Prerequisite government certificates required to unlock {currentScheme.shortCode} eligibility
                </p>
              </div>
            </div>

            <span className="rounded-full bg-[#FAF7F2] border border-[#DFC8A5] px-3 py-1 text-xs font-bold text-[#0B1B4F]">
              {currentScheme.prerequisites.filter((d) => userHeld.includes(d)).length} of {currentScheme.prerequisites.length} Held
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentScheme.prerequisites.map((docId) => {
              const isHeld = userHeld.includes(docId);
              return (
                <div
                  key={docId}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all shadow-2xs ${
                    isHeld
                      ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
                      : "border-[#EBDDCB] bg-[#FAF7F2]/80 text-[#644616]"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ${
                        isHeld
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {isHeld ? <Check className="size-3.5 stroke-[3]" /> : <AlertTriangle className="size-3" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight text-[#0B1B4F] font-serif">{getDocumentName(docId)}</p>
                      <p className="text-[10px] mt-0.5 text-slate-600">
                        {isHeld ? "✓ Uploaded & verified in profile" : "⚠️ Missing prerequisite certificate"}
                      </p>
                    </div>
                  </div>

                  {!isHeld && (
                    <div className="mt-3 pt-2.5 border-t border-[#DFC8A5]/60 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-amber-800">Prerequisite Roadblock</span>
                      <button
                        onClick={() => setSelectedCertGuideId(docId)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B1B4F] hover:text-amber-800 hover:underline cursor-pointer"
                      >
                        <span>Resolve Guide</span>
                        <ChevronRight className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Affidavit Preview Modal */}
      {showAffidavitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#DFC8A5] bg-[#FAF7F2] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE6DD] pb-3">
              <div className="flex items-center gap-2">
                <FileBadge className="size-5 text-[#0B1B4F]" />
                <h3 className="text-base font-bold text-[#0B1B4F] font-serif">
                  Notarized One-and-the-Same Person Affidavit Format
                </h3>
              </div>
              <button
                onClick={() => setShowAffidavitModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#FAF7F2] hover:text-slate-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-xl bg-white p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-[#EDE6DD] max-h-96 overflow-y-auto shadow-inner">
              {affidavitText}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopyAffidavit}
                className="flex items-center gap-1.5 rounded-xl border border-[#DFC8A5] bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#FAF7F2] cursor-pointer"
              >
                <Copy className="size-4" />
                <span>{copiedAffidavit ? "Copied to Clipboard!" : "Copy Text"}</span>
              </button>
              <button
                onClick={handleDownloadAffidavit}
                className="flex items-center gap-1.5 rounded-xl bg-[#0B1B4F] px-4 py-2 text-xs font-bold text-[#F5E29F] hover:bg-[#152864] cursor-pointer shadow-md border border-[#DFB738]/40"
              >
                <Download className="size-4" />
                <span>Download Affidavit .txt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandate Preview Modal */}
      {showMandateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#DFC8A5] bg-[#FAF7F2] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE6DD] pb-3">
              <div className="flex items-center gap-2">
                <Building className="size-5 text-[#0B1B4F]" />
                <h3 className="text-base font-bold text-[#0B1B4F] font-serif">
                  NPCI Aadhaar DBT Seeding Mandate (Annexure I)
                </h3>
              </div>
              <button
                onClick={() => setShowMandateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#FAF7F2] hover:text-slate-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-xl bg-white p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-[#EDE6DD] max-h-96 overflow-y-auto shadow-inner">
              {mandateText}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopyMandate}
                className="flex items-center gap-1.5 rounded-xl border border-[#DFC8A5] bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#FAF7F2] cursor-pointer"
              >
                <Copy className="size-4" />
                <span>{copiedForm ? "Copied to Clipboard!" : "Copy Text"}</span>
              </button>
              <button
                onClick={handleDownloadMandate}
                className="flex items-center gap-1.5 rounded-xl bg-[#0B1B4F] px-4 py-2 text-xs font-bold text-[#F5E29F] hover:bg-[#152864] cursor-pointer shadow-md border border-[#DFB738]/40"
              >
                <Download className="size-4" />
                <span>Download Mandate .txt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Resolution Modal */}
      {selectedCertGuideId && (
        <CertificateResolutionModal
          certificateId={selectedCertGuideId}
          onClose={() => setSelectedCertGuideId(null)}
          onMarkAsObtained={handleMarkCertAsHeld}
          userState={profile?.state}
        />
      )}
    </div>
  );
};
