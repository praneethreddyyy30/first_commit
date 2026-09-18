"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileCheck2,
  Building2,
  Clock,
  IndianRupee,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  AlertTriangle,
  FileText
} from "lucide-react";
import {
  CertificateResolutionGuide,
  getCertificateGuide
} from "@/data/certificateGuides";

interface CertificateResolutionModalProps {
  certificateId: string | null;
  onClose: () => void;
  onMarkAsObtained?: (certificateId: string) => void;
  userState?: string;
}

export const CertificateResolutionModal: React.FC<CertificateResolutionModalProps> = ({
  certificateId,
  onClose,
  onMarkAsObtained,
  userState,
}) => {
  const guide = certificateId ? getCertificateGuide(certificateId, userState) : undefined;

  // Local storage checklist persistence
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (guide?.id && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`jansetu_cert_${guide.id}`);
        if (saved) {
          setCheckedSteps(JSON.parse(saved));
        } else {
          setCheckedSteps({});
        }
      } catch (e) {
        console.error("Failed to load cert progress", e);
      }
    }
  }, [guide?.id]);

  if (!certificateId || !guide) return null;

  const toggleStep = (stepId: string) => {
    const updated = { ...checkedSteps, [stepId]: !checkedSteps[stepId] };
    setCheckedSteps(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`jansetu_cert_${guide.id}`, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save cert progress", e);
      }
    }
  };

  const totalSteps = guide.interactiveChecklist.length;
  const completedSteps = guide.interactiveChecklist.filter((s) => checkedSteps[s.id]).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#DFC8A5] bg-[#FAF7F2] shadow-luxury-lg">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#EDE6DD] bg-[#FDFBF7] p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF4EB] border border-[#E8DCCB] px-2.5 py-0.5 text-[11px] font-bold text-[#854D0E] font-mono">
                <FileCheck2 className="size-3.5 text-amber-700" />
                {guide.officialCode}
              </span>
              <span className="rounded-full bg-[#FAF0C8] border border-[#DFC8A5] px-2.5 py-0.5 text-[11px] font-semibold text-[#854D0E]">
                SLA: {guide.slaDays} Working Days
              </span>
            </div>
            <h2 className="mt-2 text-xl font-black text-[#0B1B4F] font-serif">{guide.title}</h2>
            <p className="text-xs text-slate-600 mt-0.5">{guide.department}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-[#F4ECE1] hover:text-slate-700 cursor-pointer transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold font-display">
                <IndianRupee className="size-4" />
                <span>Statutory Fee</span>
              </div>
              <p className="mt-1 text-sm font-black text-emerald-950 font-serif">{guide.statutoryFee}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Legally capped government cost</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-blue-800 text-xs font-bold font-display">
                <Clock className="size-4" />
                <span>Service SLA</span>
              </div>
              <p className="mt-1 text-sm font-black text-blue-950 font-serif">{guide.slaDays} Working Days</p>
              <p className="text-[10px] text-blue-700 mt-0.5">Under Right to Service Act</p>
            </div>

            <div className="rounded-2xl border border-[#DFC8A5] bg-[#FAF4EB] p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#854D0E] text-xs font-bold font-display">
                <Building2 className="size-4 text-amber-700" />
                <span>Issuing Authority</span>
              </div>
              <p className="mt-1 text-xs font-bold text-[#0B1B4F] line-clamp-1 font-serif">{guide.issuingAuthority}</p>
              <p className="text-[10px] text-amber-800 mt-0.5">{guide.counterName}</p>
            </div>
          </div>

          {/* Anti-Extortion Warning Banner */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="size-4.5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Anti-Extortion & Right to Service Notice:</strong>{" "}
                {guide.feeWarning}
              </div>
            </div>
          </div>

          {/* Why Needed & Purpose */}
          <div className="rounded-2xl border border-[#EDE6DD] bg-white p-4 space-y-2 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1B4F] font-display">
              Legal Purpose & Benefit
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">{guide.purpose}</p>
            <div className="rounded-xl bg-[#FAF7F2] p-3 border border-[#EDE6DD] text-[11px] text-slate-700">
              <strong className="text-[#0B1B4F] font-semibold">Why this is needed:</strong> {guide.whyNeeded}
            </div>
          </div>

          {/* Precursor Documents Required (What to Carry) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1B4F] font-display flex items-center gap-2">
              <FileText className="size-4 text-amber-700" />
              <span>Precursor Documents to Carry ({guide.precursorDocuments.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {guide.precursorDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#EDE6DD] bg-white p-3 text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-[#0B1B4F]">{doc.name}</span>
                    {doc.mandatory && (
                      <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-800">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{doc.requirement}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Procedure */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1B4F] font-display flex items-center gap-2">
              <Sparkles className="size-4 text-amber-600" />
              <span>Step-by-Step Resolution Architecture</span>
            </h4>
            <div className="space-y-2.5">
              {guide.stepsToObtain.map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-start gap-3 rounded-2xl border border-[#EDE6DD] bg-white p-3.5 text-xs transition-all hover:border-[#DFC8A5] shadow-2xs"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#0B1B4F] font-black text-[#F5E29F] text-xs font-serif">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-[#0B1B4F] font-serif">{step.action}</h5>
                      <span className="text-[10px] font-semibold text-slate-500">{step.timeline}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Progress Tracking Checklist */}
          <div className="rounded-2xl border border-[#EDE6DD] bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EDE6DD] pb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1B4F] font-display">
                  Track Your Certificate Progress
                </h4>
                <p className="text-[11px] text-slate-500">
                  {completedSteps} of {totalSteps} milestones reached ({progressPercent}%)
                </p>
              </div>
              <span className="rounded-full bg-[#FAF4EB] border border-[#E8DCCB] px-2.5 py-1 text-xs font-black text-[#854D0E]">
                {progressPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE6DD]">
              <div
                className="h-full bg-[#0B1B4F] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-2 pt-2">
              {guide.interactiveChecklist.map((item) => {
                const isDone = !!checkedSteps[item.id];
                return (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      isDone
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-[#EDE6DD] bg-[#FAF7F2] hover:bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleStep(item.id)}
                      className="size-4.5 rounded border-[#DACBB8] text-[#0B1B4F] focus:ring-[#DFB738] mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1 text-xs">
                      <p className={`font-bold ${isDone ? "text-emerald-950 line-through" : "text-[#0B1B4F]"}`}>
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EDE6DD] bg-[#FAF4EB] p-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Building2 className="size-4 text-amber-700" />
            <span>Apply online at <strong>{guide.portalName}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onMarkAsObtained && (
              <button
                onClick={() => {
                  onMarkAsObtained(guide.id);
                  onClose();
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Mark as Currently Held</span>
              </button>
            )}

            <a
              href={guide.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1B4F] px-5 py-2.5 text-xs font-bold text-[#F5E29F] shadow-xs hover:bg-[#071233] transition-colors cursor-pointer border border-[#142A6F]"
            >
              <span>Open Official Portal</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
