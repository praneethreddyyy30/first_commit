"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  CreditCard,
  Clock,
  Sparkles,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Hospital,
  GraduationCap,
  CheckSquare,
  Square,
  Info,
  Coins,
  MapPin,
  Check,
  HelpCircle,
  Activity,
  Printer,
  Globe,
  ShieldAlert
} from "lucide-react";
import { SCHEMES_DATABASE, SchemeOrService } from "@/data/schemes";
import {
  SCHEME_ROADMAPS,
  getSchemeRoadmap,
  getMergedRoadmap,
  SchemeRoadmap
} from "@/data/schemeRoadmaps";
import { InteractiveApplicationTracker } from "@/components/InteractiveApplicationTracker";

interface PrerequisiteRoadmapTabProps {
  initialSchemeId?: string;
  userHeldDocuments?: string[];
  userState?: string;
  onSelectScheme?: (schemeId: string) => void;
  isWorkspaceMode?: boolean;
}

export const PrerequisiteRoadmapTab: React.FC<PrerequisiteRoadmapTabProps> = ({
  initialSchemeId = "Ayushman_PMJAY",
  userHeldDocuments = [],
  userState,
  onSelectScheme,
  isWorkspaceMode = false,
}) => {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<"SINGLE" | "MERGED">("SINGLE");

  // Determine initial scheme
  const defaultScheme = useMemo(() => {
    if (userState === "Andhra Pradesh" && (!initialSchemeId || initialSchemeId.startsWith("TN_"))) {
      return "AP_Jagananna_Vidya_Deevena";
    }
    if (userState === "Tamil Nadu" && (!initialSchemeId || initialSchemeId.startsWith("AP_"))) {
      return "TN_Pudhumai_Penn";
    }
    return initialSchemeId || "Ayushman_PMJAY";
  }, [initialSchemeId, userState]);

  // Single Scheme State
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(defaultScheme);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "MY_STATE" | "CENTRAL" | "SCHOLARSHIP" | "HEALTHCARE" | "CERTIFICATE" | "OFFLINE">("ALL");

  React.useEffect(() => {
    if (userState === "Andhra Pradesh" && initialSchemeId.startsWith("TN_")) {
      setSelectedSchemeId("AP_Jagananna_Vidya_Deevena");
    } else if (userState === "Tamil Nadu" && initialSchemeId.startsWith("AP_")) {
      setSelectedSchemeId("TN_Pudhumai_Penn");
    } else if (initialSchemeId) {
      setSelectedSchemeId(initialSchemeId);
    }
  }, [initialSchemeId, userState]);

  // Merged Multi-Scheme State (Initialized smartly according to state)
  const [mergedSelection, setMergedSelection] = useState<string[]>(() => {
    if (userState === "Andhra Pradesh") {
      return ["AP_Jagananna_Vidya_Deevena", "AP_YSR_Aarogyasri", "AP_Integrated_Community_Cert"];
    }
    if (userState === "Tamil Nadu") {
      return ["TN_Pudhumai_Penn", "TN_CMCHIS_Medical", "Income_Certificate"];
    }
    return ["PostMatric_ST", "Ayushman_PMJAY", "Income_Certificate"];
  });

  // Interactive Checklist State (for Single Scheme)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    userHeldDocuments.forEach((doc) => {
      initialMap[doc] = true;
    });
    return initialMap;
  });

  // Current Single Scheme Roadmap
  const currentRoadmap: SchemeRoadmap = useMemo(() => {
    return getSchemeRoadmap(selectedSchemeId);
  }, [selectedSchemeId]);

  // Merged Roadmap Calculation
  const mergedData = useMemo(() => {
    return getMergedRoadmap(mergedSelection);
  }, [mergedSelection]);

  // Filter schemes for the single selector with state prioritization
  const availableSchemes = useMemo(() => {
    return SCHEMES_DATABASE.filter((s) => {
      if (categoryFilter === "MY_STATE" && userState) {
        return s.level === "State" && s.applicableStates?.includes(userState);
      }
      if (categoryFilter === "CENTRAL") {
        return s.level === "Central";
      }
      if (categoryFilter === "SCHOLARSHIP") return s.type === "scholarship";
      if (categoryFilter === "HEALTHCARE") return s.type === "healthcare";
      if (categoryFilter === "CERTIFICATE") return s.type === "certificate";
      if (categoryFilter === "OFFLINE") return s.id.includes("FRA") || s.id.includes("Jungle") || s.id.includes("RoFR") || !s.officialPortalUrl;
      return true;
    }).sort((a, b) => {
      // Prioritize user's home state schemes to prevent cross-state confusion
      const aMatches = a.applicableStates?.includes(userState || "");
      const bMatches = b.applicableStates?.includes(userState || "");
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [categoryFilter, userState]);

  const toggleCheckItem = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleMergedScheme = (id: string) => {
    setMergedSelection((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Calculate readiness for current single scheme
  const allSingleDocs = useMemo(() => {
    const list: string[] = [];
    currentRoadmap.tier1BaseIdentity.forEach((d) => list.push(d.name));
    currentRoadmap.tier2StatutoryCertificates.forEach((c) => list.push(c.certificateId));
    currentRoadmap.tier3Institutional.forEach((i) => list.push(i.name));
    return list;
  }, [currentRoadmap]);

  const readyCount = allSingleDocs.filter((id) => checkedItems[id]).length;
  const readinessPercent = allSingleDocs.length > 0 ? Math.round((readyCount / allSingleDocs.length) * 100) : 0;

  return (
    <div className="space-y-8 font-sans">
      {/* Overview Banner & Mode Switcher */}
      <div className="luxury-hero-gradient rounded-2xl p-6 sm:p-8 text-white shadow-md border border-[#DFB738]/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#152864] px-3.5 py-1 text-xs font-bold text-[#F5E29F] border border-[#DFB738]/40">
              <Sparkles className="size-3.5 text-[#DFB738]" />
              <span>Dedicated Civic Dependency Engine</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-tight">
              {isWorkspaceMode
                ? `Roadmap & Verification Gates for ${currentRoadmap.shortCode}`
                : "Scheme-Specific Roadmaps & Multi-Scheme Dependency Merger"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {isWorkspaceMode
                ? `Follow the exact 4-tier prerequisites, issuing authorities, and statutory timeline milestones for ${currentRoadmap.schemeTitle}.`
                : "Different government benefits demand completely different proofs and issuing authorities. Explore the exact, dedicated roadmap for any scheme below, or merge them into a single-visit action plan."}
            </p>
          </div>

          {/* Mode Selector Toggle & Print */}
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            {!isWorkspaceMode && (
              <div className="flex items-center gap-1.5 rounded-xl bg-[#071233]/90 p-1.5 border border-[#DFB738]/30 shadow-inner">
                <button
                  onClick={() => setViewMode("SINGLE")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "SINGLE"
                      ? "bg-[#152864] text-[#F5E29F] ring-1 ring-[#DFB738]/50 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <FileText className="size-4" />
                  <span>Specific Scheme Roadmap</span>
                </button>
                <button
                  onClick={() => setViewMode("MERGED")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "MERGED"
                      ? "bg-[#152864] text-[#F5E29F] ring-1 ring-[#DFB738]/50 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Layers className="size-4" />
                  <span>Merge Multiple Schemes</span>
                </button>
              </div>
            )}

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-[#F5E29F] hover:bg-[#FAF0C8] text-[#0B1B4F] px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-[#DFB738] shadow-sm"
            >
              <Printer className="size-4 text-[#0B1B4F]" />
              <span>Print Roadmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DEDICATED SINGLE SCHEME ROADMAP */}
      {/* ========================================================================= */}
      {viewMode === "SINGLE" && (
        <div className="space-y-6">
          {/* Scheme Selection Bar (Only rendered outside dedicated scheme workspace) */}
          {!isWorkspaceMode && (
            <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EDE6DD] pb-3.5">
                <div>
                  <label className="text-xs font-bold text-[#0B1B4F] uppercase tracking-wider block font-serif">
                    Select Specific Target Scheme / Service:
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Every scheme displays its own exclusive prerequisites, authorities, and 5-stage verification timeline.
                  </p>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setCategoryFilter("ALL")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                      categoryFilter === "ALL"
                        ? "bg-[#0B1B4F] text-[#F5E29F] font-bold border border-[#DFB738]/40 shadow-xs"
                        : "bg-[#FAF7F2] text-slate-700 hover:bg-[#F4ECE1] border border-[#EDE6DD]"
                    }`}
                  >
                    All ({SCHEMES_DATABASE.length})
                  </button>
                  {userState && (
                    <button
                      onClick={() => setCategoryFilter("MY_STATE")}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold cursor-pointer transition-colors ${
                        categoryFilter === "MY_STATE"
                          ? "bg-[#0B1B4F] text-[#F5E29F] font-bold border border-[#DFB738]/40 shadow-xs"
                          : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
                      }`}
                    >
                      <MapPin className="size-3" />
                      My State ({userState})
                    </button>
                  )}
                  <button
                    onClick={() => setCategoryFilter("CENTRAL")}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                      categoryFilter === "CENTRAL"
                        ? "bg-[#0B1B4F] text-[#F5E29F] font-bold border border-[#DFB738]/40 shadow-xs"
                        : "bg-[#FAF7F2] text-slate-700 hover:bg-[#F4ECE1] border border-[#EDE6DD]"
                    }`}
                  >
                    <Building2 className="size-3" />
                    Central Gov
                  </button>
                  <button
                    onClick={() => setCategoryFilter("HEALTHCARE")}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                      categoryFilter === "HEALTHCARE"
                        ? "bg-[#0B1B4F] text-[#F5E29F] font-bold border border-[#DFB738]/40 shadow-xs"
                        : "bg-[#FAF7F2] text-slate-700 hover:bg-[#F4ECE1] border border-[#EDE6DD]"
                    }`}
                  >
                    <Hospital className="size-3" />
                    Medical Relief
                  </button>
                  <button
                    onClick={() => setCategoryFilter("SCHOLARSHIP")}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                      categoryFilter === "SCHOLARSHIP"
                        ? "bg-[#0B1B4F] text-[#F5E29F] font-bold border border-[#DFB738]/40 shadow-xs"
                        : "bg-[#FAF7F2] text-slate-700 hover:bg-[#F4ECE1] border border-[#EDE6DD]"
                    }`}
                  >
                    <GraduationCap className="size-3" />
                    Scholarships
                  </button>
                  <button
                    onClick={() => setCategoryFilter("CERTIFICATE")}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                      categoryFilter === "CERTIFICATE"
                        ? "bg-[#0B1B4F] text-[#F5E29F] font-bold border border-[#DFB738]/40 shadow-xs"
                        : "bg-[#FAF7F2] text-slate-700 hover:bg-[#F4ECE1] border border-[#EDE6DD]"
                    }`}
                  >
                    <ShieldCheck className="size-3" />
                    Certificates
                  </button>
                  <button
                    onClick={() => setCategoryFilter("OFFLINE")}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                      categoryFilter === "OFFLINE"
                        ? "bg-purple-900 text-purple-100 font-bold border border-purple-400/50 shadow-xs"
                        : "bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200"
                    }`}
                  >
                    <Building2 className="size-3 text-purple-700" />
                    🏛️ 100% Offline (FRA / Patta)
                  </button>
                </div>
              </div>

              {/* Scheme Dropdown & Quick Badges */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableSchemes.map((s) => {
                  const isSelected = s.id === selectedSchemeId;
                  const isMedical = s.type === "healthcare";
                  const isCert = s.type === "certificate";
                  const isTotallyOffline = s.id.includes("FRA") || s.id.includes("Jungle") || s.id.includes("RoFR") || !s.officialPortalUrl;
                  const isTotallyOnline = s.id.includes("Vidyalaxmi") || s.id.includes("Pragati") || s.id.includes("Ishaan");

                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSchemeId(s.id);
                        if (onSelectScheme) onSelectScheme(s.id);
                      }}
                      className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-[#DFB738] bg-[#FAF7F2] shadow-sm ring-1 ring-[#DFB738]"
                          : "border-[#EDE6DD] bg-white hover:bg-[#FAF7F2]/60 hover:border-[#DFC8A5]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className={`font-mono text-[10px] font-bold rounded px-2 py-0.5 ${
                              isMedical
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : isCert
                                ? "bg-sky-50 text-sky-800 border border-sky-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {s.shortCode}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isTotallyOffline ? (
                              <span className="rounded bg-purple-100 border border-purple-300 px-1.5 py-0.2 text-[9px] font-bold text-purple-900">
                                🏛️ Offline Desk
                              </span>
                            ) : isTotallyOnline ? (
                              <span className="rounded bg-sky-100 border border-sky-300 px-1.5 py-0.2 text-[9px] font-bold text-sky-900">
                                🌐 100% Online
                              </span>
                            ) : (
                              <span className="rounded bg-amber-100 border border-amber-300 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">
                                ⚡ Hybrid
                              </span>
                            )}
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-[#0B1B4F]">
                                <Check className="size-3 text-[#DFB738]" /> Active
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-[#0B1B4F] line-clamp-2 leading-snug font-serif">
                          {s.title}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#EDE6DD] flex items-center justify-between text-[11px] text-slate-500">
                        <span>{s.level} • {s.type}</span>
                        <span className="font-semibold text-[#0B1B4F] truncate max-w-[140px]">
                          {s.benefitAmount.split("+")[0]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Scheme Focus Card */}
          <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#EDE6DD] pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#0B1B4F] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#F5E29F] uppercase">
                    {currentRoadmap.shortCode}
                  </span>
                  <span className="rounded bg-[#FAF7F2] border border-[#DFC8A5] px-2 py-0.5 text-[11px] font-bold text-[#0B1B4F]">
                    {currentRoadmap.categoryLabel}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {currentRoadmap.sponsoringBody}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0B1B4F] font-serif">
                  {currentRoadmap.schemeTitle}
                </h2>
              </div>

              {/* Benefit & Fee Chips */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block font-serif">Official Benefit</span>
                  <span className="font-bold text-emerald-950">{currentRoadmap.benefitHeadline}</span>
                </div>
                <div className="rounded-xl bg-[#FAF7F2] border border-[#DFC8A5] px-4 py-2 text-xs">
                  <span className="text-[10px] text-[#0B1B4F] font-bold uppercase tracking-wider block font-serif">Official Fee</span>
                  <span className="font-bold text-[#0B1B4F]">{currentRoadmap.officialFee}</span>
                </div>
                <div className="rounded-xl bg-[#FAF7F2] border border-[#DFC8A5] px-4 py-2 text-xs">
                  <span className="text-[10px] text-[#0B1B4F] font-bold uppercase tracking-wider block font-serif">Statutory SLA</span>
                  <span className="font-bold text-[#0B1B4F]">{currentRoadmap.statutoryTimeLimit}</span>
                </div>
              </div>
            </div>

            {/* Application Modality Banner: 100% Online vs Hybrid vs 100% Offline */}
            {currentRoadmap.processMode === "TOTALLY_ONLINE" && (
              <div className="rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 p-4 text-sky-950 shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded-md bg-blue-700 text-white px-2.5 py-1 text-[11px] font-black tracking-wide shadow-xs">
                      <Globe className="size-3.5" />
                      100% ONLINE DIGITAL PORTAL
                    </span>
                    <span className="text-xs font-bold text-blue-900">Zero Physical Office Visits Required</span>
                  </div>
                  {currentRoadmap.portalUrl && (
                    <a
                      href={currentRoadmap.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs shrink-0"
                    >
                      <span>Open {currentRoadmap.portalName}</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-sky-900 leading-relaxed font-medium">
                  {currentRoadmap.processModeDescription}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-blue-800 font-semibold bg-white/70 rounded-lg p-2 border border-blue-200/60">
                  <span>💡 Statutory Digital SLA: Direct electronic processing via DigiLocker and automated loan/grant approval. All procedures execute on {currentRoadmap.portalName}.</span>
                </div>
              </div>
            )}

            {currentRoadmap.processMode === "HYBRID" && (
              <div className="rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-4 text-amber-950 shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded-md bg-amber-700 text-white px-2.5 py-1 text-[11px] font-black tracking-wide shadow-xs">
                      <Layers className="size-3.5" />
                      HYBRID APPLICATION WORKFLOW
                    </span>
                    <span className="text-xs font-bold text-amber-900">Online Submission + Designated Local Field Desks</span>
                  </div>
                  {currentRoadmap.portalUrl && (
                    <a
                      href={currentRoadmap.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1B4F] hover:bg-[#152864] text-[#F5E29F] px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs border border-[#DFB738]/40 shrink-0"
                    >
                      <span>Open Official Portal</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {currentRoadmap.processModeDescription}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-amber-950 bg-white/70 rounded-lg p-2 border border-amber-200/60">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-amber-700 shrink-0" />
                    <span><strong>Designated Physical Desk:</strong> {currentRoadmap.offlineCounter}</span>
                  </div>
                  <span className="font-semibold text-amber-800">Field inquiry / Biometric authentication required</span>
                </div>
              </div>
            )}

            {currentRoadmap.processMode === "TOTALLY_OFFLINE" && (
              <div className="rounded-xl border border-purple-300 bg-gradient-to-r from-purple-50 via-slate-50 to-rose-50 p-4 text-purple-950 shadow-xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded-md bg-purple-900 text-purple-100 px-2.5 py-1 text-[11px] font-black tracking-wide shadow-xs">
                      <Building2 className="size-3.5" />
                      100% IN-PERSON PHYSICAL PROCESS ONLY
                    </span>
                    <span className="text-xs font-bold text-purple-950">Statutory Gram Sabha & Revenue Court Verification</span>
                  </div>
                  <span className="rounded-lg bg-purple-200/70 border border-purple-300 px-2.5 py-1 text-[11px] font-black text-purple-950">
                    Zero Authorized Online Portals
                  </span>
                </div>
                <p className="text-xs text-purple-900 leading-relaxed font-medium">
                  {currentRoadmap.processModeDescription}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-purple-950 font-bold bg-white/80 rounded-lg p-2.5 border border-purple-200">
                  <MapPin className="size-4 text-purple-700 shrink-0" />
                  <span>Mandatory Physical Counter: <span className="underline decoration-purple-400 font-black">{currentRoadmap.offlineCounter}</span></span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-rose-950 text-[11px]">
                  <ShieldAlert className="size-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong>Statutory Anti-Fraud Warning:</strong> Under Section 6 of the Forest Rights Act 2006, claims for forest land title deeds (Jungle Bhoomi Land Patta) can <em>strictly</em> be sanctioned only through physical quorum resolutions of the village Gram Sabha and joint ground surveys. Never pay fees or trust unverified third-party websites offering online pattas.
                  </div>
                </div>
              </div>
            )}

            {/* Live Document Readiness Meter */}
            <div className="rounded-xl border border-[#EDE6DD] bg-[#FAF7F2] p-4.5">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-bold text-[#0B1B4F] flex items-center gap-2 font-serif">
                  <Activity className="size-4 text-amber-700" />
                  Applicant Readiness for this Scheme: {readyCount} of {allSingleDocs.length} items verified
                </span>
                <span className="font-mono font-bold text-[#0B1B4F]">{readinessPercent}% Ready</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#EBDDCB] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    readinessPercent >= 80
                      ? "bg-emerald-600"
                      : readinessPercent >= 50
                      ? "bg-[#DFB738]"
                      : "bg-[#0B1B4F]"
                  }`}
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
            </div>

            {/* PART A: 3-Tier Visual Prerequisite Dependency Chain */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#0B1B4F] uppercase tracking-wider font-serif">
                  The Specific 3-Tier Prerequisite Chain
                </h4>
                <span className="text-xs text-slate-500">
                  Must be assembled from left to right
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* TIER 1: Foundational Base Identity */}
                <div className="rounded-xl border border-[#EDE6DD] bg-[#FAF7F2]/80 p-4.5 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded bg-[#0B1B4F] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#F5E29F] uppercase">
                        Tier 1: Base Proofs
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Foundational</span>
                    </div>
                    <h5 className="text-xs font-bold text-[#0B1B4F] mb-2 font-serif">
                      Primary Identity Documents
                    </h5>
                    <ul className="space-y-2.5">
                      {currentRoadmap.tier1BaseIdentity.map((doc, idx) => (
                        <li
                          key={idx}
                          onClick={() => toggleCheckItem(doc.name)}
                          className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer group"
                        >
                          <span className="mt-0.5 shrink-0 text-slate-400 group-hover:text-amber-700">
                            {checkedItems[doc.name] ? (
                              <CheckSquare className="size-4 text-emerald-600" />
                            ) : (
                              <Square className="size-4" />
                            )}
                          </span>
                          <div>
                            <span className="font-semibold block text-[#0B1B4F]">{doc.name}</span>
                            <span className="text-[11px] text-slate-500 leading-tight block">
                              {doc.requirement}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EDE6DD] flex items-center justify-between text-[11px] text-slate-500">
                    <span>Source: UIDAI & Civil Supplies</span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href="https://myaadhaar.uidai.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#0B1B4F] bg-white border border-[#DACBB8] hover:bg-[#FAF7F2]"
                        title="UIDAI myAadhaar e-KYC Portal"
                      >
                        <span>UIDAI e-KYC</span>
                        <ExternalLink className="size-2.5" />
                      </a>
                      <a
                        href="https://www.digilocker.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#0B1B4F] bg-white border border-[#DACBB8] hover:bg-[#FAF7F2]"
                        title="DigiLocker Official Portal"
                      >
                        <span>DigiLocker</span>
                        <ExternalLink className="size-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* TIER 2: Statutory Government Certificates */}
                <div className="rounded-xl border border-[#DFC8A5] bg-amber-50/40 p-4.5 relative flex flex-col justify-between shadow-2xs">
                  <div className="hidden lg:block absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full border border-[#DFC8A5] p-1 shadow-xs">
                    <ArrowRight className="size-3 text-amber-700" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded bg-amber-200 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-900 uppercase">
                        Tier 2: Statutory
                      </span>
                      <span className="text-[11px] text-amber-900 font-medium">Certificates</span>
                    </div>
                    <h5 className="text-xs font-bold text-[#0B1B4F] mb-2 font-serif">
                      Government Issued Proofs
                    </h5>

                    {currentRoadmap.tier2StatutoryCertificates.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        {currentRoadmap.type === "certificate"
                          ? "Statutory revenue service: Verified directly by Tahsildar / Revenue Inspector field inquiry."
                          : "No special caste or community certificates mandated for this general scheme."}
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {currentRoadmap.tier2StatutoryCertificates.map((cert, idx) => (
                          <li
                            key={idx}
                            onClick={() => toggleCheckItem(cert.certificateId)}
                            className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer group"
                          >
                            <span className="mt-0.5 shrink-0 text-slate-400 group-hover:text-amber-700">
                              {checkedItems[cert.certificateId] ? (
                                <CheckSquare className="size-4 text-emerald-600" />
                              ) : (
                                <Square className="size-4" />
                              )}
                            </span>
                            <div className="flex-1">
                              <span className="font-semibold block text-[#0B1B4F]">
                                {cert.name}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px]">
                                <span className="font-mono text-slate-500">{cert.authority}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-amber-800 font-bold">{cert.turnaround}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[#0B1B4F]">{cert.statutoryCost}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                                {cert.keyCondition}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#DFC8A5]/60 flex items-center justify-between text-[11px] text-amber-900 font-medium">
                    <span>Tahsildar / Revenue Desk</span>
                    <a
                      href={userState === "Tamil Nadu" ? "https://www.tnesevai.tn.gov.in/" : "https://onlineap.meeseva.gov.in/"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-950 bg-white border border-amber-300 hover:bg-amber-100"
                      title={userState === "Tamil Nadu" ? "TNeGA e-Sevai Portal" : "AP MeeSeva Citizen Portal"}
                    >
                      <span>{userState === "Tamil Nadu" ? "e-Sevai Portal" : "MeeSeva Portal"}</span>
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                </div>

                {/* TIER 3: Institutional Verification & Banking Gateways */}
                <div className="rounded-xl border border-[#DFC8A5] bg-[#FAF7F2]/80 p-4.5 relative flex flex-col justify-between shadow-2xs">
                  <div className="hidden lg:block absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full border border-[#DFC8A5] p-1 shadow-xs">
                    <ArrowRight className="size-3 text-amber-700" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded bg-[#0B1B4F] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#F5E29F] uppercase">
                        Tier 3: Institutional
                      </span>
                      <span className="text-[11px] text-[#0B1B4F] font-medium">Verification</span>
                    </div>
                    <h5 className="text-xs font-bold text-[#0B1B4F] mb-2 font-serif">
                      {currentRoadmap.type === "healthcare"
                        ? "Clinical Requisitions & Pre-Auth"
                        : currentRoadmap.type === "certificate"
                        ? "Revenue Desk & Inquiry Clearance"
                        : "Academic & Banking Clearance"}
                    </h5>
                    <ul className="space-y-2.5">
                      {currentRoadmap.tier3Institutional.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => toggleCheckItem(item.name)}
                          className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer group"
                        >
                          <span className="mt-0.5 shrink-0 text-slate-400 group-hover:text-amber-700">
                            {checkedItems[item.name] ? (
                              <CheckSquare className="size-4 text-emerald-600" />
                            ) : (
                              <Square className="size-4" />
                            )}
                          </span>
                          <div>
                            <span className="font-semibold block text-[#0B1B4F]">{item.name}</span>
                            <span className="text-[11px] text-slate-600 leading-tight block">
                              Authority: {item.authority}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {item.action}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EDE6DD] flex items-center justify-between text-[11px] text-[#0B1B4F] font-semibold">
                    <span>Banking: {currentRoadmap.bankingRequirement}</span>
                    <a
                      href="https://myaadhaar.uidai.gov.in/check-aadhaar-bank-seeding-status"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-indigo-900 bg-white border border-indigo-200 hover:bg-indigo-50"
                      title="Check NPCI Aadhaar Bank Seeding Status"
                    >
                      <span>Check NPCI Seeding</span>
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* PART B: Dynamic Life Cycle Pipeline & Office Desks */}
            <div className="space-y-4 pt-4 border-t border-[#EDE6DD]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#0B1B4F] uppercase tracking-wider font-serif">
                    Official {currentRoadmap.stages.length}-Stage Processing Timeline & Office Desks
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step-by-step verification pipeline tailored specifically to this scheme across responsible government desks.
                  </p>
                </div>
                <span className="rounded-md bg-[#FAF7F2] border border-[#DFC8A5] px-2.5 py-1 text-xs font-bold text-[#0B1B4F]">
                  {currentRoadmap.stages.length} Verification Desks
                </span>
              </div>

              <div className={`grid gap-3 sm:grid-cols-2 ${
                currentRoadmap.stages.length === 3
                  ? "lg:grid-cols-3"
                  : currentRoadmap.stages.length === 4
                  ? "lg:grid-cols-4"
                  : "lg:grid-cols-5"
              }`}>
                {currentRoadmap.stages.map((stage) => (
                  <div
                    key={stage.stageNumber}
                    className="luxury-card rounded-xl p-4.5 flex flex-col justify-between border-[#EDE6DD]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#0B1B4F] text-xs font-bold text-[#F5E29F] font-serif shadow-xs">
                          {stage.stageNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {stage.stageMode === "ONLINE" && (
                            <span className="inline-block rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-blue-900 tracking-wide">
                              🌐 Online
                            </span>
                          )}
                          {stage.stageMode === "OFFLINE" && (
                            <span className="inline-block rounded bg-purple-50 border border-purple-200 px-1.5 py-0.5 text-[9px] font-bold text-purple-900 tracking-wide">
                              🏛️ Physical Desk
                            </span>
                          )}
                          {stage.stageMode === "HYBRID" && (
                            <span className="inline-block rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 tracking-wide">
                              ⚡ Hybrid
                            </span>
                          )}
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            {stage.timeline}
                          </span>
                        </div>
                      </div>

                      {stage.officeType && (
                        <div className="mb-1.5">
                          <span className="inline-block rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-900 tracking-wide">
                            🏢 {stage.officeType}
                          </span>
                        </div>
                      )}

                      <h5 className="text-xs font-bold text-[#0B1B4F] leading-snug font-serif">
                        {stage.stageName}
                      </h5>
                      <span className="text-[10px] font-bold text-slate-600 block mt-0.5">
                        Responsible: <strong className="text-amber-900">{stage.actor}</strong>
                      </span>
                      <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                        {stage.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#EDE6DD] space-y-1.5">
                      {stage.physicalDeskLocation && (
                        <div className="rounded bg-purple-50/80 border border-purple-200 p-1.5 text-[10px] text-purple-950 font-medium flex items-start gap-1.5">
                          <MapPin className="size-3 text-purple-700 shrink-0 mt-0.5" />
                          <span><strong>Location:</strong> {stage.physicalDeskLocation}</span>
                        </div>
                      )}
                      <div className="rounded bg-emerald-50 border border-emerald-100 p-1.5 text-[10px] text-emerald-950 font-medium">
                        <strong>Action:</strong> {stage.actionItem}
                      </div>
                      <div className="rounded bg-rose-50 border border-rose-100 p-1.5 text-[10px] text-rose-950 font-medium">
                        <strong>Rejection Risk:</strong> {stage.commonPitfall}
                      </div>
                      {stage.portalLink && (
                        <a
                          href={stage.portalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 w-full rounded-md bg-blue-700 hover:bg-blue-800 text-white p-1.5 text-[10px] font-bold transition-colors shadow-2xs mt-1"
                        >
                          <span>{stage.portalActionText || "Open Stage Portal"}</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PART C: Direct Portal & Offline Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-[#FAF7F2] p-4.5 border border-[#DFC8A5]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <MapPin className="size-4 text-amber-700 shrink-0" />
                  <span><strong>Physical Counter:</strong> {currentRoadmap.offlineCounter}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Official Portal: <strong>{currentRoadmap.portalName}</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {currentRoadmap.processMode === "TOTALLY_OFFLINE" ? (
                  <div className="flex items-center gap-2 rounded-lg bg-purple-900 px-4 py-2 text-xs font-bold text-purple-100 shadow-md">
                    <MapPin className="size-4 text-purple-300 shrink-0" />
                    <span>In-Person Physical Submission: Proceed to {currentRoadmap.offlineCounter}</span>
                  </div>
                ) : (
                  currentRoadmap.portalUrl && (
                    <a
                      href={currentRoadmap.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 rounded-lg px-4.5 py-2 text-xs font-bold transition-all shadow-md ${
                        currentRoadmap.processMode === "TOTALLY_ONLINE"
                          ? "bg-blue-700 hover:bg-blue-800 text-white"
                          : "bg-[#0B1B4F] text-[#F5E29F] hover:bg-[#152864] border border-[#DFB738]/40"
                      }`}
                    >
                      <span>Open Official Portal</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Rejection Checklist */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4.5 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs font-serif">
                <AlertTriangle className="size-4 text-amber-600" />
                <span>Critical Precautions to Prevent Rejection for {currentRoadmap.shortCode}:</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
                {currentRoadmap.rejectionChecklist.map((item, idx) => (
                  <div key={idx} className="rounded-lg bg-white p-3.5 border border-amber-200/80 shadow-2xs">
                    <p className="font-bold text-[#0B1B4F] mb-1 font-serif">{item.check}</p>
                    <p className="text-[11px] text-slate-600">{item.resolution}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* PART D: LIVE INTERACTIVE APPLICATION STATUS TRACKER & MILESTONE CHECKLIST */}
            <InteractiveApplicationTracker
              schemeId={currentRoadmap.schemeId}
              schemeTitle={currentRoadmap.schemeTitle}
              shortCode={currentRoadmap.shortCode}
              stages={currentRoadmap.stages}
              checklistItems={currentRoadmap.rejectionChecklist.map((item, idx) => ({
                id: `check_${currentRoadmap.schemeId}_${idx}`,
                label: item.check,
                isMandatory: true,
              }))}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MERGED MULTI-SCHEME DEPENDENCY MATRIX */}
      {/* ========================================================================= */}
      {viewMode === "MERGED" && (
        <div className="space-y-6">
          {/* Multi-Scheme Selection Panel */}
          <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EDE6DD] pb-3.5">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0B1B4F] uppercase tracking-wider font-serif">
                  Select Schemes to Merge into a Single Action Plan
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  See shared prerequisites, avoid making duplicate visits to government offices, and get an integrated single-visit roadmap.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {userState === "Andhra Pradesh" && (
                  <>
                    <button
                      onClick={() =>
                        setMergedSelection(["AP_Jagananna_Vidya_Deevena", "AP_YSR_Aarogyasri", "AP_Integrated_Community_Cert"])
                      }
                      className="rounded-lg bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#0B1B4F] hover:bg-[#F4ECE1] hover:border-[#DFB738] transition-all cursor-pointer border border-[#DFC8A5] shadow-2xs"
                    >
                      Combo: AP Vidya Deevena + YSR Aarogyasri
                    </button>
                    <button
                      onClick={() =>
                        setMergedSelection(["AP_Amma_Vodi", "AP_YSR_Aarogyasri", "Income_Certificate"])
                      }
                      className="rounded-lg bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#0B1B4F] hover:bg-[#F4ECE1] hover:border-[#DFB738] transition-all cursor-pointer border border-[#DFC8A5] shadow-2xs"
                    >
                      Combo: Amma Vodi + Aarogyasri
                    </button>
                  </>
                )}

                {userState === "Tamil Nadu" && (
                  <>
                    <button
                      onClick={() =>
                        setMergedSelection(["TN_Pudhumai_Penn", "TN_CMCHIS_Medical", "TN_First_Graduate"])
                      }
                      className="rounded-lg bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#0B1B4F] hover:bg-[#F4ECE1] hover:border-[#DFB738] transition-all cursor-pointer border border-[#DFC8A5] shadow-2xs"
                    >
                      Combo: TN Pudhumai Penn + CMCHIS Health
                    </button>
                    <button
                      onClick={() =>
                        setMergedSelection(["TN_7_5_Govt_School_Quota", "TN_CMCHIS_Medical", "Income_Certificate"])
                      }
                      className="rounded-lg bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#0B1B4F] hover:bg-[#F4ECE1] hover:border-[#DFB738] transition-all cursor-pointer border border-[#DFC8A5] shadow-2xs"
                    >
                      Combo: TN 7.5% Quota + CMCHIS
                    </button>
                  </>
                )}

                <button
                  onClick={() =>
                    setMergedSelection(["PostMatric_ST", "Ayushman_PMJAY", "Income_Certificate"])
                  }
                  className="rounded-lg bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#0B1B4F] hover:bg-[#F4ECE1] hover:border-[#DFB738] transition-all cursor-pointer border border-[#DFC8A5] shadow-2xs"
                >
                  Combo: ST Scholarship + PM-JAY Relief
                </button>
                <button
                  onClick={() =>
                    setMergedSelection(["AICTE_Pragati", "Ayushman_PMJAY", "Income_Certificate"])
                  }
                  className="rounded-lg bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#0B1B4F] hover:bg-[#F4ECE1] hover:border-[#DFB738] transition-all cursor-pointer border border-[#DFC8A5] shadow-2xs"
                >
                  Combo: Girl Tech Student + Medical
                </button>
              </div>
            </div>

            {/* Checkbox Grid for All Schemes */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {SCHEMES_DATABASE.map((scheme) => {
                const isChecked = mergedSelection.includes(scheme.id);
                return (
                  <label
                    key={scheme.id}
                    className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs cursor-pointer transition-all ${
                      isChecked
                        ? "border-[#DFB738] bg-[#FAF7F2] shadow-sm ring-1 ring-[#DFB738]"
                        : "border-[#EDE6DD] bg-white hover:bg-[#FAF7F2]/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleMergedScheme(scheme.id)}
                      className="mt-0.5 rounded text-[#0B1B4F] focus:ring-[#DFB738] size-4 accent-[#0B1B4F]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-slate-500">
                          {scheme.shortCode}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800">
                          {scheme.type}
                        </span>
                      </div>
                      <span className="font-bold text-[#0B1B4F] block truncate font-serif">
                        {scheme.title}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                        {scheme.benefitAmount}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Merged Highlights Banner */}
          <div className="rounded-2xl border border-[#DFB738]/40 bg-[#FAF7F2] p-5.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-serif">
                  Merged Multi-Scheme Impact ({mergedData.selectedSchemes.length} Schemes Selected)
                </span>
                <h3 className="text-lg font-bold text-[#0B1B4F] font-serif">
                  Combined Welfare Value: {mergedData.totalCombinedBenefit}
                </h3>
                <p className="text-xs text-slate-600">
                  Total Statutory Government Fee: <strong className="text-[#0B1B4F]">{mergedData.totalStatutoryFees}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 bg-emerald-50 rounded-xl px-3.5 py-2.5 border border-emerald-200">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>
                  {mergedData.sharedStatutoryCertificates.filter((c) => c.isOverlapping).length} Shared Certificates Detected (Zero Duplication)
                </span>
              </div>
            </div>
          </div>

          {/* 1. Shared Statutory Certificates (The Synergy Engine) */}
          <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE6DD] pb-3.5">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0B1B4F] uppercase tracking-wider font-serif">
                  Shared Statutory Certificates (Apply Once, Use Everywhere)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instead of paying multiple times, these certificates simultaneously satisfy multiple schemes.
                </p>
              </div>
              <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900 font-serif">
                Overlapping Prerequisites
              </span>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {mergedData.sharedStatutoryCertificates.map((cert) => (
                <div
                  key={cert.certificateId}
                  className={`rounded-xl border p-4.5 flex flex-col justify-between transition-all ${
                    cert.isOverlapping
                      ? "border-[#DFB738] bg-[#FAF7F2] shadow-sm ring-1 ring-[#DFB738]/50"
                      : "border-[#EDE6DD] bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-xs text-[#0B1B4F] font-serif">{cert.name}</span>
                      {cert.isOverlapping && (
                        <span className="rounded-full bg-[#0B1B4F] px-2.5 py-0.5 text-[10px] font-bold text-[#F5E29F] font-serif">
                          Used in {cert.sharedCount} Schemes
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div>Authority: <strong>{cert.authority}</strong></div>
                      <div>Statutory Fee: <strong>{cert.statutoryCost}</strong></div>
                      <div>RTSA Turnaround: <strong>{cert.turnaround}</strong></div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#EDE6DD] text-[10px] font-medium text-slate-500">
                    Unlocks: {cert.usedInSchemes.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Consolidated Physical Visit Plan */}
          <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE6DD] pb-3.5">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0B1B4F] uppercase tracking-wider font-serif">
                  The Single-Visit Physical Action Plan
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidated stops to accomplish all requirements with zero wasted trips.
                </p>
              </div>
              <span className="rounded-md bg-[#FAF7F2] border border-[#DFC8A5] px-2.5 py-0.5 text-xs font-bold text-[#0B1B4F]">
                Route Efficiency
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {mergedData.consolidatedVisitPlan.map((visit, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#EDE6DD] bg-[#FAF7F2]/60 p-4.5 space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0B1B4F] text-xs font-bold text-[#F5E29F] font-serif mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-[#0B1B4F] font-serif">{visit.location}</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5">{visit.purpose}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-[#EDE6DD] text-xs space-y-1 shadow-2xs">
                    <span className="font-bold text-[#0B1B4F] text-[11px] block font-serif">
                      Documents to Carry:
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                      {visit.documentsToCarry.map((doc, dIdx) => (
                        <li key={dIdx}>{doc}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-[#0B1B4F]">
                      Fee: {visit.statutoryFee}
                    </span>
                    <span className="text-emerald-800 font-semibold">
                      💡 {visit.timeEfficiencyNote}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
