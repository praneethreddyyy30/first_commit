"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Key,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Languages
} from "lucide-react";
import type { ChatMessage } from "@/lib/bedrock/bedrockClient";
import { UserProfile, CedarEvaluationResult } from "@/lib/cedar/evaluator";
import { DocumentAuditResult, DocumentAuditInput } from "@/lib/audit/documentAuditor";

interface AiCopilotTabProps {
  profile?: UserProfile;
  evaluationResults?: CedarEvaluationResult[];
  targetSchemeId?: string;
  auditResult?: DocumentAuditResult;
  auditInput?: DocumentAuditInput;
}

/**
 * Parses markdown bold (**word**), links [text](url), code (`code`), and italics (*text*)
 * Strips out the asterisks (*) and renders proper bold <strong> tags with luxury styling.
 */
function renderInlineMarkdown(line: string, isUser: boolean) {
  const tokenRegex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`|\*[^*]+?\*)/g;
  let lastIndex = 0;
  const elements: React.ReactNode[] = [];
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      elements.push(line.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `token-${match.index}-${lastIndex}`;

    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      // Bold: Strip asterisks and render bold text
      const innerText = token.slice(2, -2);
      elements.push(
        <strong
          key={key}
          className={
            isUser
              ? "font-extrabold text-[#F5E29F]"
              : "font-extrabold text-[#0B1B4F] tracking-tight"
          }
        >
          {innerText}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      // Code snippet
      const innerText = token.slice(1, -1);
      elements.push(
        <code
          key={key}
          className={
            isUser
              ? "rounded bg-white/20 px-1 py-0.5 font-mono text-[11px] text-amber-200"
              : "rounded bg-[#EDE6DD] px-1.5 py-0.5 font-mono text-[11px] text-[#0B1B4F] font-semibold"
          }
        >
          {innerText}
        </code>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      // Clickable link
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        elements.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isUser
                ? "underline font-bold text-[#F5E29F] hover:text-white"
                : "underline font-bold text-[#854D0E] hover:text-[#0B1B4F]"
            }
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        elements.push(token);
      }
    } else if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      // Italic: Strip asterisks and render italic
      const innerText = token.slice(1, -1);
      elements.push(
        <em key={key} className="italic opacity-90">
          {innerText}
        </em>
      );
    } else {
      elements.push(token);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    elements.push(line.slice(lastIndex));
  }

  return elements.length > 0 ? elements : line;
}

function FormattedMessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        const isIndented = line.startsWith("  ↳") || line.startsWith("  •") || line.startsWith("    ");
        const trimmed = line.trim();
        const isNumberedHeader = /^\*\*\d+\./.test(trimmed) || /^\d+\./.test(trimmed);

        return (
          <div
            key={lineIdx}
            className={`${isIndented ? "pl-4 text-slate-700" : ""} ${
              isNumberedHeader ? "mt-1 font-medium" : ""
            }`}
          >
            {renderInlineMarkdown(line, isUser)}
          </div>
        );
      })}
    </div>
  );
}

export const AiCopilotTab: React.FC<AiCopilotTabProps> = ({
  profile,
  evaluationResults,
  targetSchemeId,
  auditResult,
  auditInput,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hello ${profile?.name || "Citizen"}! 👋 I am your JanSetu AI Civic Copilot.

I can see your profile is loaded as a **${profile?.category || "ST"}** student from **${profile?.state || "Tamil Nadu"}** (Annual Family Income: ₹${profile?.annualFamilyIncome?.toLocaleString("en-IN") || "1,80,000"}).

Ask me anything! Here are popular queries:
• "What are the eligible schemes I am eligible for?"
• "What are the non-eligible schemes for me?"
• "Check my document audit & NPCI status"
• "What are the requirements for this scheme?"
• "What are the documents required for this particular scheme?"
• "How can I do it?"`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [modelSource, setModelSource] = useState<string>("JanSetu-Civic-RAG (Zero-Fail / No Key Needed)");

  // Dynamic profile synchronization: detect when citizen switches persona or updates details
  const prevProfileRef = useRef<string>(
    `${profile?.name}-${profile?.category}-${profile?.annualFamilyIncome}-${profile?.state}`
  );

  useEffect(() => {
    const currentKey = `${profile?.name}-${profile?.category}-${profile?.annualFamilyIncome}-${profile?.state}`;
    if (prevProfileRef.current !== currentKey) {
      prevProfileRef.current = currentKey;
      const eligibleCount = evaluationResults?.filter((r) => r.decision === "ALLOW").length || 0;
      setMessages([
        {
          role: "assistant",
          content: `Hello **${profile?.name || "Citizen"}**! 👋 I am your **JanSetu AI Civic Copilot**.

I have dynamically synced your active profile:
• **State:** ${profile?.state || "National"}
• **Social Category:** **${profile?.category || "General"}** ${profile?.tnCommunity ? `(${profile.tnCommunity})` : profile?.apCommunity ? `(${profile.apCommunity})` : ""}
• **Annual Family Income:** **₹${profile?.annualFamilyIncome?.toLocaleString("en-IN") || "0"}**
• **Cedar Policy Eligibility:** **${eligibleCount} schemes currently available** for you.
${auditResult ? `• **Document Pre-Flight:** ${auditResult.nameMatchPercentage}% Aadhaar/Marksheet match • NPCI Bank Status: ${auditResult.npciStatus}` : ""}

Ask me anything about your eligible schemes, non-eligible schemes, documents, or roadmap!`,
        },
      ]);
    }
  }, [profile, evaluationResults, auditResult]);

  // Optional AWS Bedrock custom credentials state
  const [showAwsSettings, setShowAwsSettings] = useState<boolean>(false);
  const [customAccessKey, setCustomAccessKey] = useState<string>("");
  const [customSecretKey, setCustomSecretKey] = useState<string>("");
  const [customRegion, setCustomRegion] = useState<string>("us-east-1");
  const [credentialsConfigured, setCredentialsConfigured] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Restore saved AWS credentials if previously entered
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedKey = localStorage.getItem("jansetu_aws_access_key");
        const savedSecret = localStorage.getItem("jansetu_aws_secret_key");
        const savedReg = localStorage.getItem("jansetu_aws_region");
        if (savedKey && savedSecret) {
          setCustomAccessKey(savedKey);
          setCustomSecretKey(savedSecret);
          if (savedReg) setCustomRegion(savedReg);
          setCredentialsConfigured(true);
        }
      } catch (e) {
        // localStorage unavailable
      }
    }
  }, []);

  const handleSaveCredentials = () => {
    if (customAccessKey.trim() && customSecretKey.trim()) {
      localStorage.setItem("jansetu_aws_access_key", customAccessKey.trim());
      localStorage.setItem("jansetu_aws_secret_key", customSecretKey.trim());
      localStorage.setItem("jansetu_aws_region", customRegion.trim() || "us-east-1");
      setCredentialsConfigured(true);
      setShowAwsSettings(false);
      setModelSource("AWS Bedrock (Live Credentials)");
    }
  };

  const handleClearCredentials = () => {
    localStorage.removeItem("jansetu_aws_access_key");
    localStorage.removeItem("jansetu_aws_secret_key");
    localStorage.removeItem("jansetu_aws_region");
    setCustomAccessKey("");
    setCustomSecretKey("");
    setCredentialsConfigured(false);
    setModelSource("JanSetu-Civic-RAG (Zero-Fail / No Key Needed)");
  };

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputQuery(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your current browser. Please type your query.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  };

  const handleSpeak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text to speech is not supported in your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown stars from speech text
    const cleanText = text.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputQuery("");
    setIsLoading(true);

    try {
      // Secure server-side call via /api/chat
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          history: messages,
          language,
          profile,
          evaluationResults,
          targetSchemeId,
          auditResult,
          auditInput,
          customCredentials: credentialsConfigured && customAccessKey.trim() && customSecretKey.trim() ? {
            accessKeyId: customAccessKey.trim(),
            secretAccessKey: customSecretKey.trim(),
            region: customRegion.trim() || "us-east-1"
          } : undefined
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const answerContent = data.answer || "I received your query but could not format a response. Please try again.";

      setModelSource(
        data.source === "AWS_BEDROCK_LIVE"
          ? (data.modelUsed || "AWS Bedrock Claude 3.5")
          : "JanSetu-Civic-RAG (Profile-Aware / 100% Free)"
      );

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: answerContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered a temporary connection issue. Please check your connection and try asking again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const quickPrompts = [
    "What are the eligible schemes I am eligible for?",
    "What are the non-eligible schemes for me?",
    "Check my document audit & NPCI status",
    "What are the requirements for this scheme?",
    "What are the documents required for this particular scheme?",
    "How can I do it?",
    "Why is NPCI Aadhaar seeding different from normal linking?"
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#DFB738]/30 bg-gradient-to-r from-[#0B1B4F] via-[#0C1B4A] to-[#040B22] p-6 text-white shadow-luxury">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5E29F] font-display">
            <Sparkles className="size-4 text-[#DFB738]" />
            JanSetu Conversational Civic Copilot
          </div>
          <h3 className="mt-1 text-xl sm:text-2xl font-black tracking-tight font-serif text-white">
            Vernacular Voice & Text Assistant
          </h3>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Citing official Ministry of Tribal Affairs & Social Justice gazettes. Zero hallucinations, fully deterministic legal boundaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center rounded-xl bg-white/10 p-1 border border-white/10 text-xs">
            <button
              onClick={() => setLanguage("en")}
              className={`rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                language === "en" ? "bg-[#F5E29F] text-[#0B1B4F]" : "text-white hover:text-[#F5E29F]"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("hi")}
              className={`rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                language === "hi" ? "bg-[#F5E29F] text-[#0B1B4F]" : "text-white hover:text-[#F5E29F]"
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Optional AWS Key Toggle Button */}
          <button
            onClick={() => setShowAwsSettings(!showAwsSettings)}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-[#F5E29F] hover:bg-white/20 transition-all border border-white/15 cursor-pointer"
          >
            <Key className="size-3.5 text-[#DFB738]" />
            <span>{credentialsConfigured ? "AWS Key: Active" : "AWS Key (Optional)"}</span>
            {showAwsSettings ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Optional AWS Bedrock Settings Drawer */}
      {showAwsSettings && (
        <div className="luxury-card rounded-2xl p-5 border border-[#DFC8A5] bg-[#FAF7F2] shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <h4 className="font-serif font-bold text-sm text-[#0B1B4F]">
                  AWS Bedrock Integration (100% Optional)
                </h4>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                <strong>No API Key is required</strong> to use JanSetu AI! By default, the assistant runs on our built-in <strong>Zero-Fail Civic RAG Engine</strong> with official government rules. If you wish to connect live to your AWS Bedrock Claude 3.5 Sonnet foundation model, you can optionally paste your credentials below:
              </p>
            </div>
            {credentialsConfigured && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                Connected
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                AWS Access Key ID
              </label>
              <input
                type="text"
                value={customAccessKey}
                onChange={(e) => setCustomAccessKey(e.target.value)}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full rounded-xl border border-[#DFC8A5] bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-[#DFB738] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                AWS Secret Access Key
              </label>
              <input
                type="password"
                value={customSecretKey}
                onChange={(e) => setCustomSecretKey(e.target.value)}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="w-full rounded-xl border border-[#DFC8A5] bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-[#DFB738] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                AWS Region
              </label>
              <input
                type="text"
                value={customRegion}
                onChange={(e) => setCustomRegion(e.target.value)}
                placeholder="us-east-1"
                className="w-full rounded-xl border border-[#DFC8A5] bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-[#DFB738] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#EDE6DD]">
            <div className="text-[11px] text-slate-500">
              * Credentials remain strictly on your local browser session and are sent directly to AWS Bedrock via secure server routes.
            </div>
            <div className="flex items-center gap-2">
              {credentialsConfigured && (
                <button
                  type="button"
                  onClick={handleClearCredentials}
                  className="rounded-lg px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                >
                  Clear & Revert to Built-in Engine
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveCredentials}
                disabled={!customAccessKey.trim() || !customSecretKey.trim()}
                className="rounded-xl bg-[#0B1B4F] px-4 py-1.5 text-xs font-bold text-[#F5E29F] hover:bg-[#152864] disabled:opacity-50 transition-all cursor-pointer border border-[#DFB738]/40 shadow-xs"
              >
                Save & Use Bedrock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Engine Status Banner */}
      <div className="flex items-center justify-between rounded-xl border border-[#EDE6DD] bg-white px-4 py-2 text-xs shadow-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>Active Intelligence Engine:</span>
          <span className="font-bold text-[#0B1B4F]">{modelSource}</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Ready • Zero Hallucination Guard Active</span>
        </div>
      </div>

      {/* Dynamic Profile & Document Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EDE6DD] bg-white px-5 py-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-slate-700">
          <span className="font-bold text-[#0B1B4F] flex items-center gap-1.5 font-serif text-sm">
            <User className="size-4 text-[#854D0E]" />
            {profile?.name || "Citizen"}
          </span>
          <span className="rounded-md bg-amber-50 px-2.5 py-0.5 font-bold text-amber-900 border border-amber-200">
            {profile?.category || "General"}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
            {profile?.state || "National"}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
            ₹{profile?.annualFamilyIncome?.toLocaleString("en-IN")}/yr
          </span>
          <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            {evaluationResults?.filter((r) => r.decision === "ALLOW").length || 0} Eligible Schemes
          </span>
        </div>
        {auditResult && (
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span
              className={`rounded px-2.5 py-0.5 ${
                auditResult.nameMatchPercentage >= 95
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-900 border border-amber-200"
              }`}
            >
              Docs: {auditResult.nameMatchPercentage}% Match
            </span>
            <span
              className={`rounded px-2.5 py-0.5 ${
                auditResult.npciStatus === "SEEDED"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              NPCI: {auditResult.npciStatus === "SEEDED" ? "Active" : "Action Required"}
            </span>
          </div>
        )}
      </div>

      {/* Chat Messages Box */}
      <div className="rounded-2xl border border-[#EDE6DD] bg-white p-4 sm:p-6 shadow-luxury min-h-[480px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#0B1B4F] to-[#152864] text-[#F5E29F] shadow-xs">
                  <Bot className="size-4" />
                </div>
              )}

              <div
                className={`rounded-2xl p-4 max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#0B1B4F] text-white shadow-xs"
                    : "bg-[#FAF7F2] text-slate-800 border border-[#EDE6DD]"
                }`}
              >
                <FormattedMessageContent content={m.content} isUser={m.role === "user"} />

                {m.role === "assistant" && (
                  <div className="mt-3 flex items-center justify-between border-t border-[#EDE6DD] pt-2 text-[11px] text-slate-500">
                    <span className="font-mono text-[10px] text-[#854D0E] font-bold">JanSetu AWS Copilot</span>
                    <button
                      onClick={() => handleSpeak(m.content)}
                      className="flex items-center gap-1 text-[#0B1B4F] hover:text-[#854D0E] font-bold transition-colors cursor-pointer"
                      title="Read aloud"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="size-3.5" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="size-3.5" />
                          <span>Listen (Read Aloud)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0B1B4F] text-[#F5E29F] shadow-xs">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-500">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0B1B4F] text-[#F5E29F] animate-pulse">
                <Bot className="size-4" />
              </div>
              <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-[#EDE6DD] flex items-center gap-2">
                <RefreshCw className="size-3.5 animate-spin text-[#854D0E]" />
                <span className="font-medium text-slate-700">Consulting official gazette database & Cedar policies...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input & Quick Prompts Area */}
        <div className="mt-4 border-t border-[#EDE6DD] pt-4">
          {/* Quick Prompt Pills */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="rounded-full border border-[#EDE6DD] bg-[#FAF7F2] px-3 py-1 text-[11px] text-slate-700 hover:border-[#DFC8A5] hover:bg-[#F4ECE1] hover:text-[#0B1B4F] transition-all text-left cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar with Voice Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`rounded-xl p-2.5 transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/30"
                  : "border border-[#DACBB8] bg-[#FAF7F2] text-[#854D0E] hover:bg-[#F4ECE1]"
              }`}
              title={isListening ? "Listening... click to stop" : "Click to speak your question"}
            >
              {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Listening to your voice..."
                  : "Ask about scholarships, documents, or NPCI bank seeding..."
              }
              className="flex-1 rounded-xl border border-[#EDE6DD] bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-[#DFB738] focus:ring-2 focus:ring-[#DFB738]/20 focus:outline-hidden"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputQuery.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[#0B1B4F] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#F5E29F] shadow-xs hover:bg-[#071233] disabled:opacity-50 transition-all cursor-pointer border border-[#142A6F]"
            >
              <span>Ask</span>
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
