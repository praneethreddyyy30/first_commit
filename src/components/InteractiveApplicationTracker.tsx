"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Circle,
  Search,
  Sparkles,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Building2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Check
} from "lucide-react";

export type StageStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING";

export interface TrackerStage {
  stageNumber: number;
  stageName: string;
  actor: string;
  timeline: string;
  description?: string;
  actionItem?: string;
  commonPitfall?: string;
  stageMode?: "ONLINE" | "OFFLINE" | "HYBRID";
  status?: StageStatus;
  date?: string;
}

export interface TrackerChecklistItem {
  id: string;
  label: string;
  category?: string;
  isMandatory?: boolean;
}

export interface InteractiveApplicationTrackerProps {
  schemeId: string;
  schemeTitle: string;
  shortCode?: string;
  stages?: TrackerStage[];
  checklistItems?: TrackerChecklistItem[];
  defaultAppId?: string;
  className?: string;
}

const DEFAULT_STAGES: TrackerStage[] = [
  {
    stageNumber: 1,
    stageName: "Online Application & e-KYC Submitted",
    actor: "Citizen / Cyber Center",
    timeline: "Day 1 (Instant)",
    description: "Application submitted on official portal with Aadhaar e-KYC and digital certificate attachments.",
    actionItem: "Download and print 2 copies of the computer-generated acknowledgment slip.",
    commonPitfall: "Spelling mismatch between Aadhaar and academic marksheet.",
  },
  {
    stageNumber: 2,
    stageName: "Institutional (INO) Verification & Attestation",
    actor: "College / School Principal Desk",
    timeline: "Within 7-10 Days",
    description: "Institute Nodal Officer physically checks attendance, original certificates, and approves student profile.",
    actionItem: "Physically submit bonafide certificate and signed application dossier to the college nodal clerk.",
    commonPitfall: "Missing institutional fee receipts or principal stamp.",
  },
  {
    stageNumber: 3,
    stageName: "District Welfare Officer (DNO) Sanction",
    actor: "District Collectorate / Welfare Dept",
    timeline: "Within 15-20 Days",
    description: "Verification of annual family income limits, community quotas, and statutory compliance.",
    actionItem: "Track status weekly on portal; respond to any defect queries within 72 hours.",
    commonPitfall: "Expired income certificate (>1 year old from issuance).",
  },
  {
    stageNumber: 4,
    stageName: "State / Central Ministry Final Approval",
    actor: "Nodal Ministry Directorate",
    timeline: "Within 30 Days",
    description: "Budget allotment and computerized sanction order generation.",
    actionItem: "Verify PFMS registration and confirm bank account mapper validity.",
    commonPitfall: "Bank account is only KYC-linked, not seeded on NPCI DBT mapper.",
  },
  {
    stageNumber: 5,
    stageName: "PFMS / CFMS Direct Benefit Transfer (DBT)",
    actor: "Public Financial Management System",
    timeline: "Disbursal Cycle",
    description: "Direct electronic cash credit into student's Aadhaar-seeded bank account via PFMS gateway.",
    actionItem: "Check SMS credit notification and verify passbook entry.",
    commonPitfall: "Inactive / dormant bank account returning DBT transaction bounce.",
  },
];

const DEFAULT_CHECKLIST: TrackerChecklistItem[] = [
  { id: "form_submitted", label: "Online application form submitted on official portal", isMandatory: true },
  { id: "ack_printed", label: "Downloaded & printed application acknowledgment with barcode", isMandatory: true },
  { id: "aadhaar_linked", label: "Aadhaar Card linked to active mobile for OTP authentication", isMandatory: true },
  { id: "npci_seeded", label: "Bank account active and seeded on NPCI DBT Mapper", isMandatory: true },
  { id: "caste_income_valid", label: "Valid Digital Caste & Annual Income Certificates attached", isMandatory: true },
  { id: "bonafide_signed", label: "College Bonafide Certificate & fee receipt attested by Principal", isMandatory: true },
  { id: "dossier_submitted_desk", label: "Physical file handed over to Institute Nodal Officer (INO) desk", isMandatory: true },
];

