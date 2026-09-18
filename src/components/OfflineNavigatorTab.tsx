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
  
  // Resolve district matching user profile
  const matchedDistrict = useMemo(() => {
    if (!userDistrict) return "All";
    const available = REAL_OFFLINE_CENTERS.filter((c) => c.state === userState).map((c) => c.district);
    const found = available.find(
      (d) => d.toLowerCase().includes(userDistrict.toLowerCase()) || userDistrict.toLowerCase().includes(d.toLowerCase())
    );
    return found || "All";
  }, [userState, userDistrict]);

  const [selectedDistrict, setSelectedDistrict] = useState<string>(matchedDistrict);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fee Calculator selected service
  const initialService = useMemo(() => {
    if (targetSchemeId) {
      if (targetSchemeId.startsWith("AP_")) return "AP_MeeSeva_REV01";
      if (targetSchemeId.startsWith("TN_")) return "TN_eSevai_REV104";
      if (targetSchemeId.includes("PostMatric")) return "PostMatric_ST_Submission";
    }
    if (userState === "Andhra Pradesh") return "AP_MeeSeva_REV01";
    if (userState === "Tamil Nadu") return "TN_eSevai_REV104";
    return REAL_SERVICE_FEE_SCHEDULE[0].serviceId;
  }, [userState, targetSchemeId]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialService);

  // Sync state when props change
  React.useEffect(() => {
    if (userState) {
      const isKnown = REAL_OFFLINE_CENTERS.some((c) => c.state === userState);
      setSelectedState(isKnown ? userState : "All States");
      if (userDistrict) {
        const available = REAL_OFFLINE_CENTERS.filter((c) => c.state === userState).map((c) => c.district);
        const found = available.find(
          (d) => d.toLowerCase().includes(userDistrict.toLowerCase()) || userDistrict.toLowerCase().includes(d.toLowerCase())
        );
        setSelectedDistrict(found || "All");
      }
      if (targetSchemeId) {
        if (targetSchemeId.startsWith("AP_")) setSelectedServiceId("AP_MeeSeva_REV01");
        else if (targetSchemeId.startsWith("TN_")) setSelectedServiceId("TN_eSevai_REV104");
        else if (targetSchemeId.includes("PostMatric")) setSelectedServiceId("PostMatric_ST_Submission");
      } else if (userState === "Andhra Pradesh") {
        setSelectedServiceId("AP_MeeSeva_REV01");
      } else if (userState === "Tamil Nadu") {
        setSelectedServiceId("TN_eSevai_REV104");
      }
    }
  }, [userState, userDistrict, targetSchemeId]);

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

  // Filtered Centers List
  const filteredCenters = useMemo(() => {
    return REAL_OFFLINE_CENTERS.filter((center) => {
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
  }, [selectedState, selectedDistrict, selectedType, searchQuery]);

  return (
    <div className="space-y-8">
      {/* SECTION 1: INTERACTIVE STATUTORY FEE CALCULATOR & ANTI-FRAUD GUARD */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 via-slate-50 to-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-amber-200/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1 border border-amber-200">
                <Scale className="size-3 text-amber-900" />
                Statutory Fee Transparency Guard
              </span>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                Central & State Citizen Charter Verified
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Calculate Your Legal Government Service Fee
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Check the legal, authorized fee for any service before visiting an offline counter. Never pay private cyber cafe operators more than the government-mandated price.
            </p>
          </div>

          {/* Service Selector Dropdown */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Government Service:
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden cursor-pointer"
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
          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                {selectedFeeDetail.serviceName}
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Rule: {selectedFeeDetail.governingAct}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <span className="block text-[11px] text-slate-500 font-medium">Govt Treasury Fee</span>
                <span className="mt-1 block text-lg font-bold text-slate-900">
                  ₹{selectedFeeDetail.govtTreasuryFee}
                </span>
                <span className="text-[10px] text-slate-400">Official Challan</span>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <span className="block text-[11px] text-slate-500 font-medium">CSC Operator Fee</span>
                <span className="mt-1 block text-lg font-bold text-slate-900">
                  ₹{selectedFeeDetail.authorizedOperatorCharge}
                </span>
                <span className="text-[10px] text-slate-400">Scanning & Upload</span>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <span className="block text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                  Total Legal Fee
                </span>
                <span className="mt-1 block text-2xl font-black text-emerald-700">
                  ₹{selectedFeeDetail.totalLegalFee}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700">Maximum Payable</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-slate-400" />
                Guaranteed Service Delivery: <strong>{selectedFeeDetail.guaranteedDeliveryDays} Working Day(s)</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
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
                <h5 className="text-xs font-bold uppercase tracking-wide">
                  Illegal Extortion Alert
                </h5>
                <p className="mt-1 text-xs text-rose-800 leading-relaxed">
                  Cyber cafes often charge <strong>{selectedFeeDetail.cyberCafeExtortionRange}</strong> for this exact service. Charging above ₹{selectedFeeDetail.totalLegalFee} is an offense under the IT Act.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-2.5 text-[11px] text-slate-700 border border-rose-100">
              <span className="block font-semibold text-slate-900">Official Grievance Desk:</span>
              <span>{selectedFeeDetail.helpline}</span>
            </div>

            <a
              href={selectedFeeDetail.grievancePortalUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              <span>Lodge Grievance on CPGRAMS</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 2: VERIFIED OFFLINE CENTER LOCATOR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* Search & Filter Header */}
        <div className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="size-4 text-indigo-600" />
                Verified Offline Service Centers Directory
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical centers for biometric authentication, revenue certificate sign-off, and physical verification.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono font-medium text-slate-700">
              Showing {filteredCenters.length} Center(s)
            </span>
          </div>

          {/* Filter Controls Row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* State Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("All");
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Center Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="ALL">All Types</option>
                <option value="CSC">Common Service Center (CSC / Seva Kendra)</option>
                <option value="TEHSILDAR">Tehsildar / Taluk Office</option>
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Keyword</label>
              <div className="relative">
                <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search address, VLE, center..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
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
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Header: Center Type & ID */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        center.type === "CSC"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {center.type === "CSC" ? "Common Service Center" : "Tehsildar / Revenue Desk"}
                    </span>
                    <h5 className="mt-1.5 text-base font-bold text-slate-900">
                      {center.name}
                    </h5>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                    {center.centerId}
                  </span>
                </div>

                {/* Location & Contact Details */}
                <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      {center.address}, {center.district}, {center.state} – <strong>{center.pincode}</strong>
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
                        className="text-indigo-600 hover:underline font-mono"
                      >
                        {center.contactNumber}
                      </a>
                    </span>
                  </p>
                </div>

                {/* Services Handled Badges */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Authorized Services Handled at this Desk:
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {center.servicesOffered.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Directions & Call */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <a
                  href={`tel:${center.contactNumber}`}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
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
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
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
          <div className="mt-8 text-center py-12 rounded-xl border border-dashed border-slate-200">
            <Building className="size-10 text-slate-300 mx-auto" />
            <h5 className="mt-2 text-sm font-semibold text-slate-700">No Service Centers Found</h5>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              No centers match your state & district filter. Select &ldquo;All States&rdquo; or change your search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
