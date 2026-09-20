"use client";

import React, { useState } from "react";
import { Cpu, Award, ChevronDown, PlusCircle, Check } from "lucide-react";
import { DEMO_PERSONAS, DemoPersona } from "@/data/demoPersonas";

interface HeaderProps {
  activeProfileName?: string;
  onSelectPersona: (persona: DemoPersona) => void;
  onResetToBlank?: () => void;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfileName,
  onSelectPersona,
  onResetToBlank,
  onOpenArchitecture,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#EAE2D5] bg-[#FDFBF7] shadow-xs">
      {/* 1. National Tricolor Strip */}
      <div className="gov-tricolor-bar" />

      {/* 2. Top Sovereign Micro-Bar */}
      <div className="bg-[#FAF4EB] border-b border-[#EADFCF] py-1.5 px-4 sm:px-8 text-[11px] text-[#6B5740] flex flex-wrap items-center justify-between gap-2 font-medium">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#3B2D1D] flex items-center gap-1.5 font-serif tracking-wide">
            <span>🏛️</span>
            <span>भारत सरकार • GOVERNMENT OF INDIA</span>
          </span>
          <span className="text-[#D8C7B0] hidden sm:inline">|</span>
          <span className="text-[#7A6650] hidden sm:inline font-sans text-[11px]">
            National Statutory Scholarship & Entitlement Access Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100/70 border border-amber-300/80 text-[10px] font-bold text-amber-900 uppercase tracking-wider">
            <Award className="size-3 text-amber-700" />
            <span>AWS × WeMakeDevs "First Commit"</span>
          </div>
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 font-sans text-slate-700 hover:text-amber-900 bg-white hover:bg-amber-50 px-2.5 py-0.5 rounded-full border border-[#DACBB8] text-[11px] font-bold shadow-2xs cursor-pointer transition-colors"
          >
            <Cpu className="size-3 text-amber-700" />
            <span>Inspect AWS Stack</span>
          </button>
        </div>
      </div>

      {/* 3. Main Luxury Editorial Branding Bar */}
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        {/* Brand with Editorial Serif Typography */}
        <div className="flex items-center gap-3.5">
          {/* Circular Gold Seal Motif */}
          <div className="size-11 sm:size-12 rounded-full gold-seal-badge flex items-center justify-center p-2 text-center shrink-0">
            <div className="text-[10px] font-black text-[#644616] uppercase font-display leading-tight">
              JS<br />
              <span className="text-[7px] tracking-tighter">AI</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#0B1B4F] tracking-tight flex items-center gap-2 font-serif">
                JanSetu <span className="font-cormorant italic font-normal text-amber-800 text-2xl sm:text-3xl">AI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-sans tracking-widest uppercase">
                  जनसेतु
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Civic Access Flight Deck & Pre-Flight Audit System • Bharat Builds Tour
            </p>
          </div>
        </div>

        {/* Right Section: Badges & Persona Switcher */}
        <div className="flex items-center gap-3">
          {/* Client Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-[#DACBB8] bg-white hover:bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#0B1B4F] transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex size-6 items-center justify-center rounded-lg bg-[#0B1B4F] text-[11px] font-black text-[#F5E29F]">
                {activeProfileName ? activeProfileName.charAt(0) : "U"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[11px] font-bold text-[#0B1B4F] leading-tight">
                  {activeProfileName || "Select Client Profile"}
                </p>
                <p className="text-[9px] text-slate-500 leading-tight font-sans">Active Citizen Master</p>
              </div>
              <ChevronDown className="size-3.5 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#DFC8A5] bg-[#FAF7F2] p-2.5 shadow-luxury-lg z-50 space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-bold text-[#854D0E] uppercase tracking-wider font-display">
                  Select Citizen Profile (9 Real-World Cases):
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {DEMO_PERSONAS.map((p) => {
                    const isSelected = activeProfileName === p.profile.name;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPersona(p);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0B1B4F] text-white font-bold shadow-2xs"
                            : "bg-white text-slate-700 hover:bg-[#F4ECE1] border border-[#EDE6DD]"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className={`font-bold truncate ${isSelected ? "text-white" : "text-[#0B1B4F]"}`}>
                            {p.name}
                          </p>
                          <p className={`text-[10px] ${isSelected ? "text-[#F5E29F]" : "text-slate-500"}`}>
                            <span className="font-semibold">
                              {p.state}
                            </span>
                            {" "}• {p.categoryTag}
                          </p>
                        </div>
                        {isSelected && <Check className="size-4 text-[#F5E29F] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {onResetToBlank && (
                  <div className="border-t border-[#EAE2D5] pt-1.5">
                    <button
                      onClick={() => {
                        onResetToBlank();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-[#854D0E] hover:bg-amber-100/60 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="size-4 text-amber-700" />
                      <span>+ Register New / Blank Citizen</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
