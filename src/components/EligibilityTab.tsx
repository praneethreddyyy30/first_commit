"use client";

import React, { useState } from "react";
import { UserProfile, CedarEvaluationResult } from "@/lib/cedar/evaluator";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  IndianRupee,
  Building2,
  ShieldCheck,
  FileCheck,
  User,
  GraduationCap,
  Landmark,
  Home,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  School,
  Award,
  Zap,
  RotateCcw,
  Hospital,
  ListTodo,
  FileText,
  MapPin,
  HelpCircle,
  Search,
  FileCheck2,
  GitFork,
  RefreshCw
} from "lucide-react";
import { SchemeCockpitModal } from "@/components/SchemeCockpitModal";
import { CertificateResolutionModal } from "@/components/CertificateResolutionModal";

interface EligibilityTabProps {
  profile: UserProfile;
  evaluationResults: CedarEvaluationResult[];
  onProfileChange: (newProfile: UserProfile) => void;
  onNavigateToProfile?: () => void;
  onNavigateToDocuments?: (schemeId: string) => void;
  onNavigateToRoadmap?: (schemeId: string) => void;
  onSelectSchemeForWorkspace?: (schemeId: string) => void;
  totalSchemesCount?: number;
  lastSyncedAt?: string;
  onSyncWithApiSetu?: () => Promise<void>;
  isSyncing?: boolean;
  cloudDataSource?: string;
}

