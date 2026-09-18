"use client";

import React, { useState } from "react";
import { UserProfile, CedarEvaluationResult } from "@/lib/cedar/evaluator";
import { DocumentAuditResult } from "@/lib/audit/documentAuditor";
import {
  Printer,
  FileCheck,
  CheckCircle2,
  ShieldCheck,
  Building,
  QrCode,
  Search,
  Clock,
  ArrowRight
} from "lucide-react";

interface ApplicationDossierTabProps {
  profile: UserProfile;
  evaluationResults: CedarEvaluationResult[];
  auditResult: DocumentAuditResult;
}

export const ApplicationDossierTab: React.FC<ApplicationDossierTabProps> = ({
  profile,
  evaluationResults,
  auditResult,
}) => {
  const [appTrackerId, setAppTrackerId] = useState<string>("NSP2026ST89201");
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const topEligible = evaluationResults.find((r) => r.decision === "ALLOW")?.scheme;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner with Print Button */}
      <div className="luxury-hero-gradient rounded-2xl p-6 sm:p-8 text-white shadow-md border border-[#DFB738]/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#152864] px-3.5 py-1 text-xs font-bold text-[#F5E29F] border border-[#DFB738]/40 uppercase tracking-wider">
            <ShieldCheck className="size-4 text-[#DFB738]" />
            Verified Pre-Flight Submission Dossier
          </div>
          <h3 className="mt-2 text-2xl sm:text-3xl font-black text-white font-serif tracking-tight">
            1-Click Citizen Application Dossier
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-200">
            Carry this single-page verified card to your College Nodal Officer or CSC center to prevent operator errors.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl bg-[#F5E29F] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#0B1B4F] shadow-md hover:bg-[#FAF0C8] transition-all cursor-pointer border border-[#DFB738]"
        >
          <Printer className="size-4 text-[#0B1B4F]" />
          <span>Print / Export Dossier</span>
        </button>
      </div>

      {/* THE PRINTABLE APPLICATION DOSSIER SHEET */}
      <div className="luxury-card rounded-2xl border-2 border-[#DFC8A5] bg-[#FAF7F2] p-6 sm:p-10 shadow-sm print:m-0 print:border-none print:p-0">
        {/* Dossier Header */}
        <div className="border-b-2 border-[#0B1B4F] pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#0B1B4F] px-2.5 py-1 text-xs font-bold text-[#F5E29F] uppercase tracking-wider font-serif">
                  JanSetu AI
                </span>
                <span className="font-mono text-xs text-slate-500">
                  Dossier Ref: #JS-918204
                </span>
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[#0B1B4F] font-serif">
                CITIZEN SCHOLARSHIP & SERVICE SUBMISSION CARD
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Government of India Civic Access & Direct Benefit Transfer Pre-Check
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-[#DFC8A5] bg-white p-3 text-center shadow-2xs">
              <QrCode className="size-12 text-[#0B1B4F]" />
              <span className="mt-1 font-mono text-[9px] text-amber-800 font-bold">VERIFIED AUDIT</span>
            </div>
          </div>
        </div>

        {/* Section 1: Verified Applicant Demographics */}
        <div className="mt-6 border-b border-[#EDE6DD] pb-6">
          <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#0B1B4F]">
            01. Verified Applicant Demographics
          </h4>
          <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Applicant Name:</span>
              <strong className="text-[#0B1B4F] text-sm font-bold font-serif">
                {profile.name || "Rajesh Kumar Munda"}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Category / Community:</span>
              <strong className="text-[#0B1B4F] text-sm font-bold font-serif">{profile.category}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Annual Family Income:</span>
              <strong className="text-[#0B1B4F] text-sm font-bold font-serif">
                ₹{profile.annualFamilyIncome.toLocaleString("en-IN")}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Education Level:</span>
              <strong className="text-[#0B1B4F] text-sm font-bold font-serif">{profile.educationLevel}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Home State / Domicile:</span>
              <strong className="text-[#0B1B4F] font-semibold">{profile.state}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Gender:</span>
              <strong className="text-[#0B1B4F] font-semibold">{profile.gender}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Aadhaar / Marksheet Match:</span>
              <strong className="text-emerald-800 font-bold">
                {auditResult.nameMatchPercentage}% Similarity
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">NPCI DBT Bank Status:</span>
              <strong
                className={`font-bold ${
                  auditResult.npciStatus === "SEEDED" ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                {auditResult.npciStatus === "SEEDED" ? "Active (Seeded)" : "Requires Mandate"}
              </strong>
            </div>
          </div>
        </div>

        {/* Section 2: Recommended Target Scheme */}
        <div className="mt-6 border-b border-[#EDE6DD] pb-6">
          <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#0B1B4F]">
            02. Target Scheme & Financial Entitlement
          </h4>
          {topEligible ? (
            <div className="mt-3 rounded-xl border border-[#DFC8A5] bg-white p-5 text-xs shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] text-slate-500">Scheme Code: {topEligible.id}</span>
                  <h5 className="text-base font-bold text-[#0B1B4F] font-serif">{topEligible.title}</h5>
                  <p className="text-slate-600 mt-0.5">{topEligible.ministry}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Financial Benefit:</span>
                  <span className="text-base font-bold text-emerald-800 font-serif">
                    {topEligible.benefitAmount}
                  </span>
                </div>
              </div>

              <div className="mt-3.5 grid sm:grid-cols-2 gap-2 border-t border-[#EDE6DD] pt-3 text-[11px]">
                <div>
                  <span className="text-slate-500">Official Portal: </span>
                  <strong className="text-[#0B1B4F]">{topEligible.portalName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Submission Deadline: </span>
                  <strong className="text-rose-700">{topEligible.deadline}</strong>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No active eligible schemes.</p>
          )}
        </div>

        {/* Section 3: Mandatory Document Checklist for Submission */}
        <div className="mt-6 border-b border-[#EDE6DD] pb-6">
          <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#0B1B4F]">
            03. Verified Mandatory Document Checklist
          </h4>
          <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 text-xs">
            {[
              "Digital Caste / Community Certificate (with Barcode verification)",
              "Annual Income Certificate (< ₹2.50L) issued on or after April 1, 2026",
              "Aadhaar Card (linked to active mobile number)",
              "Bank Passbook with NPCI DBT Mapper Active Stamp",
              "10th Class Board Marksheet / Date of Birth Proof",
              "Current Academic Year College Bonafide Certificate & Fee Receipt",
            ].map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 rounded-lg border border-[#EDE6DD] bg-white p-3 shadow-2xs"
              >
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span className="text-slate-800 font-medium">{doc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Offline Counter Instructions & Anti-Fraud Notice */}
        <div className="mt-6">
          <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#0B1B4F]">
            04. Official Submission Counter & Fee Declaration
          </h4>
          <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50/70 p-4.5 text-xs shadow-2xs">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <span className="text-amber-950 block font-bold font-serif">Where to Submit:</span>
                <span className="text-slate-700">
                  College Nodal Officer (INO) Desk / District Welfare Office
                </span>
              </div>
              <div>
                <span className="text-amber-950 block font-bold font-serif">Statutory Government Fee:</span>
                <span className="text-emerald-800 font-bold">
                  ₹0 (Completely Free under Central Guidelines)
                </span>
              </div>
              <div>
                <span className="text-amber-950 block font-bold font-serif">Grievance Helpline:</span>
                <span className="text-slate-700 font-mono">0120-6619540 / 1800-3000-3468</span>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-amber-900 border-t border-amber-200/60 pt-2 font-medium">
              * Notice to CSC Operators / Cyber Cafes: Under the Information Technology Act and Central Citizen Charters, charging unauthorized fees for government scholarship filing is illegal.
            </div>
          </div>
        </div>
      </div>

      {/* PART 2: LIVE APPLICATION STATUS TRACKER */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-4">
        <h4 className="text-base sm:text-lg font-bold text-[#0B1B4F] font-serif">
          Live Application Status Tracker
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Track the real-time progress of your submitted application across government tiers.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={appTrackerId}
              onChange={(e) => setAppTrackerId(e.target.value)}
              placeholder="Enter Application ID (e.g. NSP2026ST89201)"
              className="w-full rounded-xl border border-[#DFC8A5] bg-white pl-9 pr-3 py-2.5 text-xs font-mono text-slate-800 focus:border-[#DFB738] focus:outline-hidden"
            />
          </div>
          <button
            onClick={() => setIsTracking(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0B1B4F] px-5 py-2.5 text-xs font-bold text-[#F5E29F] hover:bg-[#152864] transition-colors cursor-pointer border border-[#DFB738]/40 shadow-sm"
          >
            <span>Track Application</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        {/* Visual Pipeline */}
        <div className="mt-6 border-t border-[#EDE6DD] pt-6">
          <div className="grid gap-3 sm:grid-cols-5">
            {[
              { label: "Submitted Online", status: "COMPLETED", date: "Sept 12, 2026" },
              { label: "College (INO) Verified", status: "COMPLETED", date: "Sept 15, 2026" },
              { label: "District (DNO) Verification", status: "IN_PROGRESS", date: "Pending (Within 8 days)" },
              { label: "Ministry Sanction", status: "PENDING", date: "Awaiting DNO" },
              { label: "PFMS DBT Credit", status: "PENDING", date: "Direct to Bank" },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-3.5 text-xs transition-all ${
                  step.status === "COMPLETED"
                    ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
                    : step.status === "IN_PROGRESS"
                    ? "border-[#DFB738] bg-amber-50 text-amber-950 font-bold shadow-xs ring-1 ring-[#DFB738]/50"
                    : "border-[#EDE6DD] bg-[#FAF7F2] text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px]">Step 0{idx + 1}</span>
                  {step.status === "COMPLETED" ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  ) : step.status === "IN_PROGRESS" ? (
                    <Clock className="size-3.5 text-amber-700 animate-pulse" />
                  ) : (
                    <div className="size-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <div className="mt-2 font-bold text-xs font-serif">{step.label}</div>
                <div className="mt-1 text-[10px] opacity-80">{step.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
