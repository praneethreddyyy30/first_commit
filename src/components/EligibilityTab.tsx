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
  onSelectScheme?: (schemeId: string) => void;
  totalSchemesCount?: number;
  lastSyncedAt?: string;
  onSyncWithApiSetu?: () => Promise<void>;
  isSyncing?: boolean;
}

export const EligibilityTab: React.FC<EligibilityTabProps> = ({
  profile,
  evaluationResults,
  onProfileChange,
  onNavigateToProfile,
  onNavigateToDocuments,
  onNavigateToRoadmap,
  onSelectScheme,
  totalSchemesCount,
  lastSyncedAt = "Live (API Setu Gateway)",
  onSyncWithApiSetu,
  isSyncing = false,
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

  // Split results into Eligible vs Not Eligible
  const eligibleResults = evaluationResults.filter((r) => r.decision === "ALLOW");
  const ineligibleResults = evaluationResults.filter((r) => r.decision !== "ALLOW");

  const activeClassificationResults =
    eligibilityTab === "ELIGIBLE" ? eligibleResults : ineligibleResults;

  // Filter based on category & search query
  const displayedResults = activeClassificationResults.filter((r) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.scheme.title.toLowerCase().includes(q);
      const matchCode = r.scheme.shortCode.toLowerCase().includes(q);
      const matchMinistry = r.scheme.ministry.toLowerCase().includes(q);
      const matchBenefit = r.scheme.benefitAmount.toLowerCase().includes(q);
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
    const currentHeld = profile.heldDocuments || [];
    if (!currentHeld.includes(certId)) {
      onProfileChange({
        ...profile,
        heldDocuments: [...currentHeld, certId],
      });
    }
    setSelectedCertGuideId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Citizen Profile Celebration Banner (Step 2 Header) */}
      <div className="rounded-3xl border border-indigo-200 bg-linear-to-r from-indigo-600 via-indigo-700 to-violet-700 p-6 text-white shadow-md shadow-indigo-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-400 text-slate-950 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider shadow-xs">
                🎉 {eligibleResults.length} Schemes Matched
              </span>
              <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                {profile.state} Citizen
              </span>
              <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                {isTamilNadu && profile.tnCommunity !== "None"
                  ? `${profile.category} (${profile.tnCommunity})`
                  : isAndhraPradesh && profile.apCommunity !== "None"
                  ? `${profile.category} (${profile.apCommunity})`
                  : profile.category}
              </span>
              {profile.studiedInGovtSchool6To12 && (
                <span className="rounded-full bg-sky-400/25 text-sky-200 border border-sky-300/40 px-2 py-0.5 text-[10px] font-bold">
                  Govt School 6-12
                </span>
              )}
              {profile.isFirstGraduateInFamily && (
                <span className="rounded-full bg-amber-400/25 text-amber-200 border border-amber-300/40 px-2 py-0.5 text-[10px] font-bold">
                  1st Graduate
                </span>
              )}
            </div>

            <h2 className="text-xl font-black text-white sm:text-2xl tracking-tight">
              {profile.name || "Client"} • Qualified Welfare & Scholarship Schemes
            </h2>

            <p className="text-xs text-indigo-100 flex flex-wrap items-center gap-2">
              <span>Annual Income: <strong className="text-white">₹{profile.annualFamilyIncome.toLocaleString("en-IN")}</strong></span>
              <span>•</span>
              <span>Education: <strong className="text-white">{profile.educationLevel}</strong> ({profile.admissionQuota})</span>
              <span>•</span>
              <span>Electricity: <strong className="text-white">{profile.electricityUnitsPerYear || 1800} units/yr</strong></span>
              <span>•</span>
              <span>Verified Documents: <strong className="text-white">{profile.heldDocuments?.length || 0}</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToDocuments && eligibleResults.length > 0 && (
              <button
                onClick={() => onNavigateToDocuments(eligibleResults[0].scheme.id)}
                className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-indigo-700 shadow-md hover:bg-indigo-50 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <FileCheck2 className="size-4 text-indigo-600" />
                <span>Verify Documents (Step 3) ➔</span>
              </button>
            )}

            {onNavigateToProfile && (
              <button
                onClick={onNavigateToProfile}
                className="flex items-center gap-1.5 rounded-2xl border border-white/30 bg-white/10 px-3.5 py-3 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer backdrop-blur-xs"
              >
                <User className="size-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* API Setu & National Public Data Exchange Live Sync Bar */}
      <div className="luxury-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#DFC8A5] bg-white p-3.5 px-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex size-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-3 bg-emerald-600"></span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#0B1B4F] font-serif">
                API Setu & myScheme DPI Gateway: Active & Synchronized
              </span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                {totalSchemesCount || evaluationResults.length} Verified Policies
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Auto-syncs with National Scholarship Portal (NSP), MoTA, & State Gazettes • Last check: <span className="font-semibold text-slate-700">{lastSyncedAt}</span>
            </p>
          </div>
        </div>

        {onSyncWithApiSetu && (
          <button
            onClick={onSyncWithApiSetu}
            disabled={isSyncing}
            className={`shrink-0 flex items-center gap-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F5E29F]/30 text-[#0B1B4F] border border-[#DFC8A5] px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isSyncing ? "opacity-70 cursor-not-allowed" : ""
            }`}
            title="Poll API Setu & myScheme National Data Gateway for newly gazetted welfare schemes"
          >
            <RefreshCw className={`size-3.5 text-[#DFB738] ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing with API Setu..." : "Check for Scheme Updates"}</span>
          </button>
        )}
      </div>

      {/* Classification & Search Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Classification Tabs: Eligible vs Not Eligible */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setEligibilityTab("ELIGIBLE")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                eligibilityTab === "ELIGIBLE"
                  ? "bg-emerald-600 text-white shadow-xs"
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
                  ? "bg-rose-600 text-white shadow-xs"
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
              placeholder="Search 35 schemes..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-2">Filter:</span>
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
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
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
              className={`flex flex-col justify-between rounded-3xl border bg-white p-5 transition-all shadow-xs hover:shadow-md ${
                isEligible
                  ? "border-emerald-200 hover:border-emerald-300"
                  : "border-slate-200 hover:border-slate-300 opacity-90"
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
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {scheme.level === "State" ? `${profile.state} State` : "Central Gov"}
                      </span>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {scheme.shortCode}
                      </span>
                      {scheme.type === "healthcare" && (
                        <span className="rounded-md bg-teal-100 text-teal-800 px-2 py-0.5 text-[10px] font-bold">
                          Healthcare
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black tracking-tight text-slate-900">
                      {scheme.title}
                    </h3>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                      isEligible
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
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
                <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50/60 to-slate-50/60 p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-950">
                    Statutory Benefit Amount:
                  </div>
                  <div className="text-base font-black text-indigo-900">
                    {scheme.benefitAmount}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                    {scheme.benefitDescription}
                  </div>
                </div>

                {/* Statutory Deadline & Days Remaining */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-slate-400" />
                    <span>Closes: <strong>{scheme.deadline}</strong></span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {scheme.daysRemaining} days remaining
                  </span>
                </div>

                {/* Satisfied Criteria Bullets */}
                {matchedReasons && matchedReasons.length > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
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
                  <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1">
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
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-2">
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
                          className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                        >
                          <span>{preq.title ? preq.title.substring(0, 35) : preq.id}</span>
                          <span className="text-[10px] text-indigo-700 font-bold">Resolve Guide ➔</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                {/* Primary CTA: Select Scheme & Open Workspace (Matching User Hand-drawn Flow) */}
                <button
                  onClick={() => {
                    if (onSelectScheme) {
                      onSelectScheme(scheme.id);
                    } else if (onNavigateToDocuments) {
                      onNavigateToDocuments(scheme.id);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B1B4F] px-4 py-2.5 text-xs font-black text-[#F5E29F] hover:bg-[#152864] transition-all shadow-sm cursor-pointer border border-[#DFB738]/50 hover:scale-[1.01]"
                >
                  <span>Select Scheme & Open Workspace ➔</span>
                </button>

                <div className="flex items-center gap-2">
                  {onNavigateToDocuments && (
                    <button
                      onClick={() => onNavigateToDocuments(scheme.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                    >
                      <FileCheck2 className="size-3.5 text-indigo-600" />
                      <span>Audit Docs</span>
                    </button>
                  )}

                  {onNavigateToRoadmap && (
                    <button
                      onClick={() => onNavigateToRoadmap(scheme.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                    >
                      <GitFork className="size-3.5 text-sky-600" />
                      <span>Roadmap</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setSelectedCockpitResult(result)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    <span>Open Scheme Cockpit & Action Tracker</span>
                    <ArrowRight className="size-3.5" />
                  </button>

                  <button
                    onClick={() => togglePolicyView(scheme.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <Code2 className="size-3" />
                    <span>{expandedCedarPolicy === scheme.id ? "Hide Cedar" : "View Cedar"}</span>
                  </button>
                </div>

                {/* Expandable AWS Cedar Policy Code */}
                {expandedCedarPolicy === scheme.id && (
                  <div className="mt-2 rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-emerald-400 border border-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {scheme.cedarPolicyCode}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {displayedResults.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs space-y-3">
          <FileText className="size-12 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-900">No matching schemes found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your search query or switching the category filter above to see other programs.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("ALL");
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer shadow-xs"
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
