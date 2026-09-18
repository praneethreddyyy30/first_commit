"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { AwsArchitectureModal } from "@/components/AwsArchitectureModal";
import { CitizenProfilePage } from "@/components/CitizenProfilePage";
import { EligibilityTab } from "@/components/EligibilityTab";
import { DocumentAuditTab } from "@/components/DocumentAuditTab";
import { PrerequisiteRoadmapTab } from "@/components/PrerequisiteRoadmapTab";
import { OfflineNavigatorTab } from "@/components/OfflineNavigatorTab";
import { AiCopilotTab } from "@/components/AiCopilotTab";
import { ApplicationDossierTab } from "@/components/ApplicationDossierTab";
import {
  DEMO_PERSONAS,
  DemoPersona,
  BLANK_CITIZEN_PROFILE,
  BLANK_CITIZEN_AUDIT
} from "@/data/demoPersonas";
import { evaluateCedarPolicies, UserProfile } from "@/lib/cedar/evaluator";
import { auditCitizenDocuments, DocumentAuditInput } from "@/lib/audit/documentAuditor";
import {
  User,
  ShieldCheck,
  FileCheck2,
  GitFork,
  Building,
  Bot,
  FileBadge,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function Home() {
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);

  // Tab State: Opens to Official Citizen Profile by default
  const [activeTab, setActiveTab] = useState<
    "profile" | "schemes" | "audit" | "roadmap" | "offline" | "copilot" | "dossier"
  >("profile");

  // Master Citizen Profile (Initial: Kavitha Selvam, Tamil Nadu)
  const [profile, setProfile] = useState<UserProfile>(DEMO_PERSONAS[0].profile);
  const [auditInput, setAuditInput] = useState<DocumentAuditInput>(DEMO_PERSONAS[0].auditInput);
  const [targetSchemeId, setTargetSchemeId] = useState<string>("TN_Pudhumai_Penn");

  // Restore saved profile on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("jansetu_user_profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          if (parsed.state === "Andhra Pradesh") {
            setTargetSchemeId("AP_Jagananna_Vidya_Deevena");
          }
        }
      } catch (e) {
        console.error("Failed to restore saved profile", e);
      }
    }
  }, []);

  const handleProfileChange = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setAuditInput((prev) => ({
      ...prev,
      nameOnAadhaar: newProfile.name || "",
    }));
    if (newProfile.state === "Andhra Pradesh" && targetSchemeId.startsWith("TN_")) {
      setTargetSchemeId("AP_Jagananna_Vidya_Deevena");
    } else if (newProfile.state === "Tamil Nadu" && targetSchemeId.startsWith("AP_")) {
      setTargetSchemeId("TN_Pudhumai_Penn");
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("jansetu_user_profile", JSON.stringify(newProfile));
      } catch (e) {
        console.error("Failed to persist profile", e);
      }
    }
  };

  // Live Cedar policy evaluation
  const evaluationResults = useMemo(() => {
    return evaluateCedarPolicies(profile);
  }, [profile]);

  // Live document audit
  const auditResult = useMemo(() => {
    return auditCitizenDocuments(auditInput);
  }, [auditInput]);

  const eligibleCount = evaluationResults.filter((r) => r.decision === "ALLOW").length;

  const handleSelectPersona = (persona: DemoPersona) => {
    handleProfileChange(persona.profile);
    setAuditInput(persona.auditInput);
    if (persona.profile.state === "Andhra Pradesh") {
      setTargetSchemeId("AP_Jagananna_Vidya_Deevena");
    } else if (persona.profile.state === "Tamil Nadu") {
      setTargetSchemeId("TN_Pudhumai_Penn");
    } else {
      setTargetSchemeId("PostMatric_ST");
    }
  };

  const handleResetToBlank = () => {
    handleProfileChange(BLANK_CITIZEN_PROFILE);
    setAuditInput(BLANK_CITIZEN_AUDIT);
    setActiveTab("profile");
  };

  const handleNavigateToDocuments = (schemeId?: string) => {
    if (schemeId) {
      setTargetSchemeId(schemeId);
    }
    setActiveTab("audit");
  };

  const handleNavigateToRoadmap = (schemeId?: string) => {
    if (schemeId) {
      setTargetSchemeId(schemeId);
    }
    setActiveTab("roadmap");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Official Gov Header */}
      <Header
        activeProfileName={profile.name}
        onSelectPersona={handleSelectPersona}
        onResetToBlank={handleResetToBlank}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* 3-Step Guided Journey & Utility Bar */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Primary 3-Step Stepper */}
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xs scrollbar-none">
            {/* Step 1: Profile */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-black ${
                activeTab === "profile" ? "bg-white text-indigo-700" : "bg-slate-100 text-slate-700"
              }`}>
                1
              </span>
              <span>Your Profile</span>
              <span
                className={`hidden sm:inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "profile"
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {profile.state.split(" ")[0]}
              </span>
            </button>

            <ChevronRight className="size-4 text-slate-300 shrink-0" />

            {/* Step 2: Matched Schemes */}
            <button
              onClick={() => setActiveTab("schemes")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "schemes"
                  ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-black ${
                activeTab === "schemes" ? "bg-white text-indigo-700" : "bg-slate-100 text-slate-700"
              }`}>
                2
              </span>
              <span>Matched Schemes</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeTab === "schemes"
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {eligibleCount} Qualified
              </span>
            </button>

            <ChevronRight className="size-4 text-slate-300 shrink-0" />

            {/* Step 3: Document & Name Check */}
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "audit"
                  ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-black ${
                activeTab === "audit" ? "bg-white text-indigo-700" : "bg-slate-100 text-slate-700"
              }`}>
                3
              </span>
              <span>Document Audit</span>
              {auditResult.npciStatus !== "SEEDED" ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 border border-amber-300">
                  Action Needed
                </span>
              ) : (
                <span className="hidden sm:inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  Pre-Flight
                </span>
              )}
            </button>
          </div>

          {/* Secondary Tools & Utilities */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xs scrollbar-none">
            {/* Tool 1: Roadmap */}
            <button
              onClick={() => setActiveTab("roadmap")}
              title="Official Government Steps & Application Roadmap"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "roadmap"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <GitFork className="size-3.5" />
              <span>Roadmap</span>
            </button>

            {/* Tool 2: Seva Centers */}
            <button
              onClick={() => setActiveTab("offline")}
              title="Nearby Citizen Service Centers and Statutory Fee Schedules"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "offline"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Building className="size-3.5" />
              <span>Seva Centers</span>
            </button>

            {/* Tool 3: Bedrock AI Copilot */}
            <button
              onClick={() => setActiveTab("copilot")}
              title="Ask AI Civic Copilot about any scheme rule or criteria"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "copilot"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Bot className="size-3.5 text-indigo-600" />
              <span>AI Copilot</span>
              <span className="flex items-center gap-0.5 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
                <Sparkles className="size-2" /> Voice
              </span>
            </button>

            {/* Tool 4: Dossier */}
            <button
              onClick={() => setActiveTab("dossier")}
              title="Download consolidated PDF dossier for this citizen"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "dossier"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <FileBadge className="size-3.5" />
              <span>Dossier</span>
            </button>
          </div>
        </div>

        {/* Tab Views */}
        <div>
          {/* View 1: Citizen Master Profile Page (Default Entry Point) */}
          {activeTab === "profile" && (
            <CitizenProfilePage
              profile={profile}
              evaluationResults={evaluationResults}
              onProfileChange={handleProfileChange}
              onAuditInputChange={(newAudit) => setAuditInput(newAudit)}
              onNavigateToSchemes={() => setActiveTab("schemes")}
              onNavigateToAudit={() => setActiveTab("audit")}
            />
          )}

          {/* View 2: Scheme Discovery & Eligibility Dashboard */}
          {activeTab === "schemes" && (
            <EligibilityTab
              profile={profile}
              evaluationResults={evaluationResults}
              onProfileChange={handleProfileChange}
              onNavigateToProfile={() => setActiveTab("profile")}
              onNavigateToDocuments={handleNavigateToDocuments}
              onNavigateToRoadmap={handleNavigateToRoadmap}
            />
          )}

          {/* View 3: Scheme-Centric Pre-Flight Document Audit */}
          {activeTab === "audit" && (
            <DocumentAuditTab
              initialInput={auditInput}
              selectedSchemeId={targetSchemeId}
              profile={profile}
              onSelectScheme={(id) => setTargetSchemeId(id)}
              onProfileChange={handleProfileChange}
              onNavigateToEligibility={() => setActiveTab("schemes")}
              onNavigateToRoadmap={handleNavigateToRoadmap}
            />
          )}

          {/* View 4: Scheme-Centric Application Roadmap */}
          {activeTab === "roadmap" && (
            <PrerequisiteRoadmapTab
              initialSchemeId={targetSchemeId}
              userHeldDocuments={profile.heldDocuments || []}
              userState={profile.state}
              onSelectScheme={(id) => setTargetSchemeId(id)}
            />
          )}

          {/* View 5: Offline Seva Centers & Anti-Extortion Fee Calculator */}
          {activeTab === "offline" && (
            <OfflineNavigatorTab
              userState={profile.state}
            />
          )}

          {/* View 6: Bedrock AI Copilot */}
          {activeTab === "copilot" && (
            <AiCopilotTab />
          )}

          {/* View 7: Application Dossier */}
          {activeTab === "dossier" && (
            <ApplicationDossierTab
              profile={profile}
              evaluationResults={evaluationResults}
              auditResult={auditResult}
            />
          )}
        </div>
      </main>

      {/* Official Portal Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">JanSetu AI</span>
            <span>•</span>
            <span>National Citizen Service Flight Deck • WeMakeDevs × AWS Hackathon 2026</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="text-indigo-600 hover:underline cursor-pointer font-medium"
            >
              Inspect AWS Stack
            </button>
            <span className="text-slate-300">|</span>
            <span>Deterministic AWS Cedar Policies</span>
            <span className="text-slate-300">|</span>
            <span>Zero AI Hallucination</span>
          </div>
        </div>
      </footer>

      {/* AWS Architecture Modal */}
      <AwsArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
