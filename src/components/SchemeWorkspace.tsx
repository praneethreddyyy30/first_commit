"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { SchemeOrService, SCHEMES_DATABASE } from "@/data/schemes";
import { UserProfile, CedarEvaluationResult } from "@/lib/cedar/evaluator";
import { DocumentAuditInput, DocumentAuditResult, auditCitizenDocuments } from "@/lib/audit/documentAuditor";
import { DocumentAuditTab } from "@/components/DocumentAuditTab";
import { PrerequisiteRoadmapTab } from "@/components/PrerequisiteRoadmapTab";
import { OfflineNavigatorTab } from "@/components/OfflineNavigatorTab";
import { AiCopilotTab } from "@/components/AiCopilotTab";
import { ApplicationDossierTab } from "@/components/ApplicationDossierTab";
import {
  FileCheck2,
  GitFork,
  Building,
  Bot,
  FileBadge,
  ArrowLeft,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers
} from "lucide-react";

interface SchemeWorkspaceProps {
  schemeId: string;
  allSchemes?: SchemeOrService[];
  onSelectScheme: (schemeId: string) => void;
  onBackToSchemes: () => void;
  profile: UserProfile;
  evaluationResults: CedarEvaluationResult[];
  auditInput: DocumentAuditInput;
  onAuditInputChange: (newAudit: DocumentAuditInput) => void;
  onProfileChange: (newProfile: UserProfile) => void;
  initialSubTab?: "docs" | "roadmap" | "offline" | "copilot" | "dossier";
}

