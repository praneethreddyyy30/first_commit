"use client";

import React, { useState, useMemo } from "react";
import { UserProfile, CedarEvaluationResult } from "@/lib/cedar/evaluator";
import { DEMO_PERSONAS, DemoPersona, BLANK_CITIZEN_PROFILE, BLANK_CITIZEN_AUDIT } from "@/data/demoPersonas";
import { getAllStates, getDistrictsForState, getVillagesAndTownsForDistrict } from "@/data/indiaLocations";
import { DocumentAuditInput } from "@/lib/audit/documentAuditor";
import {
  ShieldCheck,
  User,
  GraduationCap,
  Landmark,
  Home,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  School,
  Award,
  Zap,
  Check,
  FileText,
  MapPin,
  CreditCard,
  Building2,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  Info
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
  onAuditInputChange,
  onNavigateToSchemes,
  onNavigateToAudit,
}) => {
  const [saveToast, setSaveToast] = useState(false);

  const allStates = useMemo(() => getAllStates(), []);
  const currentDistricts = useMemo(() => getDistrictsForState(profile.state), [profile.state]);
  const currentVillagesAndTowns = useMemo(
    () => getVillagesAndTownsForDistrict(profile.state, profile.district || ""),
    [profile.state, profile.district]
  );

  const eligibleCount = evaluationResults.filter((r) => r.decision === "ALLOW").length;
  const isTamilNadu = profile.state === "Tamil Nadu";
  const isAndhraPradesh = profile.state === "Andhra Pradesh";

  const handleSelectPersona = (persona: DemoPersona) => {
    onProfileChange(persona.profile);
    if (onAuditInputChange) {
      onAuditInputChange(persona.auditInput);
    }
  };

  const handleResetToBlank = () => {
    onProfileChange(BLANK_CITIZEN_PROFILE);
    if (onAuditInputChange) {
      onAuditInputChange(BLANK_CITIZEN_AUDIT);
    }
  };

  const handleSaveProfile = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("jansetu_user_profile", JSON.stringify(profile));
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 3000);
      } catch (e) {
        console.error("Save failed", e);
      }
    }
  };

  const toggleHeldDoc = (docId: string) => {
    const current = profile.heldDocuments || [];
    const updated = current.includes(docId)
      ? current.filter((d) => d !== docId)
      : [...current, docId];
    onProfileChange({ ...profile, heldDocuments: updated });
  };

  return (
    <div className="space-y-6">
      {/* Official Gov Identity Card Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#EDE6DD] bg-white p-6 shadow-luxury">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Citizen Card */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0B1B4F] via-[#152864] to-[#040B22] text-[#F5E29F] font-black text-2xl shadow-md ring-4 ring-[#FAF0C8] font-serif">
                {profile.name ? profile.name.charAt(0) : "U"}
              </div>
              <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white ring-2 ring-white font-bold">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-[#0B1B4F] sm:text-2xl font-serif">
                  {profile.name || "Unnamed Citizen (New Registration)"}
                </h2>
                <span className="rounded-full bg-[#0B1B4F] px-2.5 py-0.5 text-[10px] font-bold text-[#F5E29F] uppercase tracking-wider font-mono">
                  UID: JS-{profile.state === "Tamil Nadu" ? "TN" : profile.state === "Andhra Pradesh" ? "AP" : "IN"}-2026-8841
                </span>
              </div>

              <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {profile.state} Domicile
                </span>
                <span>•</span>
                <span>Category: <strong className="text-slate-900">{profile.category} {isTamilNadu && profile.tnCommunity !== "None" ? `(${profile.tnCommunity})` : isAndhraPradesh && profile.apCommunity !== "None" ? `(${profile.apCommunity})` : ""}</strong></span>
                <span>•</span>
                <span>Income: <strong className="text-slate-900">₹{profile.annualFamilyIncome.toLocaleString("en-IN")}/yr</strong></span>
                <span>•</span>
                <span>Education: <strong className="text-slate-900">{profile.educationLevel}</strong></span>
              </p>

              {/* Status Verification Badges */}
              <div className="pt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> Aadhaar e-KYC: Verified
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF4EB] px-2.5 py-0.5 text-[11px] font-semibold text-[#854D0E] border border-[#E8DCCB]">
                  <MapPin className="size-3.5 text-amber-700" /> Domicile Verified
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200">
                  <FileText className="size-3.5 text-amber-700" /> DigiLocker: {profile.heldDocuments?.length || 0} Docs Synced
                </span>
              </div>
            </div>
          </div>

          {/* Right: Primary Call to Action & Navigation */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5">
            <button
              onClick={onNavigateToSchemes}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#0B1B4F] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#071233] transition-all cursor-pointer border border-[#142A6F]"
            >
              <span>Explore Schemes For You</span>
              <span className="rounded-full bg-[#DFB738]/20 text-[#F5E29F] border border-[#DFB738]/40 px-2.5 py-0.5 text-xs font-black">
                {eligibleCount} Qualified
              </span>
              <ArrowRight className="size-4 text-[#F5E29F]" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveProfile}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-[#DACBB8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0B1B4F] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-2xs"
              >
                <Check className="size-3.5 text-emerald-600" />
                <span>Save Profile</span>
              </button>

              <button
                onClick={handleResetToBlank}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-[#EDE6DD] bg-[#FAF4EB] px-3.5 py-1.5 text-xs font-semibold text-[#854D0E] hover:bg-amber-100/60 transition-colors cursor-pointer shadow-2xs"
              >
                <RotateCcw className="size-3.5 text-amber-700" />
                <span>Register New / Blank</span>
              </button>
            </div>
          </div>
        </div>

        {saveToast && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm animate-fade-in">
            <CheckCircle2 className="size-4" />
            <span>Citizen master profile successfully saved to local persistent storage!</span>
          </div>
        )}
      </div>

      {/* Quick Personas Switcher Bar */}
      <div className="rounded-2xl border border-[#EDE6DD] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-600" />
            <h3 className="text-xs font-bold text-[#0B1B4F] uppercase tracking-wider font-display">
              Quick Client Roster (9 Real-World Personas Across States):
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline font-sans">
            Click any citizen to auto-populate and test real-time eligibility
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DEMO_PERSONAS.map((p) => {
            const isSelected = profile.name === p.profile.name;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPersona(p)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0B1B4F] text-[#F5E29F] shadow-sm ring-1 ring-[#DFB738]/50 font-bold"
                    : "border border-[#EDE6DD] bg-[#FAF7F2] text-slate-700 hover:bg-[#F4ECE1] hover:text-[#0B1B4F]"
                }`}
                title={p.story}
              >
                <span>{p.name}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                    isSelected
                      ? "bg-[#DFB738]/20 text-[#F5E29F]"
                      : "bg-[#EDE6DD] text-slate-700"
                  }`}
                >
                  {p.state.split(" ")[0]} • {p.categoryTag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable Official Profile Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* SECTION A: Demographics & Legal Identity */}
        <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EDE6DD]">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF0C8] text-[#854D0E]">
              <User className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1B4F] font-serif">1. Demographics & Legal Identity</h3>
              <p className="text-[11px] text-slate-500">Official citizen names as registered with UIDAI & Civil Registries</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name (as per Aadhaar)
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => onProfileChange({ ...profile, name: e.target.value })}
                placeholder="e.g. Sravani Reddy"
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) =>
                  onProfileChange({ ...profile, gender: e.target.value as "Female" | "Male" | "Other" })
                }
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              >
                <option value="Female">Female (Eligible for Women Grants)</option>
                <option value="Male">Male</option>
                <option value="Other">Transgender / Non-Binary</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isPersonWithDisability}
                  onChange={(e) =>
                    onProfileChange({
                      ...profile,
                      isPersonWithDisability: e.target.checked,
                      disabilityPercentage: e.target.checked ? 40 : 0
                    })
                  }
                  className="size-4 rounded border-[#DACBB8] text-[#0B1B4F] focus:ring-[#DFB738]"
                />
                <span>Person with Disability (Divyangjan)</span>
              </label>
            </div>

            {profile.isPersonWithDisability && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disability % (UDID Card)
                </label>
                <input
                  type="number"
                  value={profile.disabilityPercentage || 40}
                  onChange={(e) =>
                    onProfileChange({ ...profile, disabilityPercentage: Number(e.target.value) })
                  }
                  min={40}
                  max={100}
                  className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isOrphanOrSingleParent || false}
                  onChange={(e) =>
                    onProfileChange({ ...profile, isOrphanOrSingleParent: e.target.checked })
                  }
                  className="size-4 rounded border-[#DACBB8] text-[#0B1B4F] focus:ring-[#DFB738]"
                />
                <span>Orphan / Single Parent Dependent (Priority Quota)</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION B: Domicile, Location & Social Quotas */}
        <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EDE6DD]">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF0C8] text-[#854D0E]">
              <MapPin className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1B4F] font-serif">2. Domicile & Social Classification</h3>
              <p className="text-[11px] text-slate-500">Determines state flagship vs centrally sponsored scheme reservations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  State Domicile
                </label>
                <span className="text-[10px] font-semibold text-[#0B1B4F] bg-[#FAF0C8] px-1.5 py-0.5 rounded border border-[#DFB738]/30">
                  {allStates.length} States / UTs
                </span>
              </div>
              <select
                value={profile.state}
                onChange={(e) => {
                  const newState = e.target.value;
                  const newDistricts = getDistrictsForState(newState);
                  const nextDistrict = newDistricts.length > 0 ? newDistricts[0] : "";
                  const newVillages = getVillagesAndTownsForDistrict(newState, nextDistrict);
                  const nextVillage = newVillages.length > 0 ? newVillages[0] : "";
                  onProfileChange({
                    ...profile,
                    state: newState,
                    district: nextDistrict,
                    villageOrTown: nextVillage,
                    tnCommunity: newState === "Tamil Nadu" ? "MBC" : "None",
                    apCommunity: newState === "Andhra Pradesh" ? "BC-A" : "None"
                  });
                }}
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              >
                {allStates.map((st) => (
                  <option key={st} value={st}>
                    {st} {st === "Tamil Nadu" || st === "Andhra Pradesh" ? "(Flagship Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  District / Region
                </label>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {currentDistricts.length} Districts in {profile.state}
                </span>
              </div>
              <select
                value={profile.district || ""}
                onChange={(e) => {
                  const nextDistrict = e.target.value;
                  const newVillages = getVillagesAndTownsForDistrict(profile.state, nextDistrict);
                  const nextVillage = newVillages.length > 0 ? newVillages[0] : "";
                  onProfileChange({
                    ...profile,
                    district: nextDistrict,
                    villageOrTown: nextVillage
                  });
                }}
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              >
                {currentDistricts.length === 0 ? (
                  <option value="">No districts listed</option>
                ) : (
                  <>
                    {!currentDistricts.includes(profile.district || "") && (
                      <option value="">-- Select District --</option>
                    )}
                    {currentDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Village / Town
                </label>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {currentVillagesAndTowns.length} Villages & Towns in {profile.district ? profile.district.split(" ")[0] : "District"}
                </span>
              </div>
              <select
                value={profile.villageOrTown || ""}
                onChange={(e) => onProfileChange({ ...profile, villageOrTown: e.target.value })}
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              >
                {currentVillagesAndTowns.length === 0 ? (
                  <option value="">No villages or towns available</option>
                ) : (
                  <>
                    {!currentVillagesAndTowns.includes(profile.villageOrTown || "") && (
                      <option value={profile.villageOrTown || ""}>
                        {profile.villageOrTown || "-- Select Village / Town --"}
                      </option>
                    )}
                    {currentVillagesAndTowns.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Select your native village or town to localize your nearest citizen service centers
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Social Category
              </label>
              <select
                value={profile.category}
                onChange={(e) =>
                  onProfileChange({
                    ...profile,
                    category: e.target.value as "SC" | "ST" | "OBC" | "General" | "EWS"
                  })
                }
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              >
                <option value="OBC">OBC (Other Backward Classes)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
                <option value="General">General / Open Competition</option>
              </select>
            </div>

            {/* State-Specific Community Quota */}
            {isTamilNadu && (
              <div>
                <label className="block text-xs font-semibold text-[#854D0E] mb-1">
                  TN State Community Quota
                </label>
                <select
                  value={profile.tnCommunity || "MBC"}
                  onChange={(e) =>
                    onProfileChange({
                      ...profile,
                      tnCommunity: e.target.value as any
                    })
                  }
                  className="w-full rounded-xl border border-[#DFC8A5] bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
                >
                  <option value="MBC">MBC (Most Backward Class - 20%)</option>
                  <option value="DNC">DNC (De-notified Communities)</option>
                  <option value="BC">BC (Backward Class - 26.5%)</option>
                  <option value="BCM">BCM (Backward Class Muslim - 3.5%)</option>
                  <option value="SC">SC (Scheduled Caste - 15%)</option>
                  <option value="SCA">SCA (SC Arunthathiyar - 3%)</option>
                  <option value="ST">ST (Scheduled Tribe - 1%)</option>
                  <option value="OC">OC (Open Category)</option>
                </select>
              </div>
            )}

            {isAndhraPradesh && (
              <div>
                <label className="block text-xs font-semibold text-[#854D0E] mb-1">
                  AP State Community Quota
                </label>
                <select
                  value={profile.apCommunity || "BC-A"}
                  onChange={(e) =>
                    onProfileChange({
                      ...profile,
                      apCommunity: e.target.value as any
                    })
                  }
                  className="w-full rounded-xl border border-[#DFC8A5] bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#0B1B4F] focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
                >
                  <option value="BC-A">BC-A (Aboriginal tribes, vimukta jathis - 7%)</option>
                  <option value="BC-B">BC-B (Occupational groups - 10%)</option>
                  <option value="BC-C">BC-C (Scheduled Caste converts to Christianity - 1%)</option>
                  <option value="BC-D">BC-D (Other Classes - 7%)</option>
                  <option value="BC-E">BC-E (Socially & Educationally Backward Muslims - 4%)</option>
                  <option value="SC">SC (Scheduled Caste - 15%)</option>
                  <option value="ST">ST (Scheduled Tribe - 6%)</option>
                  <option value="Kapu">Kapu / Telaga / Balija Welfare</option>
                  <option value="EBC">EBC (Economically Backward Class)</option>
                  <option value="OC">OC (Open Competition)</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isMinority}
                  onChange={(e) => onProfileChange({ ...profile, isMinority: e.target.checked })}
                  className="size-4 rounded border-[#DACBB8] text-[#0B1B4F] focus:ring-[#DFB738]"
                />
                <span>Religious Minority (Muslim, Christian, Sikh, Buddhist, Jain, Parsi)</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION C: Academic History & Schooling Credentials */}
        <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EDE6DD]">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF0C8] text-[#854D0E]">
              <GraduationCap className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1B4F] font-serif">3. Academic History & Schooling</h3>
              <p className="text-[11px] text-slate-500">Crucial for fee reimbursements, 7.5% quotas, and merit scholarships</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Education Level
              </label>
              <select
                value={profile.educationLevel}
                onChange={(e) => onProfileChange({ ...profile, educationLevel: e.target.value as any })}
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              >
                <option value="Class 10">Class 10 (Secondary School)</option>
                <option value="12th">Class 12 (Higher Secondary)</option>
                <option value="Diploma">Polytechnic / Vocational Diploma</option>
                <option value="UG">Undergraduate (B.Tech / MBBS / B.Sc / B.A / B.Com)</option>
                <option value="PG">Postgraduate (M.Tech / M.Sc / MBA / M.Com)</option>
                <option value="PhD">PhD / Doctoral</option>
                <option value="Other">Other Category</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission Quota
              </label>
              <select
                value={profile.admissionQuota}
                onChange={(e) => onProfileChange({ ...profile, admissionQuota: e.target.value as any })}
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              >
                <option value="Merit/Govt Counseling">Merit / Govt Counseling (Eligible)</option>
                <option value="Management Quota">Management Quota (Disqualified from Fee Reimbursement)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Merit (%)
              </label>
              <input
                type="number"
                value={profile.marksPercentage}
                onChange={(e) => onProfileChange({ ...profile, marksPercentage: Number(e.target.value) })}
                min={35}
                max={100}
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institution Type
              </label>
              <select
                value={profile.institutionType}
                onChange={(e) => onProfileChange({ ...profile, institutionType: e.target.value as any })}
                className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
              >
                <option value="Government">Government Institution</option>
                <option value="Govt-Aided">Government-Aided Institution</option>
                <option value="Private Self-Financing">Private Self-Financing College</option>
                <option value="Premier/Notified (IIT/NIT/AIIMS)">Premier / Notified (IIT, NIT, AIIMS)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.studiedInGovtSchool6To12}
                  onChange={(e) =>
                    onProfileChange({ ...profile, studiedInGovtSchool6To12: e.target.checked })
                  }
                  className="size-4 rounded border-[#DACBB8] text-[#0B1B4F] focus:ring-[#DFB738]"
                />
                <span className="text-[#0B1B4F] font-bold">Continuous Govt Schooling Class 6 to 12 (Mandatory for Pudhumai Penn & 7.5% Quota)</span>
              </label>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isFirstGraduateInFamily}
                  onChange={(e) =>
                    onProfileChange({ ...profile, isFirstGraduateInFamily: e.target.checked })
                  }
                  className="size-4 rounded border-[#DACBB8] text-[#0B1B4F] focus:ring-[#DFB738]"
                />
                <span>First Graduate in Immediate Family (REV-104 Fee Concession)</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION D: Socio-Economic, Assets & Electricity */}
        <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EDE6DD]">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF0C8] text-[#854D0E]">
              <Landmark className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1B4F] font-serif">4. Socio-Economic, Assets & Power</h3>
              <p className="text-[11px] text-slate-500">Ration cards, income ceilings, and statutory power consumption limits</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Annual Family Income</span>
                <span className="text-sm font-black text-[#0B1B4F] font-serif">
                  ₹{profile.annualFamilyIncome.toLocaleString("en-IN")} / year
                </span>
              </div>
              <input
                type="range"
                min={30000}
                max={1000000}
                step={10000}
                value={profile.annualFamilyIncome}
                onChange={(e) =>
                  onProfileChange({ ...profile, annualFamilyIncome: Number(e.target.value) })
                }
                className="w-full accent-[#DFB738] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-semibold">
                <span>₹30K (BPL)</span>
                <span>₹2.5L (Post-Matric Limit)</span>
                <span>₹8.0L (Creamy Layer / EWS)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Domestic Electricity (Units/Year)
                </label>
                <input
                  type="number"
                  value={profile.electricityUnitsPerYear || 1800}
                  onChange={(e) =>
                    onProfileChange({ ...profile, electricityUnitsPerYear: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-600 mt-1 block font-medium">
                  {profile.electricityUnitsPerYear && profile.electricityUnitsPerYear > 3600 ? (
                    <strong className="text-rose-600">⚠️ Exceeds AP statutory 3,600 units/yr cap!</strong>
                  ) : (
                    "✓ Within AP 3,600 units/yr statutory limit"
                  )}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agricultural Land (Acres)
                </label>
                <input
                  type="number"
                  value={profile.agriculturalLandAcres || 0}
                  onChange={(e) =>
                    onProfileChange({ ...profile, agriculturalLandAcres: Number(e.target.value) })
                  }
                  step={0.5}
                  className="w-full rounded-xl border border-[#EDE6DD] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION E: Bank Account & Aadhaar NPCI DBT Seeding */}
        <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#EDE6DD]">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF0C8] text-[#854D0E]">
                <CreditCard className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1B4F] font-serif">5. Bank Account & Aadhaar NPCI DBT Seeding</h3>
                <p className="text-[11px] text-slate-500">Direct Benefit Transfer operates strictly through NPCI Aadhaar Mapper</p>
              </div>
            </div>

            {onNavigateToAudit && (
              <button
                onClick={onNavigateToAudit}
                className="flex items-center gap-1 text-xs font-bold text-[#0B1B4F] hover:text-[#854D0E] hover:underline cursor-pointer"
              >
                <span>Audit NPCI Status & Documents</span>
                <ChevronRight className="size-3.5 text-[#854D0E]" />
              </button>
            )}
          </div>

          <div className="rounded-xl border border-[#DFC8A5] bg-[#FAF4EB] p-3.5 text-xs text-[#854D0E] flex items-start gap-2.5">
            <Info className="size-4 shrink-0 text-amber-700 mt-0.5" />
            <p>
              <strong>Critical Civic Directive:</strong> Linking your Aadhaar to a bank account is NOT the same as NPCI DBT Seeding. Scholarships and grants are disbursed strictly to the bank account mapped in the NPCI central mapper.
            </p>
          </div>
        </div>

        {/* SECTION F: DigiLocker & Uploaded Certificates Checklist */}
        <div className="rounded-2xl border border-[#EDE6DD] bg-white p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#EDE6DD]">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#FAF0C8] text-[#854D0E]">
                <FileCheck2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1B4F] font-serif">6. Uploaded / Digital Locker Certificates Repository</h3>
                <p className="text-[11px] text-slate-500">Toggle documents currently held by the citizen to evaluate missing prerequisite roadblocks</p>
              </div>
            </div>

            <span className="rounded-full bg-[#FAF4EB] border border-[#E8DCCB] px-2.5 py-0.5 text-xs font-bold text-[#854D0E]">
              {profile.heldDocuments?.length || 0} Certificates Registered
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[
              { id: "Aadhaar_Card", name: "Aadhaar Card (UIDAI)" },
              { id: "Marksheet_10_12", name: "10th / 12th Marks Memo" },
              { id: "Income_Certificate", name: "Income Certificate (Tahsildar)" },
              { id: "Caste_Certificate", name: "Community / Caste Certificate" },
              { id: "Domicile_Certificate", name: "Nativity / Domicile Certificate" },
              { id: "Bank_Passbook", name: "Bank Account Passbook" },
              { id: "Ration_Card", name: "Ration Card / White Rice Card" },
              { id: "TN_First_Graduate_Cert", name: "First Graduate Certificate (REV-104)" },
              { id: "Govt_School_Study_Certificate", name: "Govt School 6-12 Study Memo" },
              { id: "Disability_Certificate", name: "UDID Disability Certificate" },
              { id: "EWS_Certificate", name: "EWS Central Certificate" },
              { id: "College_Bonafide_Certificate", name: "College Bonafide / Admission Order" },
            ].map((doc) => {
              const isHeld = (profile.heldDocuments || []).includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => toggleHeldDoc(doc.id)}
                  type="button"
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    isHeld
                      ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 shadow-2xs"
                      : "border-[#EDE6DD] bg-white text-slate-600 hover:border-[#DACBB8]"
                  }`}
                >
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                      isHeld
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isHeld && <Check className="size-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-semibold leading-tight">{doc.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-30 rounded-2xl border border-[#142A6F] bg-[#0B1B4F]/95 backdrop-blur-md p-4 text-white shadow-luxury ring-1 ring-[#DFB738]/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#152864] border border-[#DFB738]/40 font-bold text-sm text-[#F5E29F]">
              JS
            </div>
            <div>
              <p className="text-xs font-bold text-white font-serif">
                {profile.name || "Client"} • {profile.state} ({profile.category})
              </p>
              <p className="text-[11px] text-[#F5E29F]/80">
                Annual Income: ₹{profile.annualFamilyIncome.toLocaleString("en-IN")} • {profile.heldDocuments?.length || 0} documents verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleSaveProfile}
              className="flex-1 sm:flex-none rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              Save Details
            </button>

            <button
              onClick={onNavigateToSchemes}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#DFB738] to-[#C29621] text-[#071233] px-6 py-2.5 text-xs font-extrabold shadow-md hover:brightness-105 transition-all cursor-pointer"
            >
              <span>Explore Schemes For You</span>
              <span className="rounded-full bg-[#071233]/20 px-2.5 py-0.5 text-[10px] font-black text-[#071233]">
                {eligibleCount} Qualified
              </span>
              <ArrowRight className="size-3.5 text-[#071233]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
