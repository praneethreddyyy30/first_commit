"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Languages,
  ExternalLink,
  Zap,
} from "lucide-react";
import type { ChatMessage } from "@/lib/bedrock/bedrockClient";
import { UserProfile, CedarEvaluationResult } from "@/lib/cedar/evaluator";
import { DocumentAuditResult, DocumentAuditInput } from "@/lib/audit/documentAuditor";
import { SCHEMES_DATABASE } from "@/data/schemes";

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
      const plainText = line.slice(lastIndex, match.index);
      elements.push(
        isUser ? (
          <span key={`text-${lastIndex}`} style={{ color: "#FFFFFF" }}>
            {plainText}
          </span>
        ) : (
          plainText
        )
      );
    }
    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      // Bold: Strip asterisks and render bold text
      const innerText = token.slice(2, -2);
      elements.push(
        <strong
          key={key}
          style={{ color: isUser ? "#F5E29F" : "#0B1B4F" }}
          className="font-extrabold tracking-tight"
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
            style={{ color: isUser ? "#F5E29F" : "#854D0E" }}
            className="underline font-bold hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        elements.push(
          isUser ? <span key={`tok-${key}`} style={{ color: "#FFFFFF" }}>{token}</span> : token
        );
      }
    } else if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      // Italic: Strip asterisks and render italic
      const innerText = token.slice(1, -1);
      elements.push(
        <em key={key} style={{ color: isUser ? "#FFFFFF" : undefined }} className="italic opacity-90">
          {innerText}
        </em>
      );
    } else {
      elements.push(
        isUser ? <span key={`tok-${key}`} style={{ color: "#FFFFFF" }}>{token}</span> : token
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    const trailingText = line.slice(lastIndex);
    elements.push(
      isUser ? (
        <span key="trailing" style={{ color: "#FFFFFF" }}>
          {trailingText}
        </span>
      ) : (
        trailingText
      )
    );
  }

  if (elements.length === 0) {
    return isUser ? <span style={{ color: "#FFFFFF" }}>{line}</span> : line;
  }

  return elements;
}

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "hr" }
  | { type: "paragraph"; text: string };

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Headings: #, ##, ###, ####
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Blockquote: >
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    // Table: lines starting and ending with |
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const splitRow = (row: string) => row.split("|").slice(1, -1).map((c) => c.trim());
        const headers = splitRow(tableLines[0]);
        const isSeparator = (r: string) => /^[:\s-]+$/.test(r.replace(/\|/g, ""));
        const dataLines = tableLines.slice(1).filter((r) => !isSeparator(r));
        const rows = dataLines.map(splitRow);
        blocks.push({ type: "table", headers, rows });
        continue;
      }
    }

    // Bullet List: -, *, •
    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Numbered List: 1. , 2.
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Regular paragraph
    blocks.push({ type: "paragraph", text: line });
    i++;
  }

  return blocks;
}

function FormattedMessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={`space-y-2 text-xs sm:text-sm leading-relaxed ${isUser ? "text-white" : "text-slate-800"}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "hr":
            return <hr key={idx} className={`my-2 border-t ${isUser ? "border-white/20" : "border-[#EDE6DD]"}`} />;

          case "heading": {
            const isTopLevel = block.level <= 2;
            return (
              <div
                key={idx}
                className={
                  isUser
                    ? "font-bold text-xs sm:text-sm text-[#F5E29F] mt-1.5 mb-0.5"
                    : isTopLevel
                    ? "font-serif font-black text-sm sm:text-base text-[#0B1B4F] mt-2 mb-1"
                    : "font-bold text-xs sm:text-sm text-[#0B1B4F] mt-1.5 mb-0.5"
                }
              >
                {renderInlineMarkdown(block.text, isUser)}
              </div>
            );
          }

          case "blockquote":
            return (
              <div
                key={idx}
                className={
                  isUser
                    ? "my-2 rounded-r-lg border-l-4 border-[#DFB738] bg-white/10 py-2 px-3 text-xs italic text-white shadow-xs"
                    : "my-2 rounded-r-lg border-l-4 border-[#DFB738] bg-[#FAF7F2] py-2 px-3 text-xs italic text-slate-700 shadow-xs"
                }
              >
                {renderInlineMarkdown(block.text, isUser)}
              </div>
            );

          case "table":
            return (
              <div
                key={idx}
                className={`my-2 overflow-x-auto rounded-xl border max-w-full shadow-xs ${
                  isUser ? "border-white/20 bg-[#152864]" : "border-[#EDE6DD] bg-white"
                }`}
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className={
                        isUser ? "border-b border-white/20 bg-[#071233]" : "border-b border-[#EDE6DD] bg-[#FAF7F2]"
                      }
                    >
                      {block.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className={`py-2 px-3 font-bold whitespace-nowrap ${
                            isUser ? "text-[#F5E29F]" : "text-[#0B1B4F]"
                          }`}
                        >
                          {renderInlineMarkdown(h, isUser)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={
                          isUser
                            ? "border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors"
                            : "border-b border-[#F5EFE6] last:border-0 hover:bg-[#FAF7F2]/60 transition-colors"
                        }
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-2 px-3 align-top ${isUser ? "text-white" : "text-slate-700"}`}
                          >
                            {renderInlineMarkdown(cell, isUser)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "list":
            if (block.ordered) {
              return (
                <ol
                  key={idx}
                  style={{ color: isUser ? "#FFFFFF" : "#1E293B" }}
                  className={`my-1.5 space-y-1 pl-5 list-decimal ${isUser ? "text-white" : "text-slate-800"}`}
                >
                  {block.items.map((item, itemIdx) => (
                    <li key={itemIdx} style={{ color: isUser ? "#FFFFFF" : "#1E293B" }} className="leading-relaxed">
                      {renderInlineMarkdown(item, isUser)}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <ul
                key={idx}
                style={{ color: isUser ? "#FFFFFF" : "#1E293B" }}
                className={`my-1.5 space-y-1 pl-4 list-disc ${
                  isUser ? "text-white marker:text-[#F5E29F]" : "text-slate-800 marker:text-[#854D0E]"
                }`}
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ color: isUser ? "#FFFFFF" : "#1E293B" }} className="leading-relaxed">
                    {renderInlineMarkdown(item, isUser)}
                  </li>
                ))}
              </ul>
            );

          case "paragraph":
          default:
            return (
              <div
                key={idx}
                style={{ color: isUser ? "#FFFFFF" : "#1E293B" }}
                className={`leading-relaxed ${isUser ? "text-white font-medium" : "text-slate-800"}`}
              >
                {renderInlineMarkdown(block.text, isUser)}
              </div>
            );
        }
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
  // Resolve active scheme if passed
  const activeScheme = useMemo(() => {
    if (!targetSchemeId) return undefined;
    return SCHEMES_DATABASE.find(
      (s) =>
        s.id.toLowerCase() === targetSchemeId.toLowerCase() ||
        s.shortCode.toLowerCase() === targetSchemeId.toLowerCase() ||
        s.id.toLowerCase().replace(/_/g, "-") === targetSchemeId.toLowerCase().replace(/_/g, "-")
    );
  }, [targetSchemeId]);

  const activeSchemeEval = useMemo(() => {
    if (!activeScheme || !evaluationResults) return undefined;
    return evaluationResults.find(
      (r) => r.scheme.id === activeScheme.id || r.scheme.shortCode === activeScheme.shortCode
    );
  }, [activeScheme, evaluationResults]);

  const isCurrentSchemeEligible = activeSchemeEval ? activeSchemeEval.decision === "ALLOW" : false;

  const buildInitialGreeting = (): string => {
    if (activeScheme) {
      return `Hello **${profile?.name || "Citizen"}**! 👋 I am your **JanSetu AI Civic Copilot**.

🎯 **Active Scheme Auto-Detected:** **${activeScheme.title}** (\`${activeScheme.shortCode}\`)
• **Sponsoring Authority:** ${activeScheme.ministry}
• **Financial Benefit:** **${activeScheme.benefitAmount}**
• **Cedar Policy Status:** ${isCurrentSchemeEligible ? "✅ **100% ELIGIBLE** for your active profile" : `⚠️ **Ineligible based on current criteria** (${activeSchemeEval?.failedReasons.join("; ") || "Criteria mismatch"})`}
• **Official Portal:** [${activeScheme.portalName}](${activeScheme.officialPortalUrl})

I have automatically focused all answers and RAG retrieval on **${activeScheme.shortCode}**. You don't need to specify the scheme name! Ask me:
• *"What are the documents required for this scheme?"*
• *"What are the 5 verification stages & timeline?"*
• *"Am I eligible and how to apply?"*
• *"Where is the nearest Seva Center to submit documents?"*`;
    }

    const eligibleCount = evaluationResults?.filter((r) => r.decision === "ALLOW").length || 0;
    return `Hello **${profile?.name || "Citizen"}**! 👋 I am your **JanSetu AI Civic Copilot**.

I can see your active profile is loaded as a **${profile?.category || "ST"}** student from **${profile?.state || "Tamil Nadu"}** (Annual Family Income: ₹${profile?.annualFamilyIncome?.toLocaleString("en-IN") || "1,80,000"}).

Based on deterministic AWS Cedar policies, you are eligible for **${eligibleCount} government schemes**! 🎯

Ask me anything! Here are popular queries:
• "What are the eligible schemes I am eligible for?"
• "What are the non-eligible schemes for me?"
• "Check my document audit & NPCI status"
• "What are the requirements for this scheme?"
• "What are the documents required for this particular scheme?"
• "How can I do it?"`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: buildInitialGreeting(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [modelSource, setModelSource] = useState<string>("JanSetu-Civic-RAG (Zero-Fail / No Key Needed)");

  // Dynamic profile & scheme synchronization: detect when citizen switches persona or scheme
  const prevSyncKeyRef = useRef<string>("");

  useEffect(() => {
    const currentSyncKey = `${targetSchemeId}-${profile?.name}-${profile?.category}-${profile?.annualFamilyIncome}-${profile?.state}-${isCurrentSchemeEligible}`;
    if (prevSyncKeyRef.current !== currentSyncKey) {
      prevSyncKeyRef.current = currentSyncKey;
      setMessages([
        {
          role: "assistant",
          content: buildInitialGreeting(),
        },
      ]);
    }
  }, [targetSchemeId, profile, evaluationResults, auditResult, isCurrentSchemeEligible]);

  // Multi-Provider AI Credentials State (Groq, Gemini, AWS Bedrock)
  const [showAwsSettings, setShowAwsSettings] = useState<boolean>(false);
  const [customGroqKey, setCustomGroqKey] = useState<string>("");
  const [customGeminiKey, setCustomGeminiKey] = useState<string>("");
  const [customAccessKey, setCustomAccessKey] = useState<string>("");
  const [customSecretKey, setCustomSecretKey] = useState<string>("");
  const [customRegion, setCustomRegion] = useState<string>("us-east-1");
  const [credentialsConfigured, setCredentialsConfigured] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);

  // Restore saved credentials if previously entered
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedGroq = localStorage.getItem("jansetu_groq_key");
        const savedGemini = localStorage.getItem("jansetu_gemini_key");
        const savedKey = localStorage.getItem("jansetu_aws_access_key");
        const savedSecret = localStorage.getItem("jansetu_aws_secret_key");
        const savedReg = localStorage.getItem("jansetu_aws_region");

        if (savedGroq) setCustomGroqKey(savedGroq);
        if (savedGemini) setCustomGeminiKey(savedGemini);
        if (savedKey && savedSecret) {
          setCustomAccessKey(savedKey);
          setCustomSecretKey(savedSecret);
          if (savedReg) setCustomRegion(savedReg);
        }

        const hasAnyKey = Boolean(
          (savedGroq && savedGroq.trim().length > 10) ||
          (savedGemini && savedGemini.trim().length > 10) ||
          (savedKey && savedSecret)
        );

        if (hasAnyKey) {
          setCredentialsConfigured(true);
          if (savedGroq && savedGroq.trim().length > 10) {
            setModelSource("⚡ Groq Llama 3.3 70B (Live)");
          } else if (savedGemini && savedGemini.trim().length > 10) {
            setModelSource("🌟 Gemini 2.0 Flash (Live)");
          } else if (savedKey && savedSecret) {
            setModelSource("AWS Bedrock (Live Credentials)");
          }
        }
      } catch (e) {
        // localStorage unavailable
      }
    }
  }, []);

  const handleSaveCredentials = () => {
    let anyConfigured = false;

    if (customGroqKey.trim()) {
      localStorage.setItem("jansetu_groq_key", customGroqKey.trim());
      anyConfigured = true;
    } else {
      localStorage.removeItem("jansetu_groq_key");
    }

    if (customGeminiKey.trim()) {
      localStorage.setItem("jansetu_gemini_key", customGeminiKey.trim());
      anyConfigured = true;
    } else {
      localStorage.removeItem("jansetu_gemini_key");
    }

    if (customAccessKey.trim() && customSecretKey.trim()) {
      localStorage.setItem("jansetu_aws_access_key", customAccessKey.trim());
      localStorage.setItem("jansetu_aws_secret_key", customSecretKey.trim());
      localStorage.setItem("jansetu_aws_region", customRegion.trim() || "us-east-1");
      anyConfigured = true;
    } else {
      localStorage.removeItem("jansetu_aws_access_key");
      localStorage.removeItem("jansetu_aws_secret_key");
      localStorage.removeItem("jansetu_aws_region");
    }

    setCredentialsConfigured(anyConfigured);
    setShowAwsSettings(false);

    if (customGroqKey.trim()) {
      setModelSource("⚡ Groq Llama 3.3 70B (Live)");
    } else if (customGeminiKey.trim()) {
      setModelSource("🌟 Gemini 2.0 Flash (Live)");
    } else if (customAccessKey.trim() && customSecretKey.trim()) {
      setModelSource("AWS Bedrock (Live Credentials)");
    } else {
      setModelSource("JanSetu-Civic-RAG (Zero-Fail / No Key Needed)");
    }
  };

  const handleClearCredentials = () => {
    localStorage.removeItem("jansetu_groq_key");
    localStorage.removeItem("jansetu_gemini_key");
    localStorage.removeItem("jansetu_aws_access_key");
    localStorage.removeItem("jansetu_aws_secret_key");
    localStorage.removeItem("jansetu_aws_region");
    setCustomGroqKey("");
    setCustomGeminiKey("");
    setCustomAccessKey("");
    setCustomSecretKey("");
    setCredentialsConfigured(false);
    setModelSource("JanSetu-Civic-RAG (Zero-Fail / No Key Needed)");
  };

  // Initialize Robust Continuous Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

        recognition.onresult = (event: any) => {
          let accumulated = "";
          for (let i = 0; i < event.results.length; i++) {
            accumulated += event.results[i][0].transcript + " ";
          }
          if (accumulated.trim()) {
            setInputQuery(accumulated.trim());
          }
        };

        recognition.onerror = (err: any) => {
          console.warn("Speech recognition warning:", err?.error);
          if (err?.error !== "no-speech") {
            setIsListening(false);
            isListeningRef.current = false;
          }
        };

        recognition.onend = () => {
          // If user still has recording turned ON, keep listening across natural pauses
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              setIsListening(false);
              isListeningRef.current = false;
            }
          } else {
            setIsListening(false);
          }
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
      isListeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        isListeningRef.current = true;
        recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech recognition start error:", err);
        isListeningRef.current = false;
        setIsListening(false);
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

    // Clean markdown stars, links, and code blocks for clean voice audio
    const cleanText = text
      .replace(/[*#_`]/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .slice(0, 450); // Concise voice summary

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;

    // Fix Chromium TTS 15-second automatic pause bug
    const timer = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(timer);
      } else {
        window.speechSynthesis.resume();
      }
    }, 4000);

    utterance.onend = () => {
      clearInterval(timer);
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      clearInterval(timer);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
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
          customCredentials: {
            accessKeyId: customAccessKey.trim() || undefined,
            secretAccessKey: customSecretKey.trim() || undefined,
            region: customRegion.trim() || undefined,
            groqApiKey: customGroqKey.trim() || undefined,
            geminiApiKey: customGeminiKey.trim() || undefined,
          }
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const answerContent = data.answer || "I received your query but could not format a response. Please try again.";

      if (data.source === "AWS_BEDROCK_LIVE") {
        setModelSource(data.modelUsed || "AWS Bedrock Claude 3.5");
      } else if (data.source === "GROQ_LLAMA_LIVE") {
        setModelSource(data.modelUsed || "⚡ Groq Llama 3.3 70B (Live)");
      } else if (data.source === "GOOGLE_GEMINI_LIVE") {
        setModelSource(data.modelUsed || "🌟 Gemini 2.0 Flash (Live)");
      } else {
        setModelSource("JanSetu-Civic-RAG (Profile-Aware / 100% Free)");
      }

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

  const quickPrompts = activeScheme
    ? [
        "What certificates do I still need for this scheme?",
        `What are the documents required for ${activeScheme.shortCode}?`,
        `Am I eligible for ${activeScheme.shortCode}?`,
        `What are the 5 verification stages & timeline for ${activeScheme.shortCode}?`,
        `How do I apply for ${activeScheme.shortCode} step-by-step?`,
        `Where is the nearest Seva Center for ${activeScheme.shortCode}?`,
        "Check my document audit & NPCI status",
      ]
    : [
        "What are the eligible schemes I am eligible for?",
        "What are the non-eligible schemes for me?",
        "Check my document audit & NPCI status",
        "What are the requirements for this scheme?",
        "What are the documents required for this particular scheme?",
        "How can I do it?",
        "Why is NPCI Aadhaar seeding different from normal linking?",
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

          {/* AI Settings Toggle Button */}
          <button
            onClick={() => setShowAwsSettings(!showAwsSettings)}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-[#F5E29F] hover:bg-white/20 transition-all border border-white/15 cursor-pointer"
          >
            <Key className="size-3.5 text-[#DFB738]" />
            <span>
              {customGroqKey.trim()
                ? "⚡ Groq 70B: Active"
                : customGeminiKey.trim()
                ? "🌟 Gemini Flash: Active"
                : customAccessKey.trim() && customSecretKey.trim()
                ? "☁️ Bedrock: Configured"
                : "AI Keys (Free 2-Min Setup)"}
            </span>
            {showAwsSettings ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Multi-Provider AI Settings Drawer */}
      {showAwsSettings && (
        <div className="luxury-card rounded-2xl p-5 border border-[#DFC8A5] bg-[#FAF7F2] shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#DFB738]" />
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#0B1B4F]">
                  AI Intelligence Providers & Free Keys Setup
                </h4>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
                JanSetu runs with <strong>Zero-Fail offline resilience</strong> by default. You can plug in a <strong>100% free</strong> instant API key below to enable live high-speed streaming and multimodal vision document inspection:
              </p>
            </div>
            {credentialsConfigured && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Live Keys Active
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* 1. Groq Cloud (Free Llama 3.3 70B) */}
            <div className="rounded-xl border border-[#DFC8A5] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1B4F]">
                  <Zap className="size-3.5 text-amber-500" />
                  <span>Groq Cloud (Meta Llama 3.3 70B)</span>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  Recommended • Free
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Superfast streaming at ~500 tokens/sec. 100% free tier, zero credit card required.
              </p>
              <div className="mt-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Groq API Key
                </label>
                <input
                  type="password"
                  value={customGroqKey}
                  onChange={(e) => setCustomGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full rounded-lg border border-[#DFC8A5] bg-[#FAF7F2] px-3 py-1.5 text-xs font-mono text-slate-800 focus:border-[#DFB738] focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="mt-2 flex justify-end">
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B1B4F] hover:text-amber-600 underline"
                >
                  <span>Get Free Groq Key (30 Sec)</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            {/* 2. Google Gemini (Free 2.0 Flash + Vision) */}
            <div className="rounded-xl border border-[#DFC8A5] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1B4F]">
                  <Sparkles className="size-3.5 text-blue-600" />
                  <span>Google Gemini 2.0 Flash (Vision + Chat)</span>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  Multimodal • Free
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Powers both conversational chat and direct image audit for Aadhaar, marksheets, & passbooks.
              </p>
              <div className="mt-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={customGeminiKey}
                  onChange={(e) => setCustomGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-lg border border-[#DFC8A5] bg-[#FAF7F2] px-3 py-1.5 text-xs font-mono text-slate-800 focus:border-[#DFB738] focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="mt-2 flex justify-end">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B1B4F] hover:text-blue-600 underline"
                >
                  <span>Get Free Google AI Studio Key</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>

          {/* 3. AWS Bedrock Credentials Accordion/Section */}
          <div className="mt-4 rounded-xl border border-[#DFC8A5]/60 bg-white/60 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B1B4F] text-[11px] uppercase tracking-wider">
                ☁️ AWS Bedrock IAM Credentials (Optional)
              </span>
              <span className="text-[10px] text-slate-500">
                us-east-1 • Claude 3.5 Sonnet / Nova
              </span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div>
                <input
                  type="text"
                  value={customAccessKey}
                  onChange={(e) => setCustomAccessKey(e.target.value)}
                  placeholder="AWS Access Key ID"
                  className="w-full rounded-lg border border-[#DFC8A5] bg-white px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:border-[#DFB738] focus:outline-hidden"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={customSecretKey}
                  onChange={(e) => setCustomSecretKey(e.target.value)}
                  placeholder="AWS Secret Access Key"
                  className="w-full rounded-lg border border-[#DFC8A5] bg-white px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:border-[#DFB738] focus:outline-hidden"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={customRegion}
                  onChange={(e) => setCustomRegion(e.target.value)}
                  placeholder="Region (default: us-east-1)"
                  className="w-full rounded-lg border border-[#DFC8A5] bg-white px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:border-[#DFB738] focus:outline-hidden"
                />
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              Note: If your AWS Bedrock models are awaiting verification from AWS Support (<code>aws-verification@amazon.com</code>), Groq or Gemini above will run with zero downtime!
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EDE6DD]">
            <div className="text-[11px] text-slate-500">
              🔒 Keys are securely stored in your local browser and sent directly to server endpoints.
            </div>
            <div className="flex items-center gap-2">
              {credentialsConfigured && (
                <button
                  type="button"
                  onClick={handleClearCredentials}
                  className="rounded-lg px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                >
                  Clear All Keys
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveCredentials}
                className="rounded-xl bg-[#0B1B4F] px-5 py-2 text-xs font-bold text-[#F5E29F] hover:bg-[#152864] transition-all cursor-pointer border border-[#DFB738]/40 shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-3.5 text-[#DFB738]" />
                <span>Save & Activate Provider</span>
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

      {/* Active Scheme Context Ribbon (Auto-Detected) */}
      {activeScheme && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#0B1B4F] via-[#152864] to-[#071233] border-2 border-[#DFB738]/60 p-4 text-white shadow-md">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#DFB738] text-[#0B1B4F] font-black text-base shadow-sm">
              🎯
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#F5E29F]">
                  Active Scheme Context Auto-Detected:
                </span>
                <span className="rounded bg-[#152864] px-2 py-0.5 font-mono text-[11px] font-black text-[#F5E29F] border border-[#DFB738]/40">
                  {activeScheme.shortCode}
                </span>
                {isCurrentSchemeEligible ? (
                  <span className="rounded bg-emerald-900/90 px-2 py-0.5 text-[10px] font-bold text-emerald-200 border border-emerald-500/40">
                    ✓ 100% Eligible
                  </span>
                ) : (
                  <span className="rounded bg-rose-900/90 px-2 py-0.5 text-[10px] font-bold text-rose-200 border border-rose-500/40">
                    ✕ Ineligible
                  </span>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-black text-white font-serif tracking-tight mt-0.5">
                {activeScheme.title}
              </h4>
              <p className="text-[11px] text-slate-200">
                {activeScheme.ministry} • Entitlement: <strong className="text-[#F5E29F]">{activeScheme.benefitAmount}</strong>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#F5E29F] bg-[#071233]/80 px-3 py-1.5 rounded-full border border-[#DFB738]/40 shadow-xs">
              <Sparkles className="size-3 text-[#DFB738]" />
              Prompts & answers tailored to {activeScheme.shortCode}
            </span>
          </div>
        </div>
      )}

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
                style={
                  m.role === "user"
                    ? { backgroundColor: "#0B1B4F", color: "#FFFFFF" }
                    : { backgroundColor: "#FAF7F2", color: "#1E293B" }
                }
                className={`rounded-2xl p-4 max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                  m.role === "user"
                    ? "text-white shadow-xs border border-[#142A6F]"
                    : "text-slate-800 border border-[#EDE6DD]"
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

          {/* Continuous Voice Active Banner */}
          {isListening && (
            <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-300 px-3.5 py-2 text-xs text-rose-900 shadow-2xs">
              <span className="flex items-center gap-2 font-bold">
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2.5 bg-rose-600"></span>
                </span>
                <span>🎙️ Microphone Active — Listening continuously across natural pauses.</span>
              </span>
              <button
                type="button"
                onClick={toggleListening}
                className="text-[11px] font-black text-rose-800 underline hover:text-rose-950 cursor-pointer"
              >
                Finish Speaking
              </button>
            </div>
          )}

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
                  : activeScheme
                  ? `Ask anything about ${activeScheme.shortCode} (e.g. documents, stages, eligibility)...`
                  : language === "hi"
                  ? "हिंदी या अंग्रेजी में पूछें (उदा: 'मैं किन योजनाओं के लिए पात्र हूँ?')..."
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
