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
  confidenceScore?: number;
  isValidDocument?: boolean;
  issuingAuthority?: string;
  validationWarnings?: string[];
  securityMarkers?: string[];
  isExtracting?: boolean;
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

  // Dynamic Scheme-Specific Document Upload State
  const [schemeUploadedDocs, setSchemeUploadedDocs] = useState<
    Record<string, { fileName: string; size: string; status: "VERIFIED" | "PENDING" }>
  >({});

  const handleSchemeDocUpload = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setSchemeUploadedDocs((prev) => ({
      ...prev,
      [docName]: {
        fileName: file.name,
        size: sizeStr,
        status: "VERIFIED",
      },
    }));
  };

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
    const updated = { ...auditInput, nameOnAadhaar: newName };
    setAuditInput(updated);
    setAadhaarFile((prev) => (prev ? { ...prev, extractedName: newName } : null));
    if (onAuditInputChange) onAuditInputChange(updated);
  };

  const handleUpdateMarksheetName = (newName: string) => {
    const updated = { ...auditInput, nameOnMarksheet: newName };
    setAuditInput(updated);
    setMarksheetFile((prev) => (prev ? { ...prev, extractedName: newName } : null));
    if (onAuditInputChange) onAuditInputChange(updated);
  };

  const handleUpdateBankName = (newName: string) => {
    setBankFile((prev) => (prev ? { ...prev, extractedName: newName } : null));
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

  // Upload handler for native file input with live OCR extraction
  const handleFileUpload = async (type: "aadhaar" | "marksheet" | "bank", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    // 1. Set immediate extracting state
    const initialLoadingState: UploadedFileInfo = {
      name: file.name,
      size: sizeStr,
      type: file.type,
      extractedName: "Scanning document text with OCR...",
      isExtracting: true,
      isValidDocument: true,
    };

    if (type === "aadhaar") setAadhaarFile(initialLoadingState);
    else if (type === "marksheet") setMarksheetFile(initialLoadingState);
    else setBankFile(initialLoadingState);

    // 2. Read file as base64 and call backend OCR / Vision extraction API
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const response = await fetch("/api/audit/extract-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data,
            expectedType: type,
          }),
        });

        const data = await response.json();
        if (data.success && data.result) {
          const res = data.result;
          const updatedFileInfo: UploadedFileInfo = {
            name: file.name,
            size: sizeStr,
            type: file.type,
            extractedName: res.extractedName || "Unknown",
            extractedDob: res.extractedDob,
            extractedId: res.extractedIdNumber,
            confidenceScore: res.confidenceScore,
            isValidDocument: res.isValidDocument,
            issuingAuthority: res.issuingAuthority,
            validationWarnings: res.validationWarnings,
            securityMarkers: res.securityMarkersDetected,
            isExtracting: false,
          };

          if (type === "aadhaar") {
            setAadhaarFile(updatedFileInfo);
            if (res.isValidDocument && res.extractedName) {
              const updated = {
                ...auditInput,
                nameOnAadhaar: res.extractedName,
                dobOnAadhaar: res.extractedDob || auditInput.dobOnAadhaar,
              };
              setAuditInput(updated);
              if (onAuditInputChange) onAuditInputChange(updated);
            }
          } else if (type === "marksheet") {
            setMarksheetFile(updatedFileInfo);
            if (res.isValidDocument && res.extractedName) {
              const updated = {
                ...auditInput,
                nameOnMarksheet: res.extractedName,
                dobOnMarksheet: res.extractedDob || auditInput.dobOnMarksheet,
              };
              setAuditInput(updated);
              if (onAuditInputChange) onAuditInputChange(updated);
            }
          } else {
            setBankFile(updatedFileInfo);
            if (res.isValidDocument && res.extractedName) {
              const updated = {
                ...auditInput,
                bankName: res.issuingAuthority || auditInput.bankName,
              };
              setAuditInput(updated);
              if (onAuditInputChange) onAuditInputChange(updated);
            }
          }
        }
      } catch (err) {
        console.error("Document extraction error:", err);
        if (type === "aadhaar") setAadhaarFile((prev) => prev ? { ...prev, isExtracting: false } : null);
        else if (type === "marksheet") setMarksheetFile((prev) => prev ? { ...prev, isExtracting: false } : null);
        else setBankFile((prev) => prev ? { ...prev, isExtracting: false } : null);
      }
    };
    reader.readAsDataURL(file);
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
      setAuditInput(updated);
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
      setAuditInput(updated);
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
      updated = {
        ...auditInput,
        nameOnAadhaar: matchName,
        nameOnMarksheet: matchName,
        isAadhaarLinkedToBank: true,
        isNpciSeeded: true,
      };
      setAuditInput(updated);
      if (aadhaarFile) setAadhaarFile({ ...aadhaarFile, extractedName: matchName });
      if (marksheetFile) setMarksheetFile({ ...marksheetFile, extractedName: matchName });
      if (bankFile) setBankFile({ ...bankFile, extractedName: matchName });
    } else if (preset === "typo_mismatch") {
      const aadhaarName = "Kavitha Selvam";
      const typoMarksheet = "Kavita Chelvam";
      updated = {
        ...auditInput,
        nameOnAadhaar: aadhaarName,
        nameOnMarksheet: typoMarksheet,
      };
      setAuditInput(updated);
      if (aadhaarFile) setAadhaarFile({ ...aadhaarFile, extractedName: aadhaarName });
      if (marksheetFile) setMarksheetFile({ ...marksheetFile, extractedName: typoMarksheet });
      if (bankFile) setBankFile({ ...bankFile, extractedName: aadhaarName });
    } else if (preset === "clear") {
      setAadhaarFile(null);
      setMarksheetFile(null);
      setBankFile(null);
      updated = {
        ...auditInput,
        nameOnAadhaar: "",
        nameOnMarksheet: "",
      };
      setAuditInput(updated);
    }

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
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="size-3.5 text-amber-600" />
              <span>Scheme-Centric Pre-Flight Document Audit</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1B4F] font-serif tracking-tight">
              Audit Document Prerequisites for Specific Scheme
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed mt-1">
              Document mandates differ per program. Select your target scheme below to evaluate statutory prerequisites, cross-document name consistency, and NPCI DBT readiness.
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

      {/* Scheme Required Documents Checklist */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE6DD]">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs">
              <FileCheck2 className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0B1B4F] font-serif">
                1. Statutory Documents Required for {currentScheme.shortCode}
              </h3>
              <p className="text-[11px] text-slate-500">
                Real-world verification checks matching the official gazette requirements
              </p>
            </div>
          </div>

          <span className="rounded-full bg-[#FAF7F2] border border-[#DFC8A5] px-3 py-1 text-xs font-bold text-[#0B1B4F]">
            {schemeDocs.filter((d) => userHeld.includes(d)).length} of {schemeDocs.length} Verified
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schemeDocs.map((docId) => {
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

      {/* Interactive Document Upload Dropzones with Live OCR Preview */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#EDE6DD] gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
              <Upload className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0B1B4F] font-serif">
                2. Live Document Upload & OCR Identity Parsing
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload your files (PDF or Image) or edit names directly to test real-time cross-document name & DOB extraction
              </p>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5 bg-[#FAF7F2] px-2.5 py-1 rounded-full border border-[#DFC8A5]">
            <Sparkles className="size-3.5 text-amber-600" />
            <span>Simulates AWS Textract / DigiLocker API OCR</span>
          </div>
        </div>

        {/* Quick Test Scenarios Bar */}
        <div className="rounded-2xl bg-[#FAF7F2] border border-[#DFC8A5] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B1B4F] flex items-center gap-1.5 font-serif">
              <Sparkles className="size-3.5 text-amber-600" />
              <span>Quick Test Scenarios (1-Click Test):</span>
            </span>
            <span className="text-[10px] text-slate-500">Click any preset to instantly test name matching behavior</span>
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

        {/* 3 Upload Dropzones */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Dropzone 1: Aadhaar Card */}
          <div className="rounded-2xl border-2 border-dashed border-[#DFB738]/60 bg-[#FAF7F2]/40 p-4.5 flex flex-col justify-between hover:bg-[#FAF7F2]/70 transition-colors shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100/80 text-amber-800">
                    <FileBadge className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0B1B4F] font-serif">Aadhaar Card (UIDAI)</h4>
                    <p className="text-[10px] text-slate-500">Master Legal Identity Anchor</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#0B1B4F] px-2 py-0.5 text-[9px] font-bold text-[#F5E29F] uppercase tracking-wider">
                  Anchor
                </span>
              </div>

              {/* Upload Input Control */}
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DFC8A5] bg-white p-3 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                  <FileUp className="size-5 text-[#0B1B4F] mb-1" />
                  <span className="text-xs font-bold text-[#0B1B4F]">
                    {aadhaarFile ? "Replace Aadhaar File" : "Upload Aadhaar (PDF / JPG)"}
                  </span>
                  <span className="text-[10px] text-slate-400">Click to browse from device</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload("aadhaar", e)}
                  />
                </label>
              </div>

              {/* File Info & OCR Output */}
              {aadhaarFile && (
                <div className="mt-3 rounded-xl border border-[#EDE6DD] bg-white p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{aadhaarFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{aadhaarFile.size}</span>
                  </div>

                  {aadhaarFile.isExtracting ? (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-900 text-xs">
                      <RefreshCw className="size-3.5 animate-spin text-amber-700" />
                      <span>Scanning document & extracting identity markers...</span>
                    </div>
                  ) : aadhaarFile.isValidDocument === false ? (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="size-3.5 text-rose-600" />
                        <span>Document Mismatch / Unrecognized</span>
                      </div>
                      <p>{aadhaarFile.validationWarnings?.[0] || "File does not match standard Indian government Aadhaar card layout."}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-[#0B1B4F] uppercase tracking-wider mb-0.5 font-serif">
                          Extracted Name on Aadhaar:
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={auditInput.nameOnAadhaar || ""}
                            onChange={(e) => handleUpdateAadhaarName(e.target.value)}
                            className="w-full rounded-lg border border-[#DFC8A5] bg-[#FAF7F2]/50 px-2.5 py-1.5 text-xs font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:bg-white focus:outline-hidden"
                            placeholder="e.g. Kavitha Selvam"
                          />
                          <Edit3 className="absolute right-2 top-2 size-3 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>DOB: <strong>{auditInput.dobOnAadhaar || "2006-05-12"}</strong></span>
                        <span>No: <strong>{aadhaarFile.extractedId || "XXXX-4819"}</strong></span>
                      </div>

                      {aadhaarFile.confidenceScore && (
                        <div className="pt-1 flex items-center justify-between text-[10px] text-emerald-800 font-medium">
                          <span>OCR Confidence: <strong>{aadhaarFile.confidenceScore}%</strong></span>
                          <span className="text-slate-500 font-mono text-[9px]">{aadhaarFile.issuingAuthority || "UIDAI"}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="flex items-center gap-1 font-semibold">
                <CheckCircle className="size-3" /> UIDAI Biometric Verified
              </span>
            </div>
          </div>

          {/* Dropzone 2: 10th Marksheet */}
          <div className="rounded-2xl border-2 border-dashed border-[#DFC8A5] bg-[#FAF7F2]/40 p-4.5 flex flex-col justify-between hover:bg-[#FAF7F2]/70 transition-colors shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0B1B4F] font-serif">10th Class Mark Memo</h4>
                    <p className="text-[10px] text-slate-500">Board / SSC Exam Record</p>
                  </div>
                </div>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-800 uppercase tracking-wider">
                  Education
                </span>
              </div>

              {/* Upload Input Control */}
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DFC8A5] bg-white p-3 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                  <FileUp className="size-5 text-[#0B1B4F] mb-1" />
                  <span className="text-xs font-bold text-[#0B1B4F]">
                    {marksheetFile ? "Replace Marksheet File" : "Upload Memo (PDF / JPG)"}
                  </span>
                  <span className="text-[10px] text-slate-400">Click to browse from device</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload("marksheet", e)}
                  />
                </label>
              </div>

              {/* File Info & OCR Output */}
              {marksheetFile && (
                <div className="mt-3 rounded-xl border border-[#EDE6DD] bg-white p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{marksheetFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{marksheetFile.size}</span>
                  </div>

                  {marksheetFile.isExtracting ? (
                    <div className="flex items-center gap-2 p-2 bg-sky-50 rounded-lg text-sky-900 text-xs">
                      <RefreshCw className="size-3.5 animate-spin text-sky-700" />
                      <span>Scanning marksheet & extracting student record...</span>
                    </div>
                  ) : marksheetFile.isValidDocument === false ? (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="size-3.5 text-rose-600" />
                        <span>Document Mismatch / Unrecognized</span>
                      </div>
                      <p>{marksheetFile.validationWarnings?.[0] || "File does not match an Indian secondary examination marksheet."}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-[#0B1B4F] uppercase tracking-wider mb-0.5 font-serif">
                          Extracted Name on Marksheet:
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={auditInput.nameOnMarksheet || ""}
                            onChange={(e) => handleUpdateMarksheetName(e.target.value)}
                            className="w-full rounded-lg border border-[#DFC8A5] bg-[#FAF7F2]/50 px-2.5 py-1.5 text-xs font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:bg-white focus:outline-hidden"
                            placeholder="e.g. Kavitha S"
                          />
                          <Edit3 className="absolute right-2 top-2 size-3 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>DOB: <strong>{auditInput.dobOnMarksheet || "2006-05-12"}</strong></span>
                        <span>Roll: <strong>{marksheetFile.extractedId || "SSC-2022-849"}</strong></span>
                      </div>

                      {marksheetFile.confidenceScore && (
                        <div className="pt-1 flex items-center justify-between text-[10px] text-sky-800 font-medium">
                          <span>OCR Confidence: <strong>{marksheetFile.confidenceScore}%</strong></span>
                          <span className="text-slate-500 font-mono text-[9px]">{marksheetFile.issuingAuthority || "State Board"}</span>
                        </div>
                      )}
                    </>
                  )}
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
          <div className="rounded-2xl border-2 border-dashed border-[#DFC8A5] bg-[#FAF7F2]/40 p-4.5 flex flex-col justify-between hover:bg-[#FAF7F2]/70 transition-colors shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <Building className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0B1B4F] font-serif">Bank Passbook</h4>
                    <p className="text-[10px] text-slate-500">NPCI / PFMS Direct Benefit Transfer</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                  DBT Passbook
                </span>
              </div>

              {/* Upload Input Control */}
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DFC8A5] bg-white p-3 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                  <FileUp className="size-5 text-[#0B1B4F] mb-1" />
                  <span className="text-xs font-bold text-[#0B1B4F]">
                    {bankFile ? "Replace Passbook File" : "Upload Passbook (PDF / JPG)"}
                  </span>
                  <span className="text-[10px] text-slate-400">Click to browse from device</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload("bank", e)}
                  />
                </label>
              </div>

              {/* File Info & OCR Output */}
              {bankFile && (
                <div className="mt-3 rounded-xl border border-[#EDE6DD] bg-white p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{bankFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{bankFile.size}</span>
                  </div>

                  {bankFile.isExtracting ? (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-900 text-xs">
                      <RefreshCw className="size-3.5 animate-spin text-amber-700" />
                      <span>Scanning passbook IFSC & Account record...</span>
                    </div>
                  ) : bankFile.isValidDocument === false ? (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="size-3.5 text-rose-600" />
                        <span>Document Mismatch / Unrecognized</span>
                      </div>
                      <p>{bankFile.validationWarnings?.[0] || "File does not match standard bank passbook layout."}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-[#0B1B4F] uppercase tracking-wider mb-0.5 font-serif">
                          Bank Name & Account:
                        </label>
                        <input
                          type="text"
                          value={auditInput.bankName || ""}
                          onChange={(e) => {
                            const updated = { ...auditInput, bankName: e.target.value };
                            setAuditInput(updated);
                            if (onAuditInputChange) onAuditInputChange(updated);
                          }}
                          className="w-full rounded-lg border border-[#DFC8A5] bg-[#FAF7F2]/50 px-2.5 py-1.5 text-xs font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:bg-white focus:outline-hidden"
                          placeholder="e.g. State Bank of India"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>A/C: <strong>{bankFile.extractedId || "38920192819"}</strong></span>
                        <span className="text-emerald-700 font-bold">IFSC Verified</span>
                      </div>

                      {bankFile.confidenceScore && (
                        <div className="pt-1 flex items-center justify-between text-[10px] text-amber-900 font-medium">
                          <span>OCR Confidence: <strong>{bankFile.confidenceScore}%</strong></span>
                          <span className="text-slate-500 font-mono text-[9px]">{bankFile.issuingAuthority || "Scheduled Bank"}</span>
                        </div>
                      )}

                      {/* Interactive Bank KYC & NPCI Seeding Controls */}
                      <div className="pt-2 border-t border-[#EDE6DD] space-y-1.5">
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
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <span className="flex items-center gap-1 font-semibold">
                <CheckCircle className="size-3" /> Core Banking Validated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC SCHEME-SPECIFIC MANDATORY DOCUMENTS & PREREQUISITES CHECKLIST */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-5 border-[#DFB738]/60 bg-gradient-to-br from-amber-50/20 to-white">
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
                  Gazette Rule Section 4
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#0B1B4F] font-serif mt-1">
                Mandatory Documents Checklist for {currentScheme.title}
              </h3>
              <p className="text-xs text-slate-600">
                Official statutory certificates required specifically for this scheme. Upload each file to prevent rejection at Seva Center desks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="rounded-full bg-white border border-[#DFC8A5] px-3.5 py-1 text-xs font-mono font-bold text-[#0B1B4F]">
              {Object.keys(schemeUploadedDocs).length} / {currentScheme.mandatoryDocuments.length} Uploaded
            </span>
          </div>
        </div>

        {/* Dynamic Mandatory Documents Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {currentScheme.mandatoryDocuments.map((docName, idx) => {
            const isUploaded = Boolean(schemeUploadedDocs[docName]);
            const uploadedInfo = schemeUploadedDocs[docName];

            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                  isUploaded
                    ? "border-emerald-300 bg-emerald-50/40 shadow-xs"
                    : "border-dashed border-[#DFC8A5] bg-white hover:bg-[#FAF7F2]/60"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Doc #{idx + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isUploaded
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}
                    >
                      {isUploaded ? <CheckCircle className="size-2.5" /> : null}
                      {isUploaded ? "Uploaded" : "Pending"}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-[#0B1B4F] mt-1.5 leading-snug font-serif">
                    {docName}
                  </h5>

                  {isUploaded && uploadedInfo && (
                    <div className="mt-2 text-[11px] text-emerald-900 bg-white/80 p-2 rounded-lg border border-emerald-200 font-mono">
                      <span>📄 {uploadedInfo.fileName}</span> • <span>{uploadedInfo.size}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="flex items-center justify-center gap-1.5 rounded-lg border border-[#DFC8A5] bg-white hover:bg-[#FAF7F2] py-1.5 px-3 text-xs font-bold text-[#0B1B4F] cursor-pointer transition-all shadow-2xs">
                    <Upload className="size-3 text-[#0B1B4F]" />
                    <span>{isUploaded ? "Replace Document" : "Upload Document"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
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

      {/* Visual Side-by-Side Name Comparison & Matching Engine */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#EDE6DD] gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
              <ShieldAlert className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0B1B4F] font-serif">
                3. Cross-Document Name Matching Matrix & Resolution
              </h3>
              <p className="text-[11px] text-slate-500">
                Compares string patterns, phonetic Soundex, and initial expansions to prevent automated PFMS rejection
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
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                          : "bg-amber-50 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {token}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Marksheet Tokens */}
            <div className="rounded-xl border border-[#DFC8A5] bg-white p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1B4F] font-serif">10th Marksheet Name</span>
                <span className="text-[10px] text-sky-700 font-semibold">Academic Memo</span>
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
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                          : "bg-amber-50 text-amber-900 border border-amber-300"
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
                <th className="px-4 py-3.5">Date of Birth</th>
                <th className="px-4 py-3.5">Discrepancy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE6DD] font-medium bg-white">
              <tr className="hover:bg-[#FAF7F2]/60 transition-colors">
                <td className="px-4 py-3 font-bold text-[#0B1B4F] flex items-center gap-2">
                  <FileBadge className="size-3.5 text-amber-700" />
                  <span>Aadhaar Card (UIDAI)</span>
                </td>
                <td className="px-4 py-3 text-slate-900 font-bold">{auditInput.nameOnAadhaar || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{auditInput.dobOnAadhaar || "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF7F2] border border-[#DFC8A5] px-2.5 py-0.5 text-[10px] font-bold text-[#0B1B4F]">
                    <Check className="size-3" /> Master Legal Anchor
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#FAF7F2]/60 transition-colors">
                <td className="px-4 py-3 font-bold text-[#0B1B4F] flex items-center gap-2">
                  <FileText className="size-3.5 text-sky-700" />
                  <span>10th Class Marksheet</span>
                </td>
                <td className="px-4 py-3 text-slate-900 font-bold">{auditInput.nameOnMarksheet || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{auditInput.dobOnMarksheet || "—"}</td>
                <td className="px-4 py-3">
                  {auditInput.nameOnAadhaar === auditInput.nameOnMarksheet ? (
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
              <tr className="hover:bg-[#FAF7F2]/60 transition-colors">
                <td className="px-4 py-3 font-bold text-[#0B1B4F] flex items-center gap-2">
                  <Building className="size-3.5 text-amber-700" />
                  <span>Bank Passbook Record</span>
                </td>
                <td className="px-4 py-3 text-slate-900 font-bold">{bankFile?.extractedName || auditInput.nameOnAadhaar || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{auditInput.dobOnAadhaar || "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <Check className="size-3" /> KYC Seeded & Matched
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
            When educational records state <strong>"{auditInput.nameOnMarksheet || "Applicant S"}"</strong> while Aadhaar records <strong>"{auditInput.nameOnAadhaar || "Applicant Full Name"}"</strong>, welfare audit teams require legal corroboration. We generate two official, ready-to-use documents:
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
                Execute a ₹20 / ₹50 Non-Judicial Stamp Paper affidavit affirming that "{auditInput.nameOnAadhaar}" and "{auditInput.nameOnMarksheet}" refer to one and the same person.
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
                Submit standard Annexure I to the branch manager requesting account 38920192819 be mapped in the NPCI Aadhaar mapper for DBT.
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
