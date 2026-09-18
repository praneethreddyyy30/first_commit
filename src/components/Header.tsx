"use client";

import React, { useState } from "react";
import { Sparkles, Cpu, Award, User, ChevronDown, PlusCircle, ShieldCheck, Check } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Tricolor Subtle Top Bar */}
      <div className="h-1 w-full bg-linear-to-r from-amber-500 via-white to-emerald-600" />

      {/* Top Hackathon & Cloud Stack Bar */}
      <div className="bg-slate-900 px-4 py-1.5 text-xs text-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 font-medium text-[11px]">
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 font-bold uppercase tracking-wider border border-amber-500/30">
              <Award className="size-3 text-amber-400" /> AWS × WeMakeDevs
            </span>
            <span className="text-slate-400 hidden sm:inline">Bharat Builds Tour • "First Commit" Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={onOpenArchitecture}
              className="flex items-center gap-1.5 font-mono text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer text-[11px]"
            >
              <Cpu className="size-3.5" />
              <span>Inspect AWS Stack (Bedrock + Cedar + SAM)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-700 to-slate-900 text-white font-black text-lg shadow-sm ring-2 ring-indigo-600/20">
            JS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                JanSetu <span className="text-indigo-600">AI</span>
              </h1>
              <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 uppercase tracking-wide">
                National Citizen Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Unified Civic Eligibility, Document Pre-Flight Audit & Last-Mile Navigator
            </p>
          </div>
        </div>

        {/* Right Actions: Clean Sample Tester & Status */}
        <div className="flex items-center gap-3">
          {/* Subtle Sample Profile Tester (Discreetly tucked away) */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-linear-to-r from-indigo-50/70 to-purple-50/50 px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="size-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Try Sample:</span>
              <span className="font-bold text-slate-800 truncate max-w-[130px]">
                {activeProfileName || "Select Profile"}
              </span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Testing Profiles (Real Cases):
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {DEMO_PERSONAS.map((p) => {
                    const isSelected = activeProfileName === p.profile.name;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPersona(p);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className={`font-bold truncate ${isSelected ? "text-white" : "text-slate-900"}`}>{p.name}</p>
                          <p className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-slate-500"}`}>
                            {p.state} • {p.categoryTag}
                          </p>
                        </div>
                        {isSelected && <Check className="size-3.5 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {onResetToBlank && (
                  <div className="border-t border-slate-100 pt-1.5 mt-1">
                    <button
                      onClick={() => {
                        onResetToBlank();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-left text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="size-3.5" />
                      <span>Start with Blank Profile</span>
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
