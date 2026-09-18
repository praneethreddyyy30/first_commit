"use client";

import React, { useState } from "react";
import { UserProfile, CedarEvaluationResult } from "@/lib/cedar/evaluator";
import { DocumentAuditInput } from "@/lib/audit/documentAuditor";
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  MapPin,
  User,
  IndianRupee,
  Check,
  CheckCircle2,
  Award
} from "lucide-react";

interface CitizenProfilePageProps {
  profile: UserProfile;
  evaluationResults: CedarEvaluationResult[];
  onProfileChange: (newProfile: UserProfile) => void;
  onAuditInputChange?: (newAudit: DocumentAuditInput) => void;
  onNavigateToSchemes: () => void;
  onNavigateToAudit?: () => void;
}

export const CitizenProfilePage: React.FC<CitizenProfilePageProps> = ({
  profile,
  evaluationResults,
  onProfileChange,
  onNavigateToSchemes,
}) => {
  const [saveToast, setSaveToast] = useState(false);

  const eligibleCount = evaluationResults.filter((r) => r.decision === "ALLOW").length;
  const isTamilNadu = profile.state === "Tamil Nadu";
  const isAndhraPradesh = profile.state === "Andhra Pradesh";

  const handleStateChange = (newState: string) => {
    onProfileChange({
      ...profile,
      state: newState,
      tnCommunity: newState === "Tamil Nadu" ? "MBC" : "None",
      apCommunity: newState === "Andhra Pradesh" ? "BC-A" : "None",
    });
  };

  const handleSaveProfile = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("jansetu_user_profile", JSON.stringify(profile));
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2500);
      } catch (e) {
        console.error("Save failed", e);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* 1. Hero Welcoming Banner (Vibrant & Clear, Zero Wall of Text) */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-700 via-indigo-800 to-purple-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-indigo-100 backdrop-blur-xs border border-white/20">
              <Sparkles className="size-3.5 text-amber-300" />
              <span>Step 1 of 3: Instant Eligibility Check</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Check Your Government Scheme Eligibility
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Answer 5 simple questions below to discover every State & Central welfare scheme you legally qualify for. Zero paperwork required to check.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <button
              onClick={onNavigateToSchemes}
              className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>View Schemes For You</span>
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-black text-white">
                {eligibleCount} Matched
              </span>
              <ArrowRight className="size-4" />
            </button>
            <span className="text-[11px] text-indigo-200/80">
              15 Central & State Schemes Evaluated
            </span>
          </div>
        </div>

        {/* Decorative ambient background rings */}
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 size-64 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
      </div>

      {saveToast && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md animate-in fade-in duration-200">
          <CheckCircle2 className="size-4" />
          <span>Profile saved! Changes are automatically evaluated in real time.</span>
        </div>
      )}

      {/* 2. Visual Stepped Form Tiles */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* TILE 1: Where do you live? (State Domicile) */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 font-bold">
              <MapPin className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                1. Location & Domicile
              </h3>
              <p className="text-[11px] text-slate-500">Determines your state flagship benefits</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">Select Your State:</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleStateChange("Andhra Pradesh")}
                className={`flex flex-col items-start p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  isAndhraPradesh
                    ? "border-teal-600 bg-teal-50/70 shadow-xs ring-2 ring-teal-500/30"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base font-black text-slate-900">🌾 Andhra Pradesh</span>
                  {isAndhraPradesh && <Check className="size-4 text-teal-600 stroke-[3]" />}
                </div>
                <span className="text-[10px] text-teal-700 font-bold mt-1">
                  Vidya Deevena & Aarogyasri Active
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStateChange("Tamil Nadu")}
                className={`flex flex-col items-start p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  isTamilNadu
                    ? "border-purple-600 bg-purple-50/70 shadow-xs ring-2 ring-purple-500/30"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base font-black text-slate-900">🏛️ Tamil Nadu</span>
                  {isTamilNadu && <Check className="size-4 text-purple-600 stroke-[3]" />}
                </div>
                <span className="text-[10px] text-purple-700 font-bold mt-1">
                  Pudhumai Penn & CMCHIS Active
                </span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                District / Mandal:
              </label>
              <input
                type="text"
                value={profile.district}
                onChange={(e) => onProfileChange({ ...profile, district: e.target.value })}
                placeholder={isAndhraPradesh ? "e.g. NTR / Krishna, Guntur, Visakhapatnam" : "e.g. Chennai, Madurai, Coimbatore"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* TILE 2: Who is Applying? (Personal Demographics) */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
              <User className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                2. Who is Applying?
              </h3>
              <p className="text-[11px] text-slate-500">Applicant identity and demographics</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name:</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => onProfileChange({ ...profile, name: e.target.value })}
                placeholder="e.g. Madhira Sravani"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "Female", label: "👩 Female", hint: "Women Grants" },
                  { value: "Male", label: "👨 Male", hint: "" },
                  { value: "Other", label: "⚧ Other", hint: "" },
                ].map((g) => {
                  const isSelected = profile.gender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => onProfileChange({ ...profile, gender: g.value as any })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-500"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-xs font-bold">{g.label}</div>
                      {g.hint && <div className="text-[9px] text-indigo-600 font-semibold">{g.hint}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* TILE 3: Social Category & Community Quota */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
              <Award className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                3. Social Category & Quota
              </h3>
              <p className="text-[11px] text-slate-500">Government affirmative action criteria</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category:</label>
              <div className="flex flex-wrap gap-2">
                {["OBC", "SC", "ST", "EWS", "General"].map((cat) => {
                  const isSelected = profile.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => onProfileChange({ ...profile, category: cat as any })}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-xs"
                          : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* State Sub-Community Quota */}
            {isAndhraPradesh && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-teal-800 mb-1">
                  AP Community Group:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["BC-A", "BC-B", "BC-C", "BC-D", "BC-E", "SC", "ST", "Kapu", "OC"].map((grp) => {
                    const isSelected = profile.apCommunity === grp;
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => onProfileChange({ ...profile, apCommunity: grp as any })}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-teal-600 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {grp}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isTamilNadu && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-purple-800 mb-1">
                  TN Community Quota:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "MBC", label: "MBC (20%)" },
                    { id: "BC", label: "BC (26.5%)" },
                    { id: "BCM", label: "BCM (3.5%)" },
                    { id: "SC", label: "SC (15%)" },
                    { id: "SCA", label: "SCA (3%)" },
                    { id: "ST", label: "ST (1%)" },
                    { id: "OC", label: "OC" },
                  ].map((grp) => {
                    const isSelected = profile.tnCommunity === grp.id;
                    return (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => onProfileChange({ ...profile, tnCommunity: grp.id as any })}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {grp.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TILE 4: Education & Annual Family Income */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                4. Education & Family Income
              </h3>
              <p className="text-[11px] text-slate-500">Determines financial eligibility thresholds</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Education Level:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "Class_1_10", label: "🏫 School (1-10)" },
                  { value: "Class_11_12", label: "🎓 Intermediate (11-12)" },
                  { value: "UG", label: "🏛️ College / Degree" },
                  { value: "PG", label: "🔬 Postgrad / Masters" },
                ].map((edu) => {
                  const isSelected = profile.educationLevel === edu.value;
                  return (
                    <button
                      key={edu.value}
                      type="button"
                      onClick={() => onProfileChange({ ...profile, educationLevel: edu.value as any })}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {edu.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Annual Family Income:</label>
                <span className="font-mono text-xs font-extrabold text-emerald-700">
                  ₹{profile.annualFamilyIncome.toLocaleString("en-IN")} / yr
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: 80000, label: "< ₹1 Lakh" },
                  { val: 150000, label: "₹1.5 Lakhs" },
                  { val: 240000, label: "₹2.4 Lakhs" },
                  { val: 350000, label: "₹3.5 Lakhs" },
                ].map((inc) => (
                  <button
                    key={inc.val}
                    type="button"
                    onClick={() => onProfileChange({ ...profile, annualFamilyIncome: inc.val })}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all ${
                      profile.annualFamilyIncome === inc.val
                        ? "bg-emerald-600 text-white font-bold"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {inc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TILE 5: Special Criteria (Clean One-Click Checkboxes) */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
          5. Special Qualifications (Check all that apply):
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100 transition-all">
            <input
              type="checkbox"
              checked={profile.isFirstGraduateInFamily || false}
              onChange={(e) => onProfileChange({ ...profile, isFirstGraduateInFamily: e.target.checked })}
              className="size-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>First Graduate in Family</span>
          </label>

          <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100 transition-all">
            <input
              type="checkbox"
              checked={profile.studiedInGovtSchool6To12 || false}
              onChange={(e) => onProfileChange({ ...profile, studiedInGovtSchool6To12: e.target.checked })}
              className="size-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Govt School Student (6-12)</span>
          </label>

          <label className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100 transition-all">
            <input
              type="checkbox"
              checked={profile.isPersonWithDisability || false}
              onChange={(e) => onProfileChange({ ...profile, isPersonWithDisability: e.target.checked, disabilityPercentage: e.target.checked ? 40 : 0 })}
              className="size-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Person with Disability (PwD)</span>
          </label>
        </div>
      </div>

      {/* 3. High-Impact Primary Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={onNavigateToSchemes}
          className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-600 px-10 py-4 text-base font-black text-white shadow-xl shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Show My Eligible Schemes</span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black text-white">
            {eligibleCount} Available
          </span>
          <ArrowRight className="size-5" />
        </button>

        <button
          onClick={handleSaveProfile}
          className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
        >
          <Check className="size-3.5 text-emerald-600" />
          <span>Save Profile</span>
        </button>
      </div>
    </div>
  );
};