export const EligibilityTab: React.FC<EligibilityTabProps> = ({
  profile,
  evaluationResults,
  onProfileChange,
  onNavigateToProfile,
  onNavigateToDocuments,
  onNavigateToRoadmap,
  onSelectSchemeForWorkspace,
  totalSchemesCount,
  lastSyncedAt = "Live (Cloud Gateway)",
  onSyncWithApiSetu,
  isSyncing = false,
  cloudDataSource = "Amazon DynamoDB (JanSetuSchemes)",
}) => {
  // Classification tabs: Eligible vs Not Eligible
  const [eligibilityTab, setEligibilityTab] = useState<"ELIGIBLE" | "NOT_ELIGIBLE">("ELIGIBLE");

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "STATE_SPECIFIC" | "CENTRAL" | "SCHOLARSHIP" | "HEALTHCARE" | "CERTIFICATE"
  >("ALL");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedCedarPolicy, setExpandedCedarPolicy] = useState<string | null>(null);

  // Modals for Individual Scheme Cockpit & Missing Certificate Sub-Tree
  const [selectedCockpitResult, setSelectedCockpitResult] = useState<CedarEvaluationResult | null>(null);
  const [selectedCertGuideId, setSelectedCertGuideId] = useState<string | null>(null);

  const isTamilNadu = profile.state === "Tamil Nadu";
  const isAndhraPradesh = profile.state === "Andhra Pradesh";

  // Split results into Eligible vs Not Eligible, ensuring only complete, valid schemes with titles are shown
  const validEvaluationResults = evaluationResults.filter(
    (r) => r && r.scheme && typeof r.scheme.title === "string" && r.scheme.title.trim().length > 0
  );

  const eligibleResults = validEvaluationResults.filter((r) => r.decision === "ALLOW");
  const ineligibleResults = validEvaluationResults.filter((r) => r.decision !== "ALLOW");

  const activeClassificationResults =
    eligibilityTab === "ELIGIBLE" ? eligibleResults : ineligibleResults;

  // Filter based on category & search query
  const displayedResults = activeClassificationResults.filter((r) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (r.scheme.title || "").toLowerCase().includes(q);
      const matchCode = (r.scheme.shortCode || "").toLowerCase().includes(q);
      const matchMinistry = (r.scheme.ministry || "").toLowerCase().includes(q);
      const matchBenefit = (r.scheme.benefitAmount || "").toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchMinistry && !matchBenefit) {
        return false;
      }
    }

    if (categoryFilter === "STATE_SPECIFIC") {
      return r.scheme.level === "State";
    }
    if (categoryFilter === "CENTRAL") {
      return r.scheme.level === "Central";
    }
    if (categoryFilter === "SCHOLARSHIP") {
      return r.scheme.type === "scholarship";
    }
    if (categoryFilter === "HEALTHCARE") {
      return r.scheme.type === "healthcare";
    }
    if (categoryFilter === "CERTIFICATE") {
      return r.scheme.type === "certificate";
    }
    return true;
  });

  const togglePolicyView = (id: string) => {
    setExpandedCedarPolicy(expandedCedarPolicy === id ? null : id);
  };

  const handleMarkCertAsHeld = (certId: string) => {
    const current = profile.heldDocuments || [];
    if (!current.includes(certId)) {
      onProfileChange({ ...profile, heldDocuments: [...current, certId] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Citizen Profile Summary Banner */}
      <div className="rounded-3xl border border-[#142A6F] bg-gradient-to-r from-[#0B1B4F] via-[#0C1B4A] to-[#040B22] p-6 text-white shadow-luxury">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#DFB738]/20 text-[#F5E29F] border border-[#DFB738]/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider font-display">
                {profile.state} Citizen Profile
              </span>
              <span className="rounded-md bg-white/10 text-slate-200 border border-white/15 px-2 py-0.5 text-[10px] font-bold font-mono">
                {isTamilNadu && profile.tnCommunity !== "None"
                  ? `${profile.category} (${profile.tnCommunity})`
                  : isAndhraPradesh && profile.apCommunity !== "None"
                  ? `${profile.category} (${profile.apCommunity})`
                  : profile.category}
              </span>
              {profile.studiedInGovtSchool6To12 && (
                <span className="rounded-md bg-blue-500/20 text-blue-200 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold">
                  Govt School 6-12
                </span>
              )}
              {profile.isFirstGraduateInFamily && (
                <span className="rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                  1st Graduate
                </span>
              )}
            </div>

            <h2 className="text-xl font-black text-white sm:text-2xl font-serif tracking-tight">
              {profile.name || "Client"} • Scheme Eligibility Discovery
            </h2>

            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
              <span>Annual Income: <strong className="text-[#F5E29F]">₹{profile.annualFamilyIncome.toLocaleString("en-IN")}</strong></span>
              <span>•</span>
              <span>Education: <strong className="text-white">{profile.educationLevel}</strong> ({profile.admissionQuota})</span>
              <span>•</span>
              <span>Electricity: <strong className="text-white">{profile.electricityUnitsPerYear || 1800} units/yr</strong></span>
              <span>•</span>
              <span>Verified Documents: <strong className="text-white">{profile.heldDocuments?.length || 0}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToProfile && (
              <button
                onClick={onNavigateToProfile}
                className="flex items-center gap-1.5 rounded-xl border border-[#DFB738]/40 bg-[#152864] text-[#F5E29F] px-4 py-2.5 text-xs font-bold hover:bg-[#152864]/80 transition-all cursor-pointer shadow-sm"
              >
                <User className="size-3.5 text-[#F5E29F]" />
                <span>Edit Profile Particulars</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Cloud Database & Gazette Scanner Sync Bar */}
      <div className="luxury-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#DFC8A5] bg-white p-3.5 px-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex size-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-3 bg-emerald-600"></span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#0B1B4F] font-serif">
                Cloud Database: {cloudDataSource}
              </span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                {totalSchemesCount || evaluationResults.length} Active Cloud Policies
              </span>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                ⚡ Zero Search Required
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Auto-evaluated live for <strong>{profile.state}</strong> • Synchronized with National Scholarship Portal (NSP) & State Gazettes • Last sync: <span className="font-semibold text-slate-700">{lastSyncedAt}</span>
            </p>
          </div>
        </div>

        {onSyncWithApiSetu && (
          <button
            onClick={onSyncWithApiSetu}
            disabled={isSyncing}
            className={`shrink-0 flex items-center gap-2 rounded-xl bg-[#0B1B4F] hover:bg-[#152864] text-[#F5E29F] border border-[#DFB738]/40 px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isSyncing ? "opacity-70 cursor-not-allowed" : ""
            }`}
            title="Scan official Government Gazettes and cloud database for latest real-time notifications"
          >
            <RefreshCw className={`size-3.5 text-[#DFB738] ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Scanning Live Gazettes..." : "Scan Latest Gazettes"}</span>
          </button>
        )}
      </div>

      {/* Classification & Search Controls */}
      <div className="rounded-2xl border border-[#EDE6DD] bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Classification Tabs: Eligible vs Not Eligible */}
          <div className="flex rounded-xl bg-[#FAF7F2] p-1 border border-[#EDE6DD]">
            <button
              onClick={() => setEligibilityTab("ELIGIBLE")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                eligibilityTab === "ELIGIBLE"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle2 className="size-3.5" />
              <span>Eligible Schemes</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  eligibilityTab === "ELIGIBLE"
                    ? "bg-white/25 text-white"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {eligibleResults.length}
              </span>
            </button>

            <button
              onClick={() => setEligibilityTab("NOT_ELIGIBLE")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                eligibilityTab === "NOT_ELIGIBLE"
                  ? "bg-rose-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <XCircle className="size-3.5" />
              <span>Not Eligible</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  eligibilityTab === "NOT_ELIGIBLE"
                    ? "bg-white/25 text-white"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {ineligibleResults.length}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schemes by title, benefit, or code..."
              className="w-full rounded-xl border border-[#EDE6DD] bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#DFB738] focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#EDE6DD]">
          <span className="text-[11px] font-bold text-[#854D0E] mr-2 font-display">Filter:</span>
          {[
            { id: "ALL", label: `All Programs (${activeClassificationResults.length})` },
            { id: "STATE_SPECIFIC", label: `${profile.state} Flagships` },
            { id: "CENTRAL", label: "Central Government" },
            { id: "SCHOLARSHIP", label: "Scholarships & Fee Reimbursements" },
            { id: "HEALTHCARE", label: "Healthcare & Welfare" },
            { id: "CERTIFICATE", label: "Statutory Certificates" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCategoryFilter(filter.id as any)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === filter.id
                  ? "bg-[#0B1B4F] text-[#F5E29F] shadow-xs font-bold"
                  : "bg-[#FAF7F2] text-slate-700 hover:bg-[#F4ECE1] border border-[#EDE6DD]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {displayedResults.map((result) => {
          const { scheme, decision, matchedReasons, failedReasons, missingPrerequisites } = result;
          const isEligible = decision === "ALLOW";
          const hasRoadblocks = missingPrerequisites && missingPrerequisites.length > 0;

          return (
            <div
              key={scheme.id}
              className={`flex flex-col justify-between rounded-3xl border bg-white p-5 transition-all shadow-luxury hover:border-[#DFC8A5] ${
                isEligible
                  ? "border-emerald-200/80 hover:border-emerald-300"
                  : "border-[#EDE6DD] opacity-90"
              }`}
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                          scheme.level === "State"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : "bg-blue-100 text-blue-900 border border-blue-200"
                        }`}
                      >
                        {scheme.level === "State" ? `${profile.state} State` : "Central Gov"}
                      </span>
                      <span className="rounded-md border border-[#EDE6DD] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {scheme.shortCode}
                      </span>
                      {scheme.officialPortalUrl?.includes("myscheme.gov.in") && (
                        <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="size-2.5 text-emerald-600" />
                          myscheme.gov.in Live
                        </span>
                      )}
                      {scheme.type === "healthcare" && (
                        <span className="rounded-md bg-teal-100 text-teal-800 px-2 py-0.5 text-[10px] font-bold">
                          Healthcare
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black tracking-tight text-[#0B1B4F] font-serif">
                      {scheme.title}
                    </h3>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                      isEligible
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {isEligible ? "Eligible" : "Ineligible"}
                  </span>
                </div>

                {/* Sponsoring Ministry */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">
                  {scheme.ministry}
                </p>

                {/* Benefit Amount Highlight */}
                <div className="rounded-2xl border border-[#EDE6DD] bg-[#FAF7F2] p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#854D0E] font-display">
                    Statutory Benefit Amount:
                  </div>
                  <div className="text-base font-black text-[#0B1B4F] font-serif">
                    {scheme.benefitAmount}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                    {scheme.benefitDescription}
                  </div>
                </div>

                {/* Statutory Deadline & Days Remaining */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-amber-700" />
                    <span>Closes: <strong>{scheme.deadline}</strong></span>
                  </div>
                  <span className="rounded-full bg-[#FAF4EB] border border-[#E8DCCB] px-2 py-0.5 text-[10px] font-bold text-[#854D0E]">
                    {scheme.daysRemaining} days remaining
                  </span>
                </div>

                {/* Satisfied Criteria Bullets */}
                {matchedReasons && matchedReasons.length > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1 font-display">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      <span>Why You Are Eligible (Satisfied Statutory Criteria):</span>
                    </div>
                    <ul className="space-y-1 text-xs text-emerald-950 font-medium">
                      {matchedReasons.slice(0, 3).map((reason: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                      {matchedReasons.length > 3 && (
                        <li className="text-[10px] text-emerald-700 font-bold pl-3">
                          + {matchedReasons.length - 3} more criteria verified
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Failed Clauses Bullets */}
                {!isEligible && failedReasons && failedReasons.length > 0 && (
                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1 font-display">
                      <XCircle className="size-3 text-rose-600" />
                      <span>Why Ineligible (Failed Clauses):</span>
                    </div>
                    <ul className="space-y-1 text-xs text-rose-950 font-medium">
                      {failedReasons.map((clause: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-600 mt-0.5 font-bold">✕</span>
                          <span>{clause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Prerequisite Roadblock Alert */}
                {isEligible && hasRoadblocks && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <AlertTriangle className="size-3.5 text-amber-600" />
                        <span>Prerequisite Roadblock: {missingPrerequisites.length} Mandatory Document(s) Missing</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingPrerequisites.map((preq: any) => (
                        <button
                          key={preq.id}
                          onClick={() => setSelectedCertGuideId(preq.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer shadow-2xs"
                        >
                          <span>{preq.title ? preq.title.substring(0, 35) : preq.id}</span>
                          <span className="text-[10px] text-[#0B1B4F] font-bold">Resolve Guide ➔</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#EDE6DD] space-y-2">
                {onSelectSchemeForWorkspace && (
                  <button
                    onClick={() => onSelectSchemeForWorkspace(scheme.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B1B4F] hover:bg-[#071233] text-white py-2.5 px-3 text-xs font-bold transition-all cursor-pointer shadow-sm border border-[#142A6F]"
                  >
                    <span>Select Scheme & Open Dedicated Workspace</span>
                    <ArrowRight className="size-3.5 text-[#F5E29F]" />
                  </button>
                )}

                <div className="flex items-center gap-2">
                  {onNavigateToDocuments && (
                    <button
                      onClick={() => onNavigateToDocuments(scheme.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#DACBB8] bg-white px-3 py-2 text-xs font-bold text-[#0B1B4F] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileCheck2 className="size-3.5 text-amber-700" />
                      <span>Audit Docs</span>
                    </button>
                  )}

                  {onNavigateToRoadmap && (
                    <button
                      onClick={() => onNavigateToRoadmap(scheme.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#DACBB8] bg-white px-3 py-2 text-xs font-bold text-[#0B1B4F] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-2xs"
                    >
                      <GitFork className="size-3.5 text-sky-700" />
                      <span>Roadmap</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setSelectedCockpitResult(result)}
                    className="flex items-center gap-1 text-xs font-bold text-[#0B1B4F] hover:text-[#854D0E] hover:underline cursor-pointer"
                  >
                    <span>Open Scheme Cockpit & Action Tracker</span>
                    <ArrowRight className="size-3.5 text-[#854D0E]" />
                  </button>

                  <button
                    onClick={() => togglePolicyView(scheme.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#0B1B4F] cursor-pointer"
                  >
                    <Code2 className="size-3 text-amber-700" />
                    <span>{expandedCedarPolicy === scheme.id ? "Hide Cedar" : "View Cedar"}</span>
                  </button>
                </div>

                {/* Expandable AWS Cedar Policy Code */}
                {expandedCedarPolicy === scheme.id && (
                  <div className="mt-2 rounded-xl bg-[#071233] p-3 font-mono text-[11px] text-emerald-400 border border-[#142A6F] whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {scheme.cedarPolicyCode}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {displayedResults.length === 0 && (
        <div className="rounded-3xl border border-[#EDE6DD] bg-white p-12 text-center shadow-luxury space-y-3">
          <FileText className="size-12 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-[#0B1B4F] font-serif">No matching schemes found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your search query or switching the category filter above to see other programs.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("ALL");
            }}
            className="rounded-xl bg-[#0B1B4F] px-4 py-2 text-xs font-bold text-[#F5E29F] hover:bg-[#071233] cursor-pointer shadow-sm border border-[#142A6F]"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Scheme Cockpit Modal */}
      {selectedCockpitResult && (
        <SchemeCockpitModal
          result={selectedCockpitResult}
          onClose={() => setSelectedCockpitResult(null)}
          onOpenCertificateGuide={(certId: string) => setSelectedCertGuideId(certId)}
          onNavigateToDocumentsTab={() => {
            if (onNavigateToDocuments && selectedCockpitResult) {
              onNavigateToDocuments(selectedCockpitResult.scheme.id);
            }
            setSelectedCockpitResult(null);
          }}
        />
      )}

      {/* Certificate Resolution Sub-Tree Modal */}
      {selectedCertGuideId && (
        <CertificateResolutionModal
          certificateId={selectedCertGuideId}
          onClose={() => setSelectedCertGuideId(null)}
          onMarkAsObtained={handleMarkCertAsHeld}
          userState={profile.state}
        />
      )}
    </div>
  );
};