export const InteractiveApplicationTracker: React.FC<InteractiveApplicationTrackerProps> = ({
  schemeId,
  schemeTitle,
  shortCode,
  stages = DEFAULT_STAGES,
  checklistItems = DEFAULT_CHECKLIST,
  defaultAppId,
  className = "",
}) => {
  const storageKey = `jansetu_tracker_${schemeId}`;

  // Initial State from LocalStorage or defaults
  const [appId, setAppId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`${storageKey}_appid`);
        if (saved) return saved;
      } catch {}
    }
    return defaultAppId || `${shortCode || "JS"}-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  });

  const [stageStatuses, setStageStatuses] = useState<Record<number, StageStatus>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`${storageKey}_stages`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    // Default: stage 1 completed, stage 2 in-progress, rest pending
    return {
      1: "COMPLETED",
      2: "IN_PROGRESS",
      3: "PENDING",
      4: "PENDING",
      5: "PENDING",
    };
  });

  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`${storageKey}_checklist`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    // Default first 2 checked
    return {
      [checklistItems[0]?.id || "form_submitted"]: true,
      [checklistItems[1]?.id || "ack_printed"]: true,
    };
  });

  const [lastSaved, setLastSaved] = useState<string>("");

  // Persist whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`${storageKey}_appid`, appId);
        localStorage.setItem(`${storageKey}_stages`, JSON.stringify(stageStatuses));
        localStorage.setItem(`${storageKey}_checklist`, JSON.stringify(checkedMilestones));
        setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch {}
    }
  }, [appId, stageStatuses, checkedMilestones, storageKey]);

  // Cycle status: PENDING -> IN_PROGRESS -> COMPLETED -> PENDING
  const cycleStageStatus = (stageNum: number) => {
    setStageStatuses((prev) => {
      const current = prev[stageNum] || "PENDING";
      let next: StageStatus = "IN_PROGRESS";
      if (current === "IN_PROGRESS") next = "COMPLETED";
      else if (current === "COMPLETED") next = "PENDING";
      else if (current === "PENDING") next = "IN_PROGRESS";

      return {
        ...prev,
        [stageNum]: next,
      };
    });
  };

  const setExplicitStageStatus = (stageNum: number, status: StageStatus) => {
    setStageStatuses((prev) => ({
      ...prev,
      [stageNum]: status,
    }));
  };

  const toggleMilestone = (id: string) => {
    setCheckedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetAll = () => {
    const defaultStages: Record<number, StageStatus> = {
      1: "COMPLETED",
      2: "IN_PROGRESS",
      3: "PENDING",
      4: "PENDING",
      5: "PENDING",
    };
    const defaultChecks: Record<string, boolean> = {
      [checklistItems[0]?.id || "form_submitted"]: true,
      [checklistItems[1]?.id || "ack_printed"]: true,
    };
    setStageStatuses(defaultStages);
    setCheckedMilestones(defaultChecks);
  };

  // Metrics
  const activeStages = stages.length > 0 ? stages : DEFAULT_STAGES;
  const completedStagesCount = activeStages.filter((s) => stageStatuses[s.stageNumber] === "COMPLETED").length;
  const inProgressStagesCount = activeStages.filter((s) => stageStatuses[s.stageNumber] === "IN_PROGRESS").length;
  const stagePercentage = Math.round((completedStagesCount / activeStages.length) * 100);

  const activeChecklist = checklistItems.length > 0 ? checklistItems : DEFAULT_CHECKLIST;
  const completedChecklistCount = activeChecklist.filter((c) => checkedMilestones[c.id]).length;
  const checklistPercentage = Math.round((completedChecklistCount / activeChecklist.length) * 100);

  return (
    <div className={`luxury-card rounded-2xl p-6 sm:p-8 space-y-6 border border-[#DFC8A5] bg-[#FAF7F2] ${className}`}>
      {/* 1. Header & Application ID Input */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-5 border-b border-[#EDE6DD] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#0B1B4F] px-2.5 py-0.5 text-[10px] font-bold text-[#F5E29F] uppercase tracking-wider font-serif">
              Live Interactive Tracker
            </span>
            {shortCode && (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                {shortCode}
              </span>
            )}
            <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
              <Check className="size-3" /> Auto-Saved
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-black text-[#0B1B4F] font-serif mt-1">
            Application Status Tracker & Statutory Checklist
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Click on any milestone stage or checklist item below to update and track your progress in real-time.
          </p>
        </div>

        {/* Application ID Input Bar */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="relative min-w-[220px]">
            <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="Application / Acknowledgment ID"
              className="w-full rounded-xl border border-[#DFC8A5] bg-white pl-9 pr-3 py-2 text-xs font-mono font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:outline-hidden shadow-2xs"
            />
          </div>
          <button
            onClick={resetAll}
            title="Reset progress to default"
            className="flex items-center gap-1 rounded-xl border border-[#DFC8A5] bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-[#F4ECE1] transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Progress Bar */}
      <div className="rounded-xl border border-[#EDE6DD] bg-white p-4 space-y-2 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0B1B4F] font-serif">Overall Submission Progress:</span>
            <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
              {completedStagesCount} of {activeStages.length} Stages Cleared ({stagePercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-600 inline-block" /> Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500 inline-block animate-pulse" /> In Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-slate-300 inline-block" /> Pending
            </span>
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full bg-[#EDE6DD] rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 via-emerald-600 to-emerald-700 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(stagePercentage, 8)}%` }}
          />
        </div>
      </div>

      {/* 3. Interactive Stage Cards Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[#0B1B4F] font-serif">
            Official Verification Stages (Click Any Stage to Update Status)
          </h5>
          <span className="text-[11px] text-slate-500">
            Click status pill to toggle: <strong>Pending → In Progress → Completed</strong>
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {activeStages.map((stage) => {
            const status = stageStatuses[stage.stageNumber] || "PENDING";
            return (
              <div
                key={stage.stageNumber}
                onClick={() => cycleStageStatus(stage.stageNumber)}
                className={`rounded-xl border p-4 text-xs flex flex-col justify-between transition-all cursor-pointer select-none group shadow-2xs ${
                  status === "COMPLETED"
                    ? "border-emerald-300 bg-emerald-50/70 hover:bg-emerald-50 text-emerald-950 ring-1 ring-emerald-400/40"
                    : status === "IN_PROGRESS"
                    ? "border-[#DFB738] bg-amber-50/90 hover:bg-amber-100/80 text-amber-950 font-medium shadow-xs ring-2 ring-[#DFB738]/60"
                    : "border-[#EDE6DD] bg-white hover:bg-[#FAF7F2] text-slate-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold opacity-75">
                      Stage 0{stage.stageNumber}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleStageStatus(stage.stageNumber);
                      }}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        status === "COMPLETED"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : status === "IN_PROGRESS"
                          ? "bg-amber-500 text-amber-950 animate-pulse font-bold"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {status === "COMPLETED" && <CheckCircle2 className="size-2.5" />}
                      {status === "IN_PROGRESS" && <Clock className="size-2.5" />}
                      {status === "PENDING" && <Circle className="size-2.5" />}
                      <span>{status === "IN_PROGRESS" ? "In Progress" : status}</span>
                    </button>
                  </div>

                  <h6 className="font-bold text-xs text-[#0B1B4F] font-serif leading-snug">
                    {stage.stageName}
                  </h6>
                  <div className="text-[10px] text-amber-900 font-semibold mt-1">
                    {stage.actor}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ⏱️ {stage.timeline}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#EDE6DD]/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Click to change</span>
                  <div className="flex items-center gap-1 font-bold text-[#0B1B4F] group-hover:underline">
                    <span>Toggle</span>
                    <ChevronRight className="size-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Pre-Flight Checklist */}
      <div className="rounded-xl border border-[#DFC8A5] bg-white p-5 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#EDE6DD] gap-2">
          <div>
            <h5 className="text-xs sm:text-sm font-bold text-[#0B1B4F] font-serif flex items-center gap-2">
              <CheckSquare className="size-4 text-emerald-700" />
              <span>Mandatory Statutory Action Checklist</span>
            </h5>
            <p className="text-[11px] text-slate-500">
              Check off each critical step as you complete it to guarantee zero rejection at physical desks.
            </p>
          </div>

          <div className="rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-mono font-bold text-emerald-900 shrink-0">
            {completedChecklistCount} / {activeChecklist.length} Milestones Done ({checklistPercentage}%)
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {activeChecklist.map((item) => {
            const isChecked = Boolean(checkedMilestones[item.id]);
            return (
              <div
                key={item.id}
                onClick={() => toggleMilestone(item.id)}
                className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs transition-all cursor-pointer select-none group ${
                  isChecked
                    ? "border-emerald-300 bg-emerald-50/60 text-emerald-950 font-medium"
                    : "border-[#EDE6DD] bg-[#FAF7F2] text-slate-700 hover:border-[#DFC8A5] hover:bg-white"
                }`}
              >
                <span className="mt-0.5 shrink-0 text-slate-400 group-hover:text-amber-700">
                  {isChecked ? (
                    <CheckSquare className="size-4 text-emerald-600" />
                  ) : (
                    <Square className="size-4" />
                  )}
                </span>
                <div className="flex-1">
                  <span className={isChecked ? "line-through opacity-80" : "font-medium"}>
                    {item.label}
                  </span>
                  {item.isMandatory && (
                    <span className="ml-1.5 inline-block text-[9px] font-bold uppercase text-amber-800">
                      (Mandatory)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
