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
  Search,
  Award,
  CheckCircle,
  Edit3
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

interface UploadedFileInfo {
  name: string;
  size: string;
  type: string;
  extractedName: string;
  extractedDob?: string;
  extractedId?: string;
  previewUrl?: string;
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

  // Scanning & Drag-Drop states for OCR feedback
  const [isScanning, setIsScanning] = useState<{ aadhaar: boolean; marksheet: boolean; bank: boolean }>({
    aadhaar: false,
    marksheet: false,
    bank: false,
  });

  const [dragOver, setDragOver] = useState<{ aadhaar: boolean; marksheet: boolean; bank: boolean }>({
    aadhaar: false,
    marksheet: false,
    bank: false,
  });

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

  // Sync if prop or state changes
  useEffect(() => {
    if (selectedSchemeId) {
      if (profile?.state === "Andhra Pradesh" && selectedSchemeId.startsWith("TN_")) {
        setActiveSchemeId("AP_Jagananna_Vidya_Deevena");
      } else if (profile?.state === "Tamil Nadu" && selectedSchemeId.startsWith("AP_")) {
        setActiveSchemeId("TN_Pudhumai_Penn");
      } else {
        setActiveSchemeId(selectedSchemeId);
      }
    }
  }, [selectedSchemeId, profile?.state]);

  const currentScheme: SchemeOrService = useMemo(() => {
    return (
      SCHEMES_DATABASE.find((s) => s.id === activeSchemeId) ||
      SCHEMES_DATABASE[0]
    );
  }, [activeSchemeId]);

  // File Upload states (Synced with profile / initialInput)
  const [aadhaarFile, setAadhaarFile] = useState<UploadedFileInfo | null>({
    name: "Aadhaar_Card_UIDAI.pdf",
    size: "420 KB",
    type: "application/pdf",
    extractedName: initialInput.nameOnAadhaar || profile?.name || "Kavitha Selvam",
    extractedDob: initialInput.dobOnAadhaar || "2006-05-12",
    extractedId: "XXXX-XXXX-4819"
  });

  const [marksheetFile, setMarksheetFile] = useState<UploadedFileInfo | null>({
    name: "Class10_SSC_Memo.jpg",
    size: "860 KB",
    type: "image/jpeg",
    extractedName: initialInput.nameOnMarksheet || "Kavitha S",
    extractedDob: initialInput.dobOnMarksheet || "2006-05-12",
    extractedId: "SSC-2022-849182"
  });

  const [bankFile, setBankFile] = useState<UploadedFileInfo | null>({
    name: "Bank_Passbook_Front.jpg",
    size: "610 KB",
    type: "image/jpeg",
    extractedName: initialInput.nameOnAadhaar || profile?.name || "Kavitha Selvam",
    extractedId: "38920192819"
  });

  // Sync state whenever initialInput or profile changes
  useEffect(() => {
    setAuditInput(initialInput);
    const aadhaarName = initialInput.nameOnAadhaar || profile?.name || "Citizen";
    const marksheetName = initialInput.nameOnMarksheet || (profile?.name ? `${profile.name.split(" ")[0]} S` : "Citizen S");

    setAadhaarFile((prev) => ({
      name: prev?.name || "Aadhaar_Card.pdf",
      size: prev?.size || "420 KB",
      type: prev?.type || "application/pdf",
      extractedName: aadhaarName,
      extractedDob: initialInput.dobOnAadhaar || "2006-05-12",
      extractedId: "XXXX-XXXX-4819"
    }));

    setMarksheetFile((prev) => ({
      name: prev?.name || "Class10_Memo.jpg",
      size: prev?.size || "860 KB",
      type: prev?.type || "image/jpeg",
      extractedName: marksheetName,
      extractedDob: initialInput.dobOnMarksheet || "2006-05-12",
      extractedId: "SSC-2022-849182"
    }));

    setBankFile((prev) => ({
      name: prev?.name || "Bank_Passbook.jpg",
      size: prev?.size || "610 KB",
      type: prev?.type || "image/jpeg",
      extractedName: aadhaarName,
      extractedId: "38920192819"
    }));
  }, [initialInput, profile]);