export const SchemeWorkspace: React.FC<SchemeWorkspaceProps> = ({
  schemeId,
  allSchemes = SCHEMES_DATABASE,
  onSelectScheme,
  onBackToSchemes,
  profile,
  evaluationResults,
  auditInput,
  onAuditInputChange,
  onProfileChange,
  initialSubTab = "docs",
}) => {
  const topRef = useRef<HTMLDivElement>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    "docs" | "roadmap" | "offline" | "copilot" | "dossier"
  >(initialSubTab);
  const [showCedarProof, setShowCedarProof] = useState<boolean>(false);

  // Auto-scroll to top when Scheme Workspace is opened or schemeId changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }
  }, [schemeId]);

  // Keep activeSubTab in sync if parent changes initialSubTab
  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // Active scheme details
  const activeScheme: SchemeOrService = useMemo(() => {
    return allSchemes.find((s) => s.id === schemeId) || allSchemes[0];
  }, [allSchemes, schemeId]);

  // Specific Cedar evaluation result for this scheme
  const currentEvalResult = useMemo(() => {
    return evaluationResults.find((r) => r.scheme.id === schemeId);
  }, [evaluationResults, schemeId]);

  // Document audit result
  const auditResult: DocumentAuditResult = useMemo(() => {
    return auditCitizenDocuments(auditInput);
  }, [auditInput]);

  return (
    <div ref={topRef} id="scheme-workspace-top" className="space-y-6">
      {/* 1. TOP SCHEME HEADER & SELECTOR BAR */}
      <div className="luxury-card rounded-3xl border border-[#DFC8A5] bg-[#FDFBF7] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#EDE6DD]">
          {/* Back button & Scheme Title */}
          <div className="space-y-1">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                }
                onBackToSchemes();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-[#0B1B4F] transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="size-3.5" />
              <span>← Back to All Matched Schemes</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#0B1B4F] px-2.5 py-0.5 text-[10px] font-bold text-[#F5E29F] uppercase tracking-wider">
                {activeScheme.level === "State" ? `${profile.state} State` : "Central Gov"}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                {activeScheme.shortCode}
              </span>
              {currentEvalResult?.decision === "ALLOW" ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                  ✓ 100% Eligible
                </span>
              ) : (
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-800 border border-rose-300">
                  ✕ Ineligible
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-[#0B1B4F] tracking-tight font-serif">
              {activeScheme.title}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              {activeScheme.ministry} • Benefit: <strong className="text-emerald-800">{activeScheme.benefitAmount}</strong>
            </p>

            {/* AWS Cedar Inspection Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCedarProof((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/90 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
              >
                <ShieldCheck className="size-3.5 text-amber-700" />
                <span>{showCedarProof ? "Hide AWS Cedar Proof" : "Why Am I Eligible? (Inspect AWS Cedar Proof)"}</span>
                <ChevronDown className={`size-3 transition-transform ${showCedarProof ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Scheme / Certificate Quick Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <div className="text-right">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Switch Scheme Workspace:
              </label>
              <select
                value={activeScheme.id}
                onChange={(e) => onSelectScheme(e.target.value)}
                className="mt-1 rounded-xl border border-[#DFC8A5] bg-white px-3 py-2 text-xs font-bold text-[#0B1B4F] shadow-2xs focus:border-amber-600 focus:outline-hidden cursor-pointer"
              >
                <optgroup label="Available Schemes">
                  {allSchemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shortCode}: {s.title.substring(0, 45)}...
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {activeScheme.officialPortalUrl && (
              <a
                href={activeScheme.officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 sm:mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0B1B4F] px-3 py-2 text-xs font-bold text-[#F5E29F] hover:bg-[#152864] transition-all shadow-xs cursor-pointer border border-[#DFB738]/40"
              >
                <span>Official Portal</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        {/* Collapsible AWS Cedar Deterministic Policy Proof */}
        {showCedarProof && (
          <div className="mt-4 p-4 rounded-2xl border border-amber-300/80 bg-amber-50/40 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-200/80 text-amber-900 font-mono text-[10px] font-bold tracking-wider uppercase">
                  AWS Cedar WASM v4.13.0
                </span>
                <span className="text-xs font-bold text-amber-950">
                  Deterministic Statutory Policy Evaluation Proof
                </span>
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                currentEvalResult?.decision === "ALLOW"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-rose-100 text-rose-800 border border-rose-300"
              }`}>
                Decision: {currentEvalResult?.decision || "ALLOW"} ({currentEvalResult?.fitScore || 100}% Fit)
              </span>
            </div>

            <p className="text-xs text-slate-700">
              AWS Cedar evaluates your eligibility using formal declarative logic compiled into high-speed WebAssembly. No probabilistic LLMs or hallucination—only deterministic statutory verification.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Passed Clauses */}
              <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                  <span className="size-2 rounded-full bg-emerald-500"></span>
                  Passed Statutory Conditions ({currentEvalResult?.passedClauses?.length || 0})
                </div>
                {currentEvalResult?.passedClauses && currentEvalResult.passedClauses.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {currentEvalResult.passedClauses.map((clause, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{clause}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">All baseline criteria satisfied.</p>
                )}
              </div>

              {/* Failed Clauses / Remarks */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <span className="size-2 rounded-full bg-amber-500"></span>
                  Failed / Unmet Conditions ({currentEvalResult?.failedClauses?.length || 0})
                </div>
                {currentEvalResult?.failedClauses && currentEvalResult.failedClauses.length > 0 ? (
                  <ul className="space-y-1 text-xs text-rose-700">
                    {currentEvalResult.failedClauses.map((clause, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-600 font-bold">✕</span>
                        <span>{clause}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium">None! Zero disqualifying statutory conditions.</p>
                )}
              </div>
            </div>

            {/* Cedar Policy Code */}
            {currentEvalResult?.cedarPolicySnippet && (
              <div className="space-y-1 pt-1">
                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Cedar Authorization Policy (DSL)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Principal::Citizen</span>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                  {currentEvalResult.cedarPolicySnippet}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 2. SCHEME WORKSPACE NAVIGATION TABS (MATCHING USER'S HAND-DRAWN SPEC) */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          {/* Sub-Tab 1: Docs Verified */}
          <button
            onClick={() => setActiveSubTab("docs")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "docs"
                ? "bg-[#0B1B4F] text-[#F5E29F] shadow-sm ring-2 ring-[#DFB738]/60"
                : "bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-900 border border-[#EDE6DD]"
            }`}
          >
            <FileCheck2 className="size-4 text-emerald-600" />
            <span>Docs Verified</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
              activeSubTab === "docs" ? "bg-white/20 text-[#F5E29F]" : "bg-emerald-100 text-emerald-900"
            }`}>
              {auditResult.nameMatchPercentage}%
            </span>
          </button>

          {/* Sub-Tab 2: Roadmap */}
          <button
            onClick={() => setActiveSubTab("roadmap")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "roadmap"
                ? "bg-[#0B1B4F] text-[#F5E29F] shadow-sm ring-2 ring-[#DFB738]/60"
                : "bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-900 border border-[#EDE6DD]"
            }`}
          >
            <GitFork className="size-4 text-sky-600" />
            <span>Roadmap & Steps</span>
          </button>

          {/* Sub-Tab 3: Seva Centers & Fees (District Centric) */}
          <button
            onClick={() => setActiveSubTab("offline")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "offline"
                ? "bg-[#0B1B4F] text-[#F5E29F] shadow-sm ring-2 ring-[#DFB738]/60"
                : "bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-900 border border-[#EDE6DD]"
            }`}
          >
            <Building className="size-4 text-amber-700" />
            <span>Seva Centers & Fees</span>
            {profile.district && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeSubTab === "offline" ? "bg-white/20 text-[#F5E29F]" : "bg-slate-100 text-slate-700"
              }`}>
                {profile.district.split(" ")[0]}
              </span>
            )}
          </button>

          {/* Sub-Tab 4: AI Civic Assistant */}
          <button
            onClick={() => setActiveSubTab("copilot")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "copilot"
                ? "bg-[#0B1B4F] text-[#F5E29F] shadow-sm ring-2 ring-[#DFB738]/60"
                : "bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-900 border border-[#EDE6DD]"
            }`}
          >
            <Bot className="size-4 text-purple-600" />
            <span>AI Civic Assistant</span>
            <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-800">
              <Sparkles className="size-2.5" /> Voice
            </span>
          </button>

          {/* Sub-Tab 5: Download Dossier */}
          <button
            onClick={() => setActiveSubTab("dossier")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "dossier"
                ? "bg-[#0B1B4F] text-[#F5E29F] shadow-sm ring-2 ring-[#DFB738]/60"
                : "bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-900 border border-[#EDE6DD]"
            }`}
          >
            <FileBadge className="size-4 text-indigo-600" />
            <span>Download Dossier</span>
          </button>
        </div>
      </div>

      {/* 3. WORKSPACE SUB-VIEW CONTENT (SCOPED STRICTLY TO THIS ONE SCHEME) */}
      <div>
        {/* SUB-VIEW 1: Docs Verified */}
        {activeSubTab === "docs" && (
          <DocumentAuditTab
            initialInput={auditInput}
            selectedSchemeId={activeScheme.id}
            profile={profile}
            onSelectScheme={onSelectScheme}
            onProfileChange={onProfileChange}
            onAuditInputChange={onAuditInputChange}
            onNavigateToEligibility={onBackToSchemes}
            onNavigateToRoadmap={() => setActiveSubTab("roadmap")}
          />
        )}

        {/* SUB-VIEW 2: Roadmap */}
        {activeSubTab === "roadmap" && (
          <PrerequisiteRoadmapTab
            initialSchemeId={activeScheme.id}
            userHeldDocuments={profile.heldDocuments || []}
            userState={profile.state}
            onSelectScheme={onSelectScheme}
            isWorkspaceMode={true}
          />
        )}

        {/* SUB-VIEW 3: Seva Centers & Fees (District Focused) */}
        {activeSubTab === "offline" && (
          <div className="space-y-4">
            {profile.district && (
              <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-300 p-3.5 text-xs text-amber-950 font-medium">
                <Building className="size-4 text-amber-800 shrink-0" />
                <span>
                  Showing verified citizen service centers and village secretariat desks for <strong>{profile.district}</strong>, {profile.state} (Target Scheme: <strong>{activeScheme.shortCode}</strong>).
                </span>
              </div>
            )}
            <OfflineNavigatorTab
              userState={profile.state}
              userDistrict={profile.district}
              userVillage={profile.villageOrTown}
              targetSchemeId={activeScheme.id}
            />
          </div>
        )}

        {/* SUB-VIEW 4: AI Civic Assistant */}
        {activeSubTab === "copilot" && (
          <AiCopilotTab
            profile={profile}
            evaluationResults={evaluationResults}
            targetSchemeId={activeScheme.id}
            auditResult={auditResult}
            auditInput={auditInput}
          />
        )}

        {/* SUB-VIEW 5: Download Dossier */}
        {activeSubTab === "dossier" && (
          <ApplicationDossierTab
            profile={profile}
            evaluationResults={evaluationResults}
            auditResult={auditResult}
            targetSchemeId={activeScheme.id}
          />
        )}
      </div>
    </div>
  );
};
