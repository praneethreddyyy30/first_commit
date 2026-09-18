"use client";

import React from "react";
import { X, CheckCircle2, ShieldCheck, Terminal, Bot, Server, Database, Cloud } from "lucide-react";

interface AwsArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AwsArchitectureModal: React.FC<AwsArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1B4F]/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#DFC8A5] bg-[#FAF7F2] p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-[#EDE6DD] hover:text-[#0B1B4F] transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        {/* Title & Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#152864] px-3.5 py-1 font-mono text-xs font-semibold text-[#F5E29F] border border-[#DFB738]/40 shadow-xs">
            WeMakeDevs × AWS First Commit Architecture
          </span>
          <span className="rounded-full bg-emerald-100 px-3.5 py-1 font-mono text-xs font-semibold text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-xs">
            <CheckCircle2 className="size-3" /> Ship It & Build It Dual Compliant
          </span>
        </div>

        <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-[#0B1B4F] font-serif">
          JanSetu AI: Technical Architecture & AWS Tech Stack
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          How JanSetu AI integrates AWS open-source tools with AWS Cloud services to eliminate hallucination in civic policy decisions.
        </p>

        {/* Architecture Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* AWS Cedar */}
          <div className="luxury-card rounded-xl border border-[#DFB738]/60 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-[#0B1B4F] font-bold text-sm font-serif">
              <ShieldCheck className="size-5 text-[#DFB738]" />
              AWS Cedar Policy Engine
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Deterministic rule evaluation. Prevents LLM hallucination on legal income ceilings, caste categories, and educational stages using declarative <code className="text-[#0B1B4F] font-bold font-mono">permit(...)</code> policies.
            </p>
            <div className="mt-3 rounded-lg bg-[#0B1B4F] p-2.5 font-mono text-[10px] text-[#F5E29F] border border-[#DFB738]/30">
              cedar/policies/scholarships.cedar
            </div>
          </div>

          {/* Amazon Bedrock */}
          <div className="luxury-card rounded-xl border border-[#EDE6DD] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-[#0B1B4F] font-bold text-sm font-serif">
              <Bot className="size-5 text-purple-600" />
              Amazon Bedrock (Claude 3.5)
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Powers the vernacular voice/text assistant. Synthesizes dense government gazettes into empathetic, plain-language explanations in English and Hindi.
            </p>
            <div className="mt-3 rounded-lg bg-[#0B1B4F] p-2.5 font-mono text-[10px] text-purple-200 border border-[#DFB738]/20">
              BedrockRuntimeClient.invokeModel()
            </div>
          </div>

          {/* SAM & LocalStack */}
          <div className="luxury-card rounded-xl border border-[#EDE6DD] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-[#0B1B4F] font-bold text-sm font-serif">
              <Terminal className="size-5 text-amber-600" />
              AWS SAM CLI & LocalStack
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Complete serverless declaration in <code className="font-mono text-amber-800 font-semibold">template.yaml</code>. Enables 100% free local execution of API Gateway, Lambda, and DynamoDB without cloud bills.
            </p>
            <div className="mt-3 rounded-lg bg-[#0B1B4F] p-2.5 font-mono text-[10px] text-amber-200 border border-[#DFB738]/20">
              sam local start-api (Build It Track)
            </div>
          </div>

          {/* DynamoDB */}
          <div className="luxury-card rounded-xl border border-[#EDE6DD] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-[#0B1B4F] font-bold text-sm font-serif">
              <Database className="size-5 text-blue-600" />
              Amazon DynamoDB
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Serverless single-table storage for scheme metadata, CSC directory, and user application dossiers. Scales to zero with zero idle cost.
            </p>
            <div className="mt-3 rounded-lg bg-[#0B1B4F] p-2.5 font-mono text-[10px] text-slate-200 border border-[#EDE6DD]">
              JanSetuSchemes & JanSetuDossiers
            </div>
          </div>

          {/* S3 Storage */}
          <div className="luxury-card rounded-xl border border-[#EDE6DD] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-[#0B1B4F] font-bold text-sm font-serif">
              <Server className="size-5 text-emerald-600" />
              Amazon S3 Storage
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Stores official government gazette PDFs, official bank mandate forms (NPCI Annexure I), and ephemeral pre-flight document scans with Aadhaar masking.
            </p>
            <div className="mt-3 rounded-lg bg-[#0B1B4F] p-2.5 font-mono text-[10px] text-slate-200 border border-[#EDE6DD]">
              jansetu-templates-bucket
            </div>
          </div>

          {/* AWS Amplify */}
          <div className="luxury-card rounded-xl border border-[#EDE6DD] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-[#0B1B4F] font-bold text-sm font-serif">
              <Cloud className="size-5 text-indigo-600" />
              AWS Amplify Hosting
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Next.js App Router deployed live via <code className="font-mono text-[#0B1B4F] font-semibold">amplify.yml</code>. Global CDN, SSL certificates, and zero-downtime updates.
            </p>
            <div className="mt-3 rounded-lg bg-[#0B1B4F] p-2.5 font-mono text-[10px] text-slate-200 border border-[#EDE6DD]">
              Amplify Hosting (Ship It Track)
            </div>
          </div>
        </div>

        {/* Verification of Open Source & Cloud Synergy */}
        <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 shadow-xs">
          <h4 className="font-bold text-emerald-950 text-sm font-serif flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            Why this architecture wins: Decoupling Policy from AI
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-emerald-900">
            A major mistake in civic tech is letting an LLM decide who gets a scholarship. If an LLM hallucinates an income cutoff, a poor student is denied education. In JanSetu AI, <strong>AWS Cedar policies make 100% deterministic, audit-trail verified legal decisions</strong>, while <strong>Amazon Bedrock provides human empathy, translation, and conversational guidance</strong>.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#0B1B4F] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#F5E29F] hover:bg-[#152864] transition-colors cursor-pointer border border-[#DFB738]/40 shadow-sm"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