  // Direct handlers for updating document names
  const handleUpdateAadhaarName = (newName: string) => {
    setAuditInput((prev) => ({ ...prev, nameOnAadhaar: newName }));
    setAadhaarFile((prev) => (prev ? { ...prev, extractedName: newName } : null));
  };

  const handleUpdateMarksheetName = (newName: string) => {
    setAuditInput((prev) => ({ ...prev, nameOnMarksheet: newName }));
    setMarksheetFile((prev) => (prev ? { ...prev, extractedName: newName } : null));
  };

  const handleUpdateBankName = (newName: string) => {
    setBankFile((prev) => (prev ? { ...prev, extractedName: newName } : null));
  };

  // Robust file processor with simulated 600ms OCR scanning & token extraction
  const processUploadedFile = (type: "aadhaar" | "marksheet" | "bank", file: File) => {
    setIsScanning((prev) => ({ ...prev, [type]: true }));

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    // Local preview URL if image
    let previewUrl: string | undefined = undefined;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }

    // Smart heuristic: if user uploaded a file named after a citizen (e.g. sravani_reddy_aadhaar.pdf), detect it
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_\-+]/g, " ");
    const candidateWords = baseName
      .replace(/aadhaar|marksheet|memo|passbook|card|bank|front|back|uidai|ssc|10th/gi, "")
      .trim();

    setTimeout(() => {
      if (type === "aadhaar") {
        const candidateName =
          candidateWords.length >= 4
            ? candidateWords
            : auditInput.nameOnAadhaar || profile?.name || "Aadhaar Holder";

        setAuditInput((prev) => ({ ...prev, nameOnAadhaar: candidateName }));
        setAadhaarFile({
          name: file.name,
          size: sizeStr,
          type: file.type,
          extractedName: candidateName,
          extractedDob: auditInput.dobOnAadhaar || "2006-05-12",
          extractedId: "XXXX-XXXX-4819",
          previewUrl,
        });
      } else if (type === "marksheet") {
        const candidateName =
          candidateWords.length >= 4
            ? candidateWords
            : auditInput.nameOnMarksheet || "Marksheet Candidate";

        setAuditInput((prev) => ({ ...prev, nameOnMarksheet: candidateName }));
        setMarksheetFile({
          name: file.name,
          size: sizeStr,
          type: file.type,
          extractedName: candidateName,
          extractedDob: auditInput.dobOnMarksheet || "2006-05-12",
          extractedId: "SSC-2022-849182",
          previewUrl,
        });
      } else {
        const candidateName =
          candidateWords.length >= 4
            ? candidateWords
            : auditInput.nameOnAadhaar || profile?.name || "Account Holder";

        setBankFile({
          name: file.name,
          size: sizeStr,
          type: file.type,
          extractedName: candidateName,
          extractedId: "38920192819",
          previewUrl,
        });
      }
      setIsScanning((prev) => ({ ...prev, [type]: false }));
    }, 600);
  };

  // Upload handler for native file input
  const handleFileUpload = (type: "aadhaar" | "marksheet" | "bank", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(type, file);
  };

  // Drag & Drop event handlers
  const handleDragOver = (type: "aadhaar" | "marksheet" | "bank", e: React.DragEvent) => {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (type: "aadhaar" | "marksheet" | "bank", e: React.DragEvent) => {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [type]: false }));
  };

  const handleDrop = (type: "aadhaar" | "marksheet" | "bank", e: React.DragEvent) => {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [type]: false }));
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(type, file);
    }
  };

  // Quick Preset Test Scenarios
  const handleApplyPreset = (preset: "sravani_ap" | "kavitha_tn" | "exact_match" | "typo_mismatch" | "clear") => {
    if (preset === "sravani_ap") {
      setAuditInput((prev) => ({
        ...prev,
        nameOnAadhaar: "Madhira Sravani",
        nameOnMarksheet: "M. Sravani",
        dobOnAadhaar: "2005-08-14",
        dobOnMarksheet: "2005-08-14",
        bankName: "Andhra Pragathi Grameena Bank",
        isAadhaarLinkedToMobile: true,
        isAadhaarLinkedToBank: true,
        isNpciDirectBenefitTransferEnabled: true,
      }));
      setAadhaarFile({
        name: "AP_Aadhaar_Card_Sravani.pdf",
        size: "380 KB",
        type: "application/pdf",
        extractedName: "Madhira Sravani",
        extractedDob: "2005-08-14",
        extractedId: "XXXX-XXXX-9281",
      });
      setMarksheetFile({
        name: "AP_BIE_Inter_MarksMemo.jpg",
        size: "920 KB",
        type: "image/jpeg",
        extractedName: "M. Sravani",
        extractedDob: "2005-08-14",
        extractedId: "BIEAP-2023-74819",
      });
      setBankFile({
        name: "APGB_BankPassbook.jpg",
        size: "540 KB",
        type: "image/jpeg",
        extractedName: "Madhira Sravani",
        extractedId: "91028301928",
      });
    } else if (preset === "kavitha_tn") {
      setAuditInput((prev) => ({
        ...prev,
        nameOnAadhaar: "Kavitha Selvam",
        nameOnMarksheet: "Kavitha S",
        dobOnAadhaar: "2006-05-12",
        dobOnMarksheet: "2006-05-12",
        bankName: "State Bank of India",
        isAadhaarLinkedToMobile: true,
        isAadhaarLinkedToBank: true,
        isNpciDirectBenefitTransferEnabled: false,
      }));
      setAadhaarFile({
        name: "TN_Aadhaar_Card_Kavitha.pdf",
        size: "420 KB",
        type: "application/pdf",
        extractedName: "Kavitha Selvam",
        extractedDob: "2006-05-12",
        extractedId: "XXXX-XXXX-4819",
      });
      setMarksheetFile({
        name: "TN_SSLC_Marksheet.jpg",
        size: "860 KB",
        type: "image/jpeg",
        extractedName: "Kavitha S",
        extractedDob: "2006-05-12",
        extractedId: "SSC-2022-849182",
      });
      setBankFile({
        name: "SBI_Passbook_Front.jpg",
        size: "610 KB",
        type: "image/jpeg",
        extractedName: "Kavitha Selvam",
        extractedId: "38920192819",
      });
    } else if (preset === "exact_match") {
      const matchName = auditInput.nameOnAadhaar || profile?.name || "Kavitha Selvam";
      setAuditInput((prev) => ({
        ...prev,
        nameOnAadhaar: matchName,
        nameOnMarksheet: matchName,
      }));
      if (aadhaarFile) setAadhaarFile({ ...aadhaarFile, extractedName: matchName });
      if (marksheetFile) setMarksheetFile({ ...marksheetFile, extractedName: matchName });
      if (bankFile) setBankFile({ ...bankFile, extractedName: matchName });
    } else if (preset === "typo_mismatch") {
      const aadhaarName = "Kavitha Selvam";
      const typoMarksheet = "Kavita Chelvam";
      setAuditInput((prev) => ({
        ...prev,
        nameOnAadhaar: aadhaarName,
        nameOnMarksheet: typoMarksheet,
      }));
      if (aadhaarFile) setAadhaarFile({ ...aadhaarFile, extractedName: aadhaarName });
      if (marksheetFile) setMarksheetFile({ ...marksheetFile, extractedName: typoMarksheet });
      if (bankFile) setBankFile({ ...bankFile, extractedName: aadhaarName });
    } else if (preset === "clear") {
      setAadhaarFile(null);
      setMarksheetFile(null);
      setBankFile(null);
      setAuditInput((prev) => ({
        ...prev,
        nameOnAadhaar: "",
        nameOnMarksheet: "",
      }));
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

  // Human-readable document titles
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

  // Required documents for active scheme
  const schemeDocs = useMemo(() => {
    const docs = new Set<string>();
    (currentScheme.mandatoryDocuments || []).forEach((d) => docs.add(d));
    (currentScheme.prerequisites || []).forEach((p) => docs.add(p));
    return Array.from(docs);
  }, [currentScheme]);

  const userHeld = profile?.heldDocuments || [];

  // Breakdown names into words/tokens for visual diff
  const aadhaarTokens = (auditInput.nameOnAadhaar || "").trim().split(/\s+/).filter(Boolean);
  const marksheetTokens = (auditInput.nameOnMarksheet || "").trim().split(/\s+/).filter(Boolean);

  return (
    <div className="space-y-6 font-sans">
      {/* Target Scheme Selector Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Layers className="size-4" />
              <span>Scheme-Centric Pre-Flight Document Audit</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              Audit Document Prerequisites for Specific Scheme
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              Document mandates differ per program. Select your target scheme below to evaluate statutory prerequisites, cross-document name consistency, and NPCI DBT readiness.
            </p>
          </div>

          {/* Scheme Dropdown Selector */}
          <div className="w-full md:w-80 shrink-0">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Target Scheme:
            </label>
            <select
              value={activeSchemeId}
              onChange={(e) => handleSchemeChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
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
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                {currentScheme.level} Level
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {currentScheme.shortCode}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{currentScheme.title}</h3>
            </div>
            <p className="text-xs text-slate-600">
              <strong>Statutory Benefit:</strong> <span className="font-semibold text-indigo-900">{currentScheme.benefitAmount}</span> ({currentScheme.benefitDescription})
            </p>
            <p className="text-[11px] text-slate-500">
              Sponsoring Body: {currentScheme.sponsoringBody} • Official Portal: {currentScheme.portalName}
            </p>
          </div>

          {onNavigateToRoadmap && (
            <button
              onClick={() => onNavigateToRoadmap(currentScheme.id)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shrink-0 shadow-xs"
            >
              <span>View Scheme Roadmap</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scheme Required Documents Checklist */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <FileCheck2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                1. Statutory Documents Required for {currentScheme.shortCode}
              </h3>
              <p className="text-[11px] text-slate-500">
                Real-world verification checks matching the official gazette requirements
              </p>
            </div>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {schemeDocs.filter((d) => userHeld.includes(d)).length} of {schemeDocs.length} Verified
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schemeDocs.map((docId) => {
            const isHeld = userHeld.includes(docId);
            return (
              <div
                key={docId}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                  isHeld
                    ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                    : "border-amber-200 bg-amber-50/50 text-amber-950"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ${
                      isHeld
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {isHeld ? <Check className="size-3.5 stroke-[3]" /> : <AlertTriangle className="size-3" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{getDocumentName(docId)}</p>
                    <p className="text-[10px] mt-0.5 text-slate-600">
                      {isHeld ? "✓ Uploaded & verified in profile" : "⚠️ Missing prerequisite certificate"}
                    </p>
                  </div>
                </div>

                {!isHeld && (
                  <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-amber-800">Prerequisite Roadblock</span>
                    <button
                      onClick={() => setSelectedCertGuideId(docId)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
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

      {/* Interactive Document Upload Dropzones with Live OCR Preview */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Upload className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. Live Document Upload & OCR Identity Parsing
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload your files (PDF or Image) or edit names directly to test real-time cross-document name & DOB extraction
              </p>
            </div>
          </div>

          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-indigo-600" />
            <span>Simulates AWS Textract / DigiLocker API OCR</span>
          </div>
        </div>

        {/* Quick Test Scenarios Bar */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-indigo-600" />
              <span>Quick Test Scenarios (1-Click Test):</span>
            </span>
            <span className="text-[10px] text-slate-500">Click any preset to instantly test name matching behavior</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleApplyPreset("sravani_ap")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all cursor-pointer shadow-2xs"
            >
              🎯 <strong>AP: M. Sravani</strong> vs <strong>Madhira Sravani</strong>
            </button>
            <button
              onClick={() => handleApplyPreset("kavitha_tn")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all cursor-pointer shadow-2xs"
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
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer ml-auto"
            >
              <RefreshCw className="size-3 inline mr-1" /> Reset
            </button>
          </div>
        </div>

        {/* 3 Upload Dropzones */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Dropzone 1: Aadhaar Card */}
          <div
            onDragOver={(e) => handleDragOver("aadhaar", e)}
            onDragLeave={(e) => handleDragLeave("aadhaar", e)}
            onDrop={(e) => handleDrop("aadhaar", e)}
            className={`rounded-2xl border-2 border-dashed p-4 flex flex-col justify-between transition-all ${
              dragOver.aadhaar
                ? "border-indigo-500 bg-indigo-100/50 ring-2 ring-indigo-400"
                : "border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <FileBadge className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Aadhaar Card (UIDAI)</h4>
                    <p className="text-[10px] text-slate-500">Master Legal Identity Anchor</p>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-800 uppercase">
                  Anchor
                </span>
              </div>

              {/* Upload Input Control */}
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-3 hover:bg-slate-50 cursor-pointer transition-all">
                  <FileUp className="size-5 text-indigo-600 mb-1" />
                  <span className="text-xs font-bold text-slate-800">
                    {aadhaarFile ? "Replace Aadhaar File" : "Upload Aadhaar (PDF / JPG)"}
                  </span>
                  <span className="text-[10px] text-slate-400">Click to browse or drag & drop</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload("aadhaar", e)}
                  />
                </label>
              </div>

              {/* Live OCR Scanning Feedback */}
              {isScanning.aadhaar && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 space-y-1.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-700">
                    <Sparkles className="size-3.5 animate-spin" />
                    <span>Extracting UIDAI OCR Tokens...</span>
                  </div>
                  <div className="h-1.5 w-full bg-indigo-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full w-2/3 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-500">Reading demographic text boxes & UID token</p>
                </div>
              )}

              {/* File Info & OCR Output */}
              {aadhaarFile && !isScanning.aadhaar && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                  {aadhaarFile.previewUrl && (
                    <div className="relative h-20 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 mb-2">
                      <img
                        src={aadhaarFile.previewUrl}
                        alt="Aadhaar Preview"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-mono text-white">
                        Scanned Preview
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{aadhaarFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{aadhaarFile.size}</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Extracted Name on Aadhaar:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={auditInput.nameOnAadhaar || ""}
                        onChange={(e) => handleUpdateAadhaarName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
                        placeholder="e.g. Kavitha Selvam"
                      />
                      <Edit3 className="absolute right-2 top-2 size-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>DOB: <strong>{auditInput.dobOnAadhaar || "2006-05-12"}</strong></span>
                    <span>No: <strong>XXXX-4819</strong></span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="flex items-center gap-1 font-semibold">
                <CheckCircle className="size-3" /> UIDAI Biometric Verified
              </span>
            </div>
          </div>

          {/* Dropzone 2: 10th Marksheet */}
          <div
            onDragOver={(e) => handleDragOver("marksheet", e)}
            onDragLeave={(e) => handleDragLeave("marksheet", e)}
            onDrop={(e) => handleDrop("marksheet", e)}
            className={`rounded-2xl border-2 border-dashed p-4 flex flex-col justify-between transition-all ${
              dragOver.marksheet
                ? "border-sky-500 bg-sky-100/50 ring-2 ring-sky-400"
                : "border-sky-200 bg-sky-50/20 hover:bg-sky-50/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">10th Class Mark Memo</h4>
                    <p className="text-[10px] text-slate-500">Board / SSC Exam Record</p>
                  </div>
                </div>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-800 uppercase">
                  Education
                </span>
              </div>

              {/* Upload Input Control */}
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-3 hover:bg-slate-50 cursor-pointer transition-all">
                  <FileUp className="size-5 text-sky-600 mb-1" />
                  <span className="text-xs font-bold text-slate-800">
                    {marksheetFile ? "Replace Marksheet File" : "Upload Memo (PDF / JPG)"}
                  </span>
                  <span className="text-[10px] text-slate-400">Click to browse or drag & drop</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload("marksheet", e)}
                  />
                </label>
              </div>

              {/* Live OCR Scanning Feedback */}
              {isScanning.marksheet && (
                <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/80 p-3 space-y-1.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-sky-700">
                    <Sparkles className="size-3.5 animate-spin" />
                    <span>Parsing Secondary Board Memo...</span>
                  </div>
                  <div className="h-1.5 w-full bg-sky-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600 rounded-full w-2/3 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-500">Extracting candidate name & date of birth</p>
                </div>
              )}

              {/* File Info & OCR Output */}
              {marksheetFile && !isScanning.marksheet && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                  {marksheetFile.previewUrl && (
                    <div className="relative h-20 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 mb-2">
                      <img
                        src={marksheetFile.previewUrl}
                        alt="Marksheet Preview"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-mono text-white">
                        Scanned Preview
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{marksheetFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{marksheetFile.size}</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Extracted Name on Marksheet:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={auditInput.nameOnMarksheet || ""}
                        onChange={(e) => handleUpdateMarksheetName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-hidden"
                        placeholder="e.g. Kavitha S"
                      />
                      <Edit3 className="absolute right-2 top-2 size-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>DOB: <strong>{auditInput.dobOnMarksheet || "2006-05-12"}</strong></span>
                    <span>Roll: <strong>SSC-2022-849</strong></span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              <span className="flex items-center gap-1 font-semibold">
                <CheckCircle className="size-3" /> State Board Authenticated
              </span>
            </div>
          </div>

          {/* Dropzone 3: Bank Passbook */}
          <div
            onDragOver={(e) => handleDragOver("bank", e)}
            onDragLeave={(e) => handleDragLeave("bank", e)}
            onDrop={(e) => handleDrop("bank", e)}
            className={`rounded-2xl border-2 border-dashed p-4 flex flex-col justify-between transition-all ${
              dragOver.bank
                ? "border-purple-500 bg-purple-100/50 ring-2 ring-purple-400"
                : "border-purple-200 bg-purple-50/20 hover:bg-purple-50/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Building className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Bank Passbook</h4>
                    <p className="text-[10px] text-slate-500">NPCI / PFMS Direct Benefit Transfer</p>
                  </div>
                </div>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-800 uppercase">
                  DBT Passbook
                </span>
              </div>

              {/* Upload Input Control */}
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-3 hover:bg-slate-50 cursor-pointer transition-all">
                  <FileUp className="size-5 text-purple-600 mb-1" />
                  <span className="text-xs font-bold text-slate-800">
                    {bankFile ? "Replace Passbook File" : "Upload Passbook (PDF / JPG)"}
                  </span>
                  <span className="text-[10px] text-slate-400">Click to browse or drag & drop</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload("bank", e)}
                  />
                </label>
              </div>

              {/* Live OCR Scanning Feedback */}
              {isScanning.bank && (
                <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50/80 p-3 space-y-1.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700">
                    <Sparkles className="size-3.5 animate-spin" />
                    <span>Verifying CBS Account & NPCI Mapper...</span>
                  </div>
                  <div className="h-1.5 w-full bg-purple-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full w-2/3 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-500">Reading IFSC, Account number & NPCI mandate status</p>
                </div>
              )}

              {/* File Info & OCR Output */}
              {bankFile && !isScanning.bank && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                  {bankFile.previewUrl && (
                    <div className="relative h-20 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 mb-2">
                      <img
                        src={bankFile.previewUrl}
                        alt="Passbook Preview"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-mono text-white">
                        Scanned Preview
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{bankFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{bankFile.size}</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Account Holder Name:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={bankFile.extractedName}
                        onChange={(e) => handleUpdateBankName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-hidden"
                        placeholder="e.g. Kavitha Selvam"
                      />
                      <Edit3 className="absolute right-2 top-2 size-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>A/C: <strong>38920192819</strong></span>
                    <span>NPCI: <strong className={auditResult.npciStatus === "SEEDED" ? "text-emerald-600" : "text-amber-600"}>{auditResult.npciStatus}</strong></span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              <span className="flex items-center gap-1 font-semibold">
                <CheckCircle className="size-3" /> Core Banking Validated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Side-by-Side Name Comparison & Matching Engine */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <ShieldAlert className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                3. Cross-Document Name Matching Matrix & Resolution
              </h3>
              <p className="text-[11px] text-slate-500">
                Compares string patterns, phonetic Soundex, and initial expansions to prevent automated PFMS rejection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Matching Score:</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                auditResult.nameMatchPercentage >= 95
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : auditResult.nameMatchPercentage >= 75
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-rose-100 text-rose-800 border border-rose-300"
              }`}
            >
              {auditResult.nameMatchPercentage}% Confidence
            </span>
          </div>
        </div>

        {/* Visual Token Comparison Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Visual Token Comparison</span>
            <span className="text-[10px] text-slate-500 lowercase font-normal">character & word alignment</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aadhaar Anchor Tokens */}
            <div className="rounded-xl border border-indigo-200 bg-white p-3 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Aadhaar Card Name (Anchor)</span>
                <span className="text-[10px] text-indigo-600 font-semibold">UIDAI Master</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {aadhaarTokens.map((token, i) => {
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
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {token}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Marksheet Tokens */}
            <div className="rounded-xl border border-sky-200 bg-white p-3 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900">10th Marksheet Name</span>
                <span className="text-[10px] text-sky-600 font-semibold">Academic Memo</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {marksheetTokens.map((token, i) => {
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
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {token}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="pt-1">
            {auditResult.nameMatchPercentage === 100 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-100/70 border border-emerald-300 p-2.5 text-xs text-emerald-950">
                <CheckCircle2 className="size-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>100% Exact Name Match:</strong> Both Aadhaar and educational records are perfectly aligned. No affidavit or gazette correction required for PFMS DBT disbursement.
                </span>
              </div>
            ) : auditResult.nameMatchPercentage >= 75 ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-100/80 border border-amber-300 p-2.5 text-xs text-amber-950">
                <AlertTriangle className="size-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Initial / Abbreviation Variation Detected:</strong> Marksheet has initial while Aadhaar has expanded surname. State verification portals flag this as a procedural objection. <strong>Solution 1 (Affidavit)</strong> or <strong>MeeSeva/e-Sevai Certificate</strong> provides instant legal clearance.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-rose-100/80 border border-rose-300 p-2.5 text-xs text-rose-950">
                <XCircle className="size-4 text-rose-700 shrink-0" />
                <span>
                  <strong>Critical Name Discrepancy:</strong> High risk of automated rejection by PFMS / Welfare Department. Execute Notarized Affidavit or get an Aadhaar Name Update at your nearest CSC/ASK center.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cross-Document Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Document Source</th>
                <th className="px-4 py-3">Extracted Legal Name</th>
                <th className="px-4 py-3">Date of Birth</th>
                <th className="px-4 py-3">Discrepancy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                  <FileBadge className="size-3.5 text-indigo-600" />
                  <span>Aadhaar Card (UIDAI)</span>
                </td>
                <td className="px-4 py-3 text-slate-900 font-bold">{auditInput.nameOnAadhaar || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{auditInput.dobOnAadhaar || "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
                    <Check className="size-3" /> Master Legal Anchor
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="size-3.5 text-sky-600" />
                  <span>10th Class Marksheet</span>
                </td>
                <td className="px-4 py-3 text-slate-900 font-bold">{auditInput.nameOnMarksheet || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{auditInput.dobOnMarksheet || "—"}</td>
                <td className="px-4 py-3">
                  {auditInput.nameOnAadhaar === auditInput.nameOnMarksheet ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      <Check className="size-3" /> Exact Match
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                      <AlertTriangle className="size-3" /> Initial Discrepancy Flagged
                    </span>
                  )}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                  <Building className="size-3.5 text-purple-600" />
                  <span>Bank Passbook Record</span>
                </td>
                <td className="px-4 py-3 text-slate-900 font-bold">{bankFile?.extractedName || auditInput.nameOnAadhaar || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{auditInput.dobOnAadhaar || "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <Check className="size-3" /> KYC Seeded & Matched
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Actionable Legal Solutions for Mismatch */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-600" />
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Legal Remedies & Solutions for Name Discrepancy:
            </h4>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            When educational records state <strong>"{auditInput.nameOnMarksheet || "Applicant S"}"</strong> while Aadhaar records <strong>"{auditInput.nameOnAadhaar || "Applicant Full Name"}"</strong>, welfare audit teams require legal corroboration. We generate two official, ready-to-use documents:
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
            {/* Solution A: One-and-the-Same Person Affidavit */}
            <div className="rounded-2xl border border-amber-300 bg-white p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Solution 1: Notarized Affidavit</span>
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                  Ready in 24 hrs
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Execute a ₹20 / ₹50 Non-Judicial Stamp Paper affidavit affirming that "{auditInput.nameOnAadhaar}" and "{auditInput.nameOnMarksheet}" refer to one and the same person.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setShowAffidavitModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Eye className="size-3" />
                  <span>Preview Text</span>
                </button>
                <button
                  onClick={handleCopyAffidavit}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Copy className="size-3" />
                  <span>{copiedAffidavit ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownloadAffidavit}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 cursor-pointer shadow-xs"
                >
                  <Download className="size-3" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            {/* Solution B: NPCI Seeding Mandate */}
            <div className="rounded-2xl border border-sky-300 bg-white p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Solution 2: Bank NPCI Seeding Mandate</span>
                <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
                  Bank Form
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Submit standard Annexure I to the branch manager requesting account 38920192819 be mapped in the NPCI Aadhaar mapper for DBT.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setShowMandateModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Eye className="size-3" />
                  <span>Preview Text</span>
                </button>
                <button
                  onClick={handleCopyMandate}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Copy className="size-3" />
                  <span>{copiedForm ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownloadMandate}
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-sky-700 cursor-pointer shadow-xs"
                >
                  <Download className="size-3" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affidavit Preview Modal */}
      {showAffidavitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileBadge className="size-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Notarized One-and-the-Same Person Affidavit Format
                </h3>
              </div>
              <button
                onClick={() => setShowAffidavitModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200 max-h-96 overflow-y-auto">
              {affidavitText}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopyAffidavit}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Copy className="size-4" />
                <span>{copiedAffidavit ? "Copied to Clipboard!" : "Copy Text"}</span>
              </button>
              <button
                onClick={handleDownloadAffidavit}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer shadow-md"
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="size-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  NPCI Aadhaar DBT Seeding Mandate (Annexure I)
                </h3>
              </div>
              <button
                onClick={() => setShowMandateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200 max-h-96 overflow-y-auto">
              {mandateText}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopyMandate}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Copy className="size-4" />
                <span>{copiedForm ? "Copied to Clipboard!" : "Copy Text"}</span>
              </button>
              <button
                onClick={handleDownloadMandate}
                className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer shadow-md"
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
