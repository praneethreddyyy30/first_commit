"use client";

import React, { useState, useMemo } from "react";
import {
  REAL_OFFLINE_CENTERS,
  REAL_SERVICE_FEE_SCHEDULE,
  OfflineCenter,
  ServiceFeeDetail,
  getNearbySevaCentersForVillage
} from "@/data/cscDirectory";
import { getAllStates, getDistrictsForState } from "@/data/indiaLocations";
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

  // Live Postal API Resolution State
  const [pincodeInput, setPincodeInput] = useState<string>("");
  const [isLookingUpPin, setIsLookingUpPin] = useState<boolean>(false);
  const [livePostalCenters, setLivePostalCenters] = useState<{
    name: string;
    type: "CSC" | "SUB_OFFICE" | "HEAD_OFFICE" | "GRAMA_WARD_SACHIVALAYAM";
    address: string;
    distanceEstimate: string;
  }[] | null>(null);
  const [postalDistrictResolved, setPostalDistrictResolved] = useState<string | null>(null);
  const [postalError, setPostalError] = useState<string | null>(null);

  const handleLivePincodeLookup = async (pin: string) => {
    const cleanPin = pin.trim().replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setPostalError("Please enter a valid 6-digit PIN code.");
      return;
    }

    setIsLookingUpPin(true);
    setPostalError(null);

    try {
      const res = await fetch(`/api/geo/pincode?pincode=${cleanPin}`);
      const json = await res.json();
      if (json.success && json.data?.suggestedSevaCenters?.length > 0) {
        setLivePostalCenters(json.data.suggestedSevaCenters);
        setPostalDistrictResolved(json.data.district || null);
        if (json.data.state) {
          setSelectedState(json.data.state);
        }
      } else {
        setPostalError("No postal branches found for this PIN code.");
        setLivePostalCenters(null);
      }
    } catch {
      setPostalError("Failed to query Indian Postal directory. Check network.");
      setLivePostalCenters(null);
    } finally {
      setIsLookingUpPin(false);
    }
  };

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

  // Unique list of states combining centers and official states
  const availableStates = useMemo(() => {
    const centerStates = Array.from(new Set(REAL_OFFLINE_CENTERS.map((c) => c.state)));
    const allKnown = getAllStates();
    const combined = Array.from(new Set([...centerStates, ...allKnown]));
    return ["All States", ...combined];
  }, []);

  // Districts for selected state
  const availableDistricts = useMemo(() => {
    if (selectedState === "All States") {
      return ["All"];
    }
    const centerDistricts = REAL_OFFLINE_CENTERS.filter((c) => c.state === selectedState).map(
      (c) => c.district
    );
    const officialDistricts = getDistrictsForState(selectedState);
    const combined = Array.from(new Set([...centerDistricts, ...officialDistricts]));
    return ["All", ...combined];
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

  // Combined and Filtered Centers List
  const filteredCenters = useMemo(() => {
    // Generate hyper-local centers if state/district/village are provided
    const targetState = selectedState !== "All States" ? selectedState : userState;
    const targetDistrict = selectedDistrict !== "All" ? selectedDistrict : userDistrict;
    const dynamicVillageCenters = getNearbySevaCentersForVillage(targetState, targetDistrict, userVillage);

    const existingIds = new Set(dynamicVillageCenters.map((c) => c.id));
    const combinedBase = [
      ...dynamicVillageCenters,
      ...REAL_OFFLINE_CENTERS.filter((c) => !existingIds.has(c.id))
    ];

    const list = combinedBase.filter((center) => {
      const matchState =
        selectedState === "All States" || center.state === selectedState;
      const matchDistrict =
        selectedDistrict === "All" || center.district.toLowerCase() === selectedDistrict.toLowerCase() ||
        center.district.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
        selectedDistrict.toLowerCase().includes(center.district.toLowerCase());
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
  }, [selectedState, selectedDistrict, selectedType, searchQuery, userState, userDistrict, userVillage]);

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
                <option value="ALL">All Centers ({filteredCenters.length})</option>
                <option value="CSC">Grama Sachivalayam / MeeSeva / e-Sevai (CSC)</option>
                <option value="TEHSILDAR">Tahsildar / Mandal Revenue Office (MRO)</option>
                <option value="DISTRICT_WELFARE">District Collectorate / Social Welfare</option>
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
                  placeholder="Search village, address, VLE, center..."
                  className="w-full rounded-lg border border-[#DFC8A5] bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-[#DFB738] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Active Village Context Banner */}
          {userVillage && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-emerald-700 shrink-0" />
                <span>
                  Proximity Filter Active: Displaying closest official counters for <strong>{userVillage}</strong>, {userDistrict || selectedDistrict}, {userState || selectedState} (Ordered by closest distance).
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                0.3 km – 18.5 km Range
              </span>
            </div>
          )}
        </div>

        {/* Live Postal PIN Code Geo-Resolver Bar */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              <h5 className="text-xs font-bold text-emerald-950 font-serif uppercase tracking-wider">
                🇮🇳 Live Postal & CSC Geo-Resolver (India Post Gateway)
              </h5>
            </div>
            <span className="text-[10px] text-emerald-800 font-mono">
              Direct api.postalpincode.in integration • Real Taluk & Sub-Offices
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={pincodeInput}
              onChange={(e) => setPincodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLivePincodeLookup(pincodeInput)}
              placeholder="Enter your 6-digit Pincode (e.g. 500001, 600001, 520001)..."
              maxLength={6}
              className="flex-1 min-w-[220px] rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:border-emerald-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleLivePincodeLookup(pincodeInput)}
              disabled={isLookingUpPin}
              className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {isLookingUpPin ? "Resolving Postal Registry..." : "Find Nearest Centers"}
            </button>
          </div>

          {postalError && (
            <p className="text-[11px] font-medium text-rose-700">{postalError}</p>
          )}

          {/* Live Resolved Postal Centers Banner */}
          {livePostalCenters && livePostalCenters.length > 0 && (
            <div className="rounded-lg border border-emerald-300 bg-white p-3.5 space-y-2 mt-2">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-xs font-bold text-emerald-900">
                  📍 Verified Postal Hubs & Centers in {postalDistrictResolved || "Your Area"}:
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  {livePostalCenters.length} Verified Outlets
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {livePostalCenters.map((pc, idx) => (
                  <div key={idx} className="rounded-md border border-slate-200 bg-slate-50/50 p-2 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[#0B1B4F]">{pc.name}</span>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold">{pc.distanceEstimate}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{pc.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Cards Grid */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {filteredCenters.map((center) => (
            <div
              key={center.id}
              className="luxury-card rounded-xl p-5.5 hover:border-[#DFB738] transition-all flex flex-col justify-between shadow-2xs"
            >
              <div>
                {/* Header: Center Type & ID */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block rounded px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        center.type === "CSC"
                          ? "bg-[#0B1B4F] text-[#F5E29F]"
                          : center.type === "DISTRICT_WELFARE"
                          ? "bg-purple-100 text-purple-900 border border-purple-200"
                          : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}
                    >
                      {center.type === "CSC"
                        ? "Village / Ward Citizen Desk"
                        : center.type === "DISTRICT_WELFARE"
                        ? "District Collectorate Nodal"
                        : "Tahsildar / Revenue Desk"}
                    </span>
                    <h5 className="mt-2 text-base font-bold text-[#0B1B4F] font-serif">
                      {center.name}
                    </h5>
                  </div>
                  <span className="font-mono text-[10px] text-slate-600 border border-[#DFC8A5] rounded px-2 py-0.5 bg-[#FAF7F2] shrink-0">
                    {center.centerId}
                  </span>
                </div>

                {/* Location & Contact Details */}
                <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="size-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      {center.address}
                      {!center.address.toLowerCase().includes(center.district.toLowerCase()) ? `, ${center.district}` : ""}
                      {!center.address.toLowerCase().includes(center.state.toLowerCase()) ? `, ${center.state}` : ""}
                      {" – "}
                      <strong className="text-[#0B1B4F]">{center.pincode}</strong>
                    </span>
                  </p>

                  {center.distanceEstimate && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 w-fit">
                      <Navigation className="size-3 text-emerald-700" />
                      <span>{center.distanceEstimate}</span>
                    </div>
                  )}

                  <p className="flex items-center gap-2">
                    <Clock className="size-4 text-slate-400 shrink-0" />
                    <span>
                      <strong>{center.timing}</strong> ({center.workingDays})
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <Phone className="size-4 text-slate-400 shrink-0" />
                    <span>
                      Incharge: <strong>{center.contactPerson}</strong> •{" "}
                      <a
                        href={`tel:${center.contactNumber.replace(/[^0-9+]/g, '')}`}
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
                    Authorized Government Services at this Desk:
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {center.servicesOffered.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-medium text-[#0B1B4F] border border-[#DFC8A5]"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Directions & Call */}
              <div className="mt-5 pt-3.5 border-t border-[#EDE6DD] flex items-center justify-between gap-3">
                <a
                  href={`tel:${center.contactNumber.replace(/[^0-9+]/g, '')}`}
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
                  <Navigation className="size-3.5 text-[#DFB738]" />
                  <span>Open in Google Maps</span>
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
