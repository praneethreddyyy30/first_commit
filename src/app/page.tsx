"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { AwsArchitectureModal } from "@/components/AwsArchitectureModal";
import { CitizenProfilePage } from "@/components/CitizenProfilePage";
import { EligibilityTab } from "@/components/EligibilityTab";
import { SchemeWorkspace } from "@/components/SchemeWorkspace";
import { SCHEMES_DATABASE, SchemeOrService } from "@/data/schemes";
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
  ChevronRight,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);

  // Tab State: 3 High-Level Stages (Matching Hand-drawn Spec)
  // Stage 1: "profile", Stage 2: "schemes", Stage 3: "workspace" (Focused on chosen scheme)
  const [activeTab, setActiveTab] = useState<
    "profile" | "schemes" | "workspace"
  >("profile");

  // Scheme Workspace Active Sub-Tab (Docs, Roadmap, Seva Centers, AI Copilot, Dossier)
  const [workspaceSubTab, setWorkspaceSubTab] = useState<
    "docs" | "roadmap" | "offline" | "copilot" | "dossier"
  >("docs");

  // Dynamic Scheme Pool (Sourced from Amazon DynamoDB / Live Gateway)
  const [schemes, setSchemes] = useState<SchemeOrService[]>(SCHEMES_DATABASE);
  const [isSyncingSchemes, setIsSyncingSchemes] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("Today (Live Cloud Gateway)");
  const [cloudDataSource, setCloudDataSource] = useState<string>("Amazon DynamoDB (JanSetuSchemes)");
  const [syncBannerMessage, setSyncBannerMessage] = useState<string | null>(null);

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

  // AUTOMATED REAL-TIME PROFILE-AWARE SCHEME DISCOVERY & CEDAR EVALUATION
  // Zero manual search: Triggers automatically when citizen's state, category, or income changes
  useEffect(() => {
    let isMounted = true;

    const autoSyncLiveSchemes = async () => {
      setIsSyncingSchemes(true);
      try {
        const res = await fetch("/api/schemes/live-evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, autoDiscover: true })
        });
        const data = await res.json();
        if (isMounted && data.success && data.allSchemes) {
          setSchemes(data.allSchemes);
          setLastSyncedAt("Just now (Live Cloud Sync)");
          setCloudDataSource(
            data.dataSource === "OFFICIAL_MYSCHEME_GOV_IN"
              ? "myscheme.gov.in (Digital India / API Setu)"
              : data.dataSource === "AMAZON_DYNAMODB"
              ? "Amazon DynamoDB (JanSetuSchemes)"
              : "Cloud Database (Live Gateway)"
          );
          if (data.newlyDiscovered && data.newlyDiscovered.length > 0) {
            const names = data.newlyDiscovered.map((s: { shortCode: string }) => s.shortCode).join(", ");
            setSyncBannerMessage(`🎉 Discovered & added live government scheme for ${profile.state}: ${names}`);
            setTimeout(() => setSyncBannerMessage(null), 7000);
          }
        }
      } catch (err) {
        console.warn("Live cloud scheme evaluation fallback:", err);
      } finally {
        if (isMounted) setIsSyncingSchemes(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      autoSyncLiveSchemes();
    }, 450);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [
    profile.state,
    profile.category,
    profile.annualFamilyIncome,
    profile.educationLevel,
    profile.gender,
    profile.tnCommunity,
    profile.apCommunity,
    profile.studiedInGovtSchool6To12,
    profile.isFirstGraduateInFamily,
    profile.admissionQuota
  ]);

  // Sync with Live Gazette Scanner & National Public Data Exchange
  const handleSyncWithApiSetu = async () => {
    setIsSyncingSchemes(true);
    try {
      const res = await fetch("/api/schemes/live-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, autoDiscover: true })
      });
      const data = await res.json();
      if (data.success && data.allSchemes) {
        setSchemes(data.allSchemes);
        setLastSyncedAt("Just now (Scanned Live Gazettes)");
        setCloudDataSource(
          data.dataSource === "AMAZON_DYNAMODB"
            ? "Amazon DynamoDB (JanSetuSchemes)"
            : "Cloud Database (Live Gateway)"
        );
        if (data.newlyDiscovered && data.newlyDiscovered.length > 0) {
          const names = data.newlyDiscovered.map((s: { shortCode: string }) => s.shortCode).join(", ");
          setSyncBannerMessage(`🎉 Successfully ingested newly gazetted scheme(s): ${names}`);
        } else {
          setSyncBannerMessage("✅ All schemes verified up-to-date with official Government Gazettes & Cloud DB.");
        }
        setTimeout(() => setSyncBannerMessage(null), 8000);
      }
    } catch (e) {
      console.error("Failed to sync schemes:", e);
      setSyncBannerMessage("⚠️ Could not reach live gateway. Kept active cloud cache available.");
      setTimeout(() => setSyncBannerMessage(null), 5000);
    } finally {
      setIsSyncingSchemes(false);
    }
  };

  // Live Cedar policy evaluation over active dynamic scheme pool
  const evaluationResults = useMemo(() => {
    return evaluateCedarPolicies(profile, schemes);
  }, [profile, schemes]);

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

  // Reset scroll to top whenever active tab changes
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
  }, [activeTab]);

  // User hand-drawn workflow: Selecting one scheme opens the Scheme Workspace
  const handleOpenSchemeWorkspace = (
    schemeId: string,
    subTab: "docs" | "roadmap" | "offline" | "copilot" | "dossier" = "docs"
  ) => {
    setTargetSchemeId(schemeId);
    setWorkspaceSubTab(subTab);
    setActiveTab("workspace");
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
  };

  // Find active scheme title & short code for Step 3 badge
  const activeScheme = useMemo(() => {
    return schemes.find((s) => s.id === targetSchemeId) || schemes[0];
  }, [schemes, targetSchemeId]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-800 flex flex-col font-sans">
      {/* Official Gov Header */}
      <Header
        activeProfileName={profile.name}
        onSelectPersona={handleSelectPersona}
        onResetToBlank={handleResetToBlank}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* Regal Navy Navigation Ribbon (Strict 3-Stage Workflow - Hand-drawn Spec) */}
        <div className="mb-6 overflow-x-auto no-scrollbar">
          <div className="flex w-max min-w-full space-x-1.5 rounded-2xl bg-[#0B1B4F] p-1.5 shadow-luxury border border-[#142A6F]">
            {/* Step 1: Citizen Master Profile */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#152864] text-[#F5E29F] shadow-sm ring-1 ring-[#DFB738]/50 font-bold"
                  : "text-slate-300 hover:bg-[#152864]/50 hover:text-white"
              }`}
            >
              <User className="size-4" />
              <span>1. Your Profile</span>
              <span className="rounded-full bg-[#152864] text-slate-300 border border-slate-600 px-2 py-0.5 text-[10px] font-bold">
                {profile.state.split(" ")[0]}
              </span>
            </button>

            {/* Step 2: Schemes & Certificates */}
            <button
              onClick={() => setActiveTab("schemes")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "schemes"
                  ? "bg-[#152864] text-[#F5E29F] shadow-sm ring-1 ring-[#DFB738]/50 font-bold"
                  : "text-slate-300 hover:bg-[#152864]/50 hover:text-white"
              }`}
            >
              <ShieldCheck className="size-4" />
              <span>2. Schemes & Certificates</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                {eligibleCount} Qualified
              </span>
            </button>

            {/* Step 3: Dedicated Scheme Workspace */}
            <button
              onClick={() => setActiveTab("workspace")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "workspace"
                  ? "bg-[#152864] text-[#F5E29F] shadow-sm ring-1 ring-[#DFB738]/50 font-bold"
                  : "text-slate-300 hover:bg-[#152864]/50 hover:text-white"
              }`}
            >
              <FileCheck2 className="size-4" />
              <span>3. Scheme Workspace ({activeScheme.shortCode})</span>
              <span className="rounded-full bg-[#DFB738]/20 text-[#F5E29F] border border-[#DFB738]/40 px-2 py-0.5 text-[10px] font-bold">
                Dedicated Cockpit
              </span>
            </button>
          </div>
        </div>

        {/* API Setu Live Ingestion Toast Notification */}
        {syncBannerMessage && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{syncBannerMessage}</span>
            </div>
            <button
              onClick={() => setSyncBannerMessage(null)}
              className="rounded-lg px-2 py-0.5 text-emerald-700 hover:bg-emerald-100 font-mono font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Views */}
        <div>
          {/* View 1: Citizen Master Profile Page (Step 1) */}
          {activeTab === "profile" && (
            <CitizenProfilePage
              profile={profile}
              evaluationResults={evaluationResults}
              onProfileChange={handleProfileChange}
              onAuditInputChange={(newAudit) => setAuditInput(newAudit)}
              onNavigateToSchemes={() => setActiveTab("schemes")}
              onNavigateToAudit={() => handleOpenSchemeWorkspace(targetSchemeId, "docs")}
            />
          )}

          {/* View 2: Scheme Discovery & Eligibility Dashboard (Step 2) */}
          {activeTab === "schemes" && (
            <EligibilityTab
              profile={profile}
              evaluationResults={evaluationResults}
              onProfileChange={handleProfileChange}
              onNavigateToProfile={() => setActiveTab("profile")}
              onNavigateToDocuments={(schemeId) => handleOpenSchemeWorkspace(schemeId, "docs")}
              onNavigateToRoadmap={(schemeId) => handleOpenSchemeWorkspace(schemeId, "roadmap")}
              onSelectSchemeForWorkspace={(schemeId) => handleOpenSchemeWorkspace(schemeId, "docs")}
              totalSchemesCount={schemes.length}
              lastSyncedAt={lastSyncedAt}
              onSyncWithApiSetu={handleSyncWithApiSetu}
              isSyncing={isSyncingSchemes}
              cloudDataSource={cloudDataSource}
            />
          )}

          {/* View 3: Dedicated Scheme Workspace (Step 3 - Matching Hand-drawn Diagram) */}
          {activeTab === "workspace" && (
            <SchemeWorkspace
              schemeId={targetSchemeId}
              allSchemes={schemes}
              onSelectScheme={(id) => setTargetSchemeId(id)}
              onBackToSchemes={() => setActiveTab("schemes")}
              profile={profile}
              evaluationResults={evaluationResults}
              auditInput={auditInput}
              onAuditInputChange={(newAudit) => setAuditInput(newAudit)}
              onProfileChange={handleProfileChange}
              initialSubTab={workspaceSubTab}
            />
          )}
        </div>
      </main>

      {/* Official Portal Footer */}
      <footer className="mt-12 border-t border-[#EAE2D5] bg-[#FDFBF7] py-6 text-xs text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0B1B4F] font-serif">JanSetu AI</span>
            <span>•</span>
            <span>National Citizen Service Flight Deck • WeMakeDevs × AWS Hackathon 2026</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="text-[#854D0E] hover:underline cursor-pointer font-bold"
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
