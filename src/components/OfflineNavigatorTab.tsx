"use client";

import React, { useState, useMemo } from "react";
import {
  REAL_OFFLINE_CENTERS,
  REAL_SERVICE_FEE_SCHEDULE,
  OfflineCenter,
  ServiceFeeDetail
} from "@/data/cscDirectory";
import {
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Search,
  Building,
  Navigation,
  ExternalLink,
  Receipt,
  AlertOctagon,
  Scale,
  FileCheck
} from "lucide-react";

interface OfflineNavigatorTabProps {
  userState?: string;
  userDistrict?: string;
  userVillage?: string;
  targetSchemeId?: string;
}

export const OfflineNavigatorTab: React.FC<OfflineNavigatorTabProps> = ({
  userState = "Andhra Pradesh",
  userDistrict,
  userVillage,
  targetSchemeId,
}) => {
  const isKnownState = REAL_OFFLINE_CENTERS.some((c) => c.state === userState);
  const [selectedState, setSelectedState] = useState<string>(isKnownState ? userState : "All States");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fee Calculator selected service
  const initialService = useMemo(() => {
    if (userState === "Andhra Pradesh") return "AP_MeeSeva_REV01";
    if (userState === "Tamil Nadu") return "TN_eSevai_REV104";
    return REAL_SERVICE_FEE_SCHEDULE[0].serviceId;
  }, [userState]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialService);

  // Sync state when prop changes
  React.useEffect(() => {
    if (userState) {
      const isKnown = REAL_OFFLINE_CENTERS.some((c) => c.state === userState);
      setSelectedState(isKnown ? userState : "All States");
      if (userState === "Andhra Pradesh") {
        setSelectedServiceId("AP_MeeSeva_REV01");
      } else if (userState === "Tamil Nadu") {
        setSelectedServiceId("TN_eSevai_REV104");
      }
    }
  }, [userState]);

  const selectedFeeDetail = useMemo(() => {
    return (
      REAL_SERVICE_FEE_SCHEDULE.find((s) => s.serviceId === selectedServiceId) ||
      REAL_SERVICE_FEE_SCHEDULE[0]
    );
  }, [selectedServiceId]);

  // Unique list of states
  const availableStates = useMemo(() => {
    const states = Array.from(new Set(REAL_OFFLINE_CENTERS.map((c) => c.state)));
    return ["All States", ...states];
  }, []);

  // Districts for selected state
  const availableDistricts = useMemo(() => {
    if (selectedState === "All States") {
      return ["All"];
    }
    const districts = Array.from(
      new Set(
        REAL_OFFLINE_CENTERS.filter((c) => c.state === selectedState).map((c) => c.district)
      )
    );
    return ["All", ...districts];
  }, [selectedState]);

  // Auto-match user's district when provided
  React.useEffect(() => {
    if (userDistrict && availableDistricts.length > 1) {
      const match = availableDistricts.find(
        (d) =>
          d.toLowerCase().includes(userDistrict.toLowerCase()) ||
          userDistrict.toLowerCase().includes(d.toLowerCase())
      );
      if (match) setSelectedDistrict(match);
    }
  }, [userDistrict, availableDistricts]);

  // Filtered Centers List
  const filteredCenters = useMemo(() => {
    const list = REAL_OFFLINE_CENTERS.filter((center) => {
      const matchState =
        selectedState === "All States" || center.state === selectedState;
      const matchDistrict =
        selectedDistrict === "All" || center.district === selectedDistrict;
      const matchType =
        selectedType === "ALL" || center.type === selectedType;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        center.name.toLowerCase().includes(q) ||
        center.address.toLowerCase().includes(q) ||
        center.district.toLowerCase().includes(q) ||
        center.centerId.toLowerCase().includes(q) ||
        center.servicesOffered.some((s) => s.toLowerCase().includes(q));

      return matchState && matchDistrict && matchType && matchQuery;
    });

    if (userVillage) {
      const vLower = userVillage.toLowerCase();
      return [...list].sort((a, b) => {
        const aMatches =
          a.address.toLowerCase().includes(vLower) ||
          a.name.toLowerCase().includes(vLower);
        const bMatches =
          b.address.toLowerCase().includes(vLower) ||
          b.name.toLowerCase().includes(vLower);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    return list;
  }, [selectedState, selectedDistrict, selectedType, searchQuery, userVillage]);

  return (
    <div className="space-y-8 font-sans">
      {/* SECTION 1: INTERACTIVE STATUTORY FEE CALCULATOR & ANTI-FRAUD GUARD */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 border-[#DFC8A5]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EDE6DD] pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-50 px-3 py-1 font-mono text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 border border-amber-200">
                <Scale className="size-3.5 text-amber-700" />
                Statutory Fee Transparency Guard
              </span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                Central & State Citizen Charter Verified
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B1B4F] font-serif">
              Calculate Your Legal Government Service Fee
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Check the legal, authorized fee for any service before visiting an offline counter. Never pay private cyber cafe operators more than the government-mandated price.
            </p>
          </div>

          {/* Service Selector Dropdown */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-bold text-[#0B1B4F] mb-1.5 uppercase tracking-wider font-serif">
              Select Government Service:
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full sm:w-80 rounded-xl border border-[#DFC8A5] bg-white px-3.5 py-2.5 text-xs font-bold text-[#0B1B4F] shadow-xs focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/30 focus:outline-none cursor-pointer"
            >
              {REAL_SERVICE_FEE_SCHEDULE.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.serviceName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Service Fee Breakdown Display */}
        <div className="mt-6 grid gap-4 lg:grid-cols-12 items-center">
          {/* Official Price breakdown (8 cols) */}
          <div className="lg:col-span-8 rounded-xl border border-[#EDE6DD] bg-[#FAF7F2] p-5.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE6DD] pb-3">
              <h4 className="text-sm sm:text-base font-bold text-[#0B1B4F] font-serif">
                {selectedFeeDetail.serviceName}
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Rule: {selectedFeeDetail.governingAct}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white border border-[#DFC8A5] p-3 shadow-2xs">
                <span className="block text-[11px] text-slate-600 font-bold uppercase tracking-wider font-serif">Govt Treasury Fee</span>
                <span className="mt-1 block text-xl font-black text-[#0B1B4F] font-serif">
                  ₹{selectedFeeDetail.govtTreasuryFee}
                </span>
                <span className="text-[10px] text-slate-400">Official Challan</span>
              </div>

              <div className="rounded-lg bg-white border border-[#DFC8A5] p-3 shadow-2xs">
                <span className="block text-[11px] text-slate-600 font-bold uppercase tracking-wider font-serif">CSC Operator Fee</span>
                <span className="mt-1 block text-xl font-black text-[#0B1B4F] font-serif">
                  ₹{selectedFeeDetail.authorizedOperatorCharge}
                </span>
                <span className="text-[10px] text-slate-400">Scanning & Upload</span>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-3 shadow-2xs">
                <span className="block text-[11px] text-emerald-900 font-bold uppercase tracking-wider font-serif">
                  Total Legal Fee
                </span>
                <span className="mt-1 block text-2xl font-black text-emerald-800 font-serif">
                  ₹{selectedFeeDetail.totalLegalFee}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700">Maximum Payable</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 border-t border-[#EDE6DD] pt-3">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-amber-700" />
                Guaranteed Service Delivery: <strong>{selectedFeeDetail.guaranteedDeliveryDays} Working Day(s)</strong>
              </span>
              <span className="flex items-center gap-1.5 text-[#0B1B4F] font-medium">
                <Receipt className="size-3.5 text-emerald-600" />
                Computerized Receipt Mandatory with Application No.
              </span>
            </div>
          </div>

          {/* Extortion Warning & Grievance (4 cols) */}
          <div className="lg:col-span-4 rounded-xl border border-rose-200 bg-rose-50/70 p-5 space-y-3">
            <div className="flex items-start gap-2 text-rose-950">
              <AlertOctagon className="size-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wide font-serif">
                  Illegal Extortion Alert
                </h5>
                <p className="mt-1 text-xs text-rose-800 leading-relaxed">
                  Cyber cafes often charge <strong>{selectedFeeDetail.cyberCafeExtortionRange}</strong> for this exact service. Charging above ₹{selectedFeeDetail.totalLegalFee} is an offense under the IT Act.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-2.5 text-[11px] text-slate-700 border border-rose-100 shadow-2xs">
              <span className="block font-semibold text-slate-900">Official Grievance Desk:</span>
              <span>{selectedFeeDetail.helpline}</span>
            </div>

            <a
              href={selectedFeeDetail.grievancePortalUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-rose-700 hover:bg-rose-800 px-3 py-2 text-xs font-bold text-white transition-colors shadow-sm"
            >
              <span>Lodge Grievance on CPGRAMS</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 2: VERIFIED OFFLINE CENTER LOCATOR */}
      <div className="luxury-card rounded-2xl p-6 sm:p-8 space-y-5">
        {/* Search & Filter Header */}
        <div className="space-y-4 border-b border-[#EDE6DD] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-[#0B1B4F] flex items-center gap-2.5 font-serif">
                <Building className="size-5 text-amber-700" />
                Verified Offline Service Centers Directory
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical centers for biometric authentication, revenue certificate sign-off, and physical verification.
              </p>
            </div>
            <span className="rounded-full bg-[#FAF7F2] border border-[#DFC8A5] px-3.5 py-1 text-xs font-mono font-bold text-[#0B1B4F]">
              Showing {filteredCenters.length} Center(s)
            </span>
          </div>

          {/* Filter Controls Row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* State Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#0B1B4F] mb-1 font-serif uppercase tracking-wider">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("All");
                }}
                className="w-full rounded-lg border border-[#DFC8A5] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:outline-hidden"
              >
                {availableStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* District Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#0B1B4F] mb-1 font-serif uppercase tracking-wider">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full rounded-lg border border-[#DFC8A5] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:outline-hidden"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Center Type Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#0B1B4F] mb-1 font-serif uppercase tracking-wider">Center Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-lg border border-[#DFC8A5] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#DFB738] focus:outline-hidden"
              >
                <option value="ALL">All Types</option>
                <option value="CSC">Common Service Center (CSC / Seva Kendra)</option>
                <option value="TEHSILDAR">Tehsildar / Taluk Office</option>
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="block text-[11px] font-bold text-[#0B1B4F] mb-1 font-serif uppercase tracking-wider">Search Keyword</label>
              <div className="relative">
                <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search address, VLE, center..."
                  className="w-full rounded-lg border border-[#DFC8A5] bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-[#DFB738] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Cards Grid */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {filteredCenters.map((center) => (
            <div
              key={center.id}
              className="luxury-card rounded-xl p-5.5 hover:border-[#DFB738] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Center Type & ID */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block rounded px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        center.type === "CSC"
                          ? "bg-[#0B1B4F] text-[#F5E29F]"
                          : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}
                    >
                      {center.type === "CSC" ? "Common Service Center" : "Tehsildar / Revenue Desk"}
                    </span>
                    <h5 className="mt-2 text-base font-bold text-[#0B1B4F] font-serif">
                      {center.name}
                    </h5>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 border border-[#DFC8A5] rounded px-2 py-0.5 bg-[#FAF7F2]">
                    {center.centerId}
                  </span>
                </div>

                {/* Location & Contact Details */}
                <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="size-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      {center.address}, {center.district}, {center.state} – <strong className="text-[#0B1B4F]">{center.pincode}</strong>
                      {center.distanceEstimate && (
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          ({center.distanceEstimate})
                        </span>
                      )}
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <Clock className="size-4 text-slate-400 shrink-0" />
                    <span>
                      <strong>{center.timing}</strong> ({center.workingDays})
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <Phone className="size-4 text-slate-400 shrink-0" />
                    <span>
                      Contact: <strong>{center.contactPerson}</strong> •{" "}
                      <a
                        href={`tel:${center.contactNumber}`}
                        className="text-[#0B1B4F] font-bold hover:underline font-mono"
                      >
                        {center.contactNumber}
                      </a>
                    </span>
                  </p>
                </div>

                {/* Services Handled Badges */}
                <div className="mt-4 border-t border-[#EDE6DD] pt-3">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-serif">
                    Authorized Services Handled at this Desk:
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {center.servicesOffered.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-medium text-[#0B1B4F] border border-[#DFC8A5]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Directions & Call */}
              <div className="mt-5 pt-3.5 border-t border-[#EDE6DD] flex items-center justify-between gap-3">
                <a
                  href={`tel:${center.contactNumber}`}
                  className="flex items-center gap-1.5 rounded-lg border border-[#DFC8A5] bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#FAF7F2] transition-colors"
                >
                  <Phone className="size-3.5 text-slate-500" />
                  <span>Call Desk</span>
                </a>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    center.mapsQuery
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[#0B1B4F] px-4 py-1.5 text-xs font-bold text-[#F5E29F] shadow-sm hover:bg-[#152864] transition-colors border border-[#DFB738]/40"
                >
                  <Navigation className="size-3.5" />
                  <span>Get Directions</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredCenters.length === 0 && (
          <div className="mt-8 text-center py-12 rounded-xl border border-dashed border-[#DFC8A5] bg-[#FAF7F2]/50 space-y-3">
            <Building className="size-10 text-[#DFC8A5] mx-auto" />
            <h5 className="text-sm font-bold text-[#0B1B4F] font-serif">No Service Centers Found</h5>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No centers match your current state & district filter. Click below to explore all centers across India.
            </p>
            <button
              onClick={() => {
                setSelectedState("All States");
                setSelectedDistrict("All");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B1B4F] px-4 py-2 text-xs font-bold text-[#F5E29F] hover:bg-[#152864] cursor-pointer shadow-sm border border-[#DFB738]/40"
            >
              <span>View All Centers Across India</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
