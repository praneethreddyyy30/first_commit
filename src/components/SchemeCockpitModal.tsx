"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  IndianRupee,
  Building2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  MapPin,
  ArrowRight,
  ListTodo,
  Check,
  RotateCcw
} from "lucide-react";
import { SchemeOrService } from "@/data/schemes";
import { CedarEvaluationResult } from "@/lib/cedar/evaluator";

interface SchemeCockpitModalProps {
  result: CedarEvaluationResult | null;
  onClose: () => void;
  onOpenCertificateGuide: (certId: string) => void;
  onNavigateToDocumentsTab?: () => void;
}

export const SchemeCockpitModal: React.FC<SchemeCockpitModalProps> = ({
  result,
  onClose,
  onOpenCertificateGuide,
  onNavigateToDocumentsTab,
}) => {
  if (!result) return null;

  const { scheme, decision, matchedReasons, failedReasons, missingPrerequisites, heldPrerequisites } = result;

  // Default checklist milestones for an individual scheme
  const defaultMilestones = [
    { id: "m1", label: "Verify Personal & Academic Eligibility", detail: "Confirmed income, category, and schooling criteria match policy." },
    { id: "m2", label: "Audit & Resolve Missing Prerequisite Certificates", detail: "Obtain all mandatory state precursor certificates." },
    { id: "m3", label: "Pre-Flight Clerical & NPCI Bank Seeding Check", detail: "Confirm name on Aadhaar matches marksheet and bank account is NPCI DBT-seeded." },
    { id: "m4", label: "Submit Online Application on Official Government Portal", detail: `Complete form submission at ${scheme.portalName}.` },
    { id: "m5", label: "Institutional Nodal Officer (INO) Physical Verification", detail: "Submit printed acknowledgement to College / School Principal." },
    { id: "m6", label: "Direct Benefit Transfer (DBT) Treasury Credit", detail: "Track PFMS / State Treasury disbursement to mapped bank account." },
  ];

  // Local persistence for this scheme's checklist
  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined" && scheme.id) {
      try {
        const saved = localStorage.getItem(`jansetu_checklist_${scheme.id}`);
        if (saved) {
          setCheckedMilestones(JSON.parse(saved));
        } else {
          // Pre-check milestone 1 if already eligible
          setCheckedMilestones({
            m1: decision === "ALLOW",
            m2: missingPrerequisites.length === 0,
          });
        }
      } catch (e) {
        console.error("Failed to read scheme checklist", e);
      }
    }
  }, [scheme.id, decision, missingPrerequisites.length]);

  const toggleMilestone = (mId: string) => {
    const updated = { ...checkedMilestones, [mId]: !checkedMilestones[mId] };
    setCheckedMilestones(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`jansetu_checklist_${scheme.id}`, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to persist checklist", e);
      }
    }
  };

  const completedCount = defaultMilestones.filter((m) => checkedMilestones[m.id]).length;
  const progressPercent = Math.round((completedCount / defaultMilestones.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#DFC8A5] bg-[#FAF7F2] shadow-luxury-lg">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EDE6DD] bg-[#FDFBF7] p-6">
          <div className="space-y-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                  scheme.level === "Central"
                    ? "bg-purple-100 text-purple-900 border border-purple-200"
                    : "bg-amber-100 text-amber-900 border border-amber-200"
                }`}
              >
                {scheme.level} Government Scheme
              </span>

              {scheme.applicableStates && (
                <span className="rounded-full bg-[#FAF4EB] border border-[#E8DCCB] px-2.5 py-0.5 text-[11px] font-semibold text-[#854D0E]">
                  {scheme.applicableStates.join(", ")}
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  decision === "ALLOW"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                {decision === "ALLOW" ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Eligible to Apply</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-3.5 text-rose-600" />
                    <span>Currently Ineligible</span>
                  </>
                )}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#0B1B4F] leading-snug font-serif">
              {scheme.title}
            </h2>
            <p className="text-xs text-slate-600">{scheme.ministry}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-[#F4ECE1] hover:text-slate-700 cursor-pointer transition-colors shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Cockpit Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Scheme Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1 font-display">
                <IndianRupee className="size-3.5" />
                Benefit Package
              </span>
              <p className="mt-1 text-sm font-black text-emerald-950 leading-snug font-serif">
                {result.estimatedBenefit}
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-700">Direct Benefit Transfer / Fee Exemption</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1 font-display">
                <Calendar className="size-3.5" />
                Application End Date
              </span>
              <p className="mt-1 text-sm font-black text-blue-950 font-serif">
                {scheme.deadline}
              </p>
              <p className="mt-0.5 text-[10px] font-bold text-blue-700">
                {scheme.daysRemaining} days remaining in current cycle
              </p>
            </div>

            <div className="rounded-2xl border border-[#DFC8A5] bg-[#FAF4EB] p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#854D0E] flex items-center gap-1 font-display">
                <Building2 className="size-3.5 text-amber-700" />
                Official Application Portal
              </span>
              <p className="mt-1 text-xs font-black text-[#0B1B4F] line-clamp-1 font-serif">
                {scheme.portalName}
              </p>
              <a
                href={scheme.officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#854D0E] hover:underline"
              >
                <span>{scheme.portalSchemeCode || "Visit Portal"}</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          {/* Section 1: Certificates Status (What I Have vs What I Still Need) */}
          <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EDE6DD] pb-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="size-4.5 text-amber-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1B4F] font-display">
                  Required Certificates & Documents Audit
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Scheme-Specific Requirements
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Documents You Currently Have */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Certificates You Have ({heldPrerequisites.length})</span>
                </span>
                {heldPrerequisites.length > 0 ? (
                  <ul className="space-y-1.5">
                    {heldPrerequisites.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-white rounded-lg p-2 border border-emerald-200"
                      >
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                        <span className="line-clamp-1">{doc.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No held certificates recorded in your profile.</p>
                )}
              </div>

              {/* Documents You Still Need (Roadblocks) */}
              <div className="rounded-xl border border-[#DFC8A5] bg-[#FAF4EB] p-3.5 space-y-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#854D0E]">
                  <AlertTriangle className="size-3.5 text-amber-600" />
                  <span>Certificates You Still Need ({missingPrerequisites.length})</span>
                </span>
                {missingPrerequisites.length > 0 ? (
                  <div className="space-y-2">
                    {missingPrerequisites.map((prereq) => (
                      <div
                        key={prereq.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#DFC8A5] bg-white p-2.5 text-xs"
                      >
                        <span className="font-bold text-[#0B1B4F] line-clamp-1">{prereq.title}</span>
                        <button
                          onClick={() => onOpenCertificateGuide(prereq.id)}
                          className="shrink-0 flex items-center gap-1 rounded-md bg-[#0B1B4F] px-2 py-1 text-[11px] font-bold text-[#F5E29F] shadow-2xs hover:bg-[#071233] cursor-pointer"
                        >
                          <span>Get Guide</span>
                          <ChevronRight className="size-3 text-[#F5E29F]" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 font-bold">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>No missing certificates! Ready for portal submission.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Why I Satisfied the Criteria (or Why Ineligible) */}
          <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#EDE6DD] pb-2">
              <Sparkles className="size-4.5 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1B4F] font-display">
                {decision === "ALLOW" ? "Why You Satisfied the Eligibility Criteria" : "Why You Are Disqualified (Failed Clauses)"}
              </h3>
            </div>

            {decision === "ALLOW" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedReasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-xl bg-[#FAF7F2] p-2.5 text-xs text-slate-800 border border-[#EDE6DD]"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{reason}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {failedReasons.map((clause, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-900 border border-rose-200"
                  >
                    <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-semibold">{clause}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Visual Workflow Architecture */}
          <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1B4F] font-display border-b border-[#EDE6DD] pb-2">
              Scheme Application Architecture & Milestones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-[#EDE6DD] bg-[#FAF7F2] p-3 text-xs space-y-1">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#0B1B4F] text-[#F5E29F] font-black text-[10px]">
                  1
                </span>
                <p className="font-bold text-[#0B1B4F]">Precursors</p>
                <p className="text-[10px] text-slate-500">Gather TCs, Caste & Income certificates from e-Sevai / Tahsildar</p>
              </div>

              <div className="rounded-xl border border-[#EDE6DD] bg-[#FAF7F2] p-3 text-xs space-y-1">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#0B1B4F] text-[#F5E29F] font-black text-[10px]">
                  2
                </span>
                <p className="font-bold text-[#0B1B4F]">Portal Submission</p>
                <p className="text-[10px] text-slate-500">Apply on {scheme.portalName} with Aadhaar OTP e-KYC</p>
              </div>

              <div className="rounded-xl border border-[#EDE6DD] bg-[#FAF7F2] p-3 text-xs space-y-1">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#0B1B4F] text-[#F5E29F] font-black text-[10px]">
                  3
                </span>
                <p className="font-bold text-[#0B1B4F]">Institutional Review</p>
                <p className="text-[10px] text-slate-500">College Principal / Institute Nodal Officer endorses application</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-700 text-white font-black text-[10px]">
                  4
                </span>
                <p className="font-bold text-emerald-950">Treasury DBT</p>
                <p className="text-[10px] text-emerald-700">Funds credited directly to Aadhaar-seeded NPCI bank account</p>
              </div>
            </div>
          </div>

          {/* Section 4: "Where I Am Present" Interactive Self-Checklist */}
          <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#EDE6DD] pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <ListTodo className="size-4.5 text-amber-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1B4F] font-display">
                    Where I Am Present: Self-Audit Checklist
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Track your physical progress. Changes are automatically saved to your browser.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#0B1B4F]">
                  {completedCount} of {defaultMilestones.length} Done ({progressPercent}%)
                </span>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-[#EDE6DD]">
                  <div
                    className="h-full bg-[#0B1B4F] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {defaultMilestones.map((m) => {
                const isDone = !!checkedMilestones[m.id];
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                      isDone
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-[#EDE6DD] bg-[#FAF7F2] hover:bg-white"
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleMilestone(m.id)}
                        className="size-4.5 rounded border-[#DACBB8] text-[#0B1B4F] focus:ring-[#DFB738] mt-0.5 cursor-pointer"
                      />
                      <div className="text-xs">
                        <p className={`font-bold ${isDone ? "text-emerald-950 line-through" : "text-[#0B1B4F]"}`}>
                          {m.label}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{m.detail}</p>
                      </div>
                    </label>

                    {/* Contextual Action Button based on Milestone */}
                    <div className="sm:shrink-0 pl-7 sm:pl-0">
                      {m.id === "m2" && missingPrerequisites.length > 0 && (
                        <button
                          onClick={() => onOpenCertificateGuide(missingPrerequisites[0].id)}
                          className="flex items-center gap-1 rounded-lg bg-[#0B1B4F] px-3 py-1.5 text-xs font-bold text-[#F5E29F] shadow-2xs hover:bg-[#071233] cursor-pointer"
                        >
                          <span>Resolve {missingPrerequisites[0].shortCode || "Cert"} ➔</span>
                        </button>
                      )}

                      {m.id === "m3" && onNavigateToDocumentsTab && (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToDocumentsTab();
                          }}
                          className="flex items-center gap-1 rounded-lg bg-[#0B1B4F] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#071233] cursor-pointer"
                        >
                          <span>Upload & Audit Docs ➔</span>
                        </button>
                      )}

                      {m.id === "m4" && (
                        <a
                          href={scheme.officialPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-[#0B1B4F] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#071233]"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="size-3 text-[#F5E29F]" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EDE6DD] bg-[#FAF4EB] p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Need clerical audit?</span>
            {onNavigateToDocumentsTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDocumentsTab();
                }}
                className="text-[#854D0E] font-bold hover:underline cursor-pointer"
              >
                Audit Aadhaar & NPCI Bank Seeding ➔
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl border border-[#DACBB8] bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              Back to Schemes
            </button>

            <a
              href={scheme.officialPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1B4F] px-5 py-2.5 text-xs font-bold text-[#F5E29F] shadow-xs hover:bg-[#071233] transition-colors cursor-pointer border border-[#142A6F]"
            >
              <span>Apply on {scheme.portalName}</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
