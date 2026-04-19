"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, User, CheckCircle2, AlertCircle, XCircle, Globe, Loader2, ArrowRight, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { useAuditStore } from "@/store/audit-store";
import { useAuthStore } from "@/store/auth-store";
import type { AuditClaim, ApplicationData } from "@/lib/types";
import { toast } from "sonner";
import { fadeInUp, staggerContainer, claimReveal } from "@/lib/motion";

const DEMO_APP: ApplicationData = {
  application_id: "APP-7842", name: "Aarav Sharma", business: "GreenLeaf AgriTech",
  type: "Rural Tech Startup", location: "Jaipur, Rajasthan", zip_type: "rural",
  zip_code: "302021", industry: "AgriTech", annual_revenue: 150000,
  years_in_business: 3, employees: 8, credit_score: 710, loan_requested: 250000,
  collateral: "Farm equipment valued at ₹40L", purpose: "Irrigation automation system",
};

type Phase = "idle" | "generating" | "auditing" | "done";

const AUDIT_STEPS = [
  "Extracting factual claims from document…",
  "Running closed-book text analysis (Layer A)…",
  "Searching web for unverified claims (Layer B)…",
  "Computing confidence scores…",
  "Building audit report…",
];

export default function AuditPage() {
  const { user } = useAuthStore();
  const { setAuditResult, setRejectionLetter, biasFlags } = useAuditStore();
  const [letter, setLetter] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [auditStep, setAuditStep] = useState(-1);
  const [claims, setClaims] = useState<AuditClaim[]>([]);
  const [summary, setSummary] = useState<{ overall_reliability_score: number; hallucination_count: number; verified_count: number; unverified_count: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runFullAudit = useCallback(async () => {
    setPhase("generating");
    setLetter("");
    setClaims([]);
    setSummary(null);
    setAuditStep(-1);

    let fullLetter = "";
    try {
      abortRef.current = new AbortController();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/audit/generate-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEMO_APP),
        signal: abortRef.current.signal,
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n").filter((l) => l.startsWith("data: "))) {
            const payload = line.slice(6);
            if (payload === "[DONE]") break;
            try { const { token } = JSON.parse(payload); if (token) { fullLetter += token; setLetter((p) => p + token); } } catch {}
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        toast.error("Backend offline — using mock letter");
        fullLetter = MOCK_LETTER;
        setLetter(MOCK_LETTER);
      }
    }
    if (!fullLetter) { fullLetter = MOCK_LETTER; setLetter(MOCK_LETTER); }

    // Animate loading steps
    setPhase("auditing");
    for (let i = 0; i < AUDIT_STEPS.length; i++) {
      setAuditStep(i);
      await new Promise((r) => setTimeout(r, 700 + (i === 2 ? 1500 : 0)));
    }

    try {
      const result = await api.factCheck(DEMO_APP, fullLetter);
      setClaims(result.claims);
      setSummary(result.summary);
      setAuditResult(result);
      setRejectionLetter(fullLetter);
    } catch {
      setClaims(MOCK_CLAIMS);
      setSummary(MOCK_SUMMARY);
    }
    setAuditStep(-1);
    setPhase("done");
  }, [setAuditResult, setRejectionLetter]);

  const annotated = buildAnnotatedLetter(letter, phase === "done" ? claims : []);
  const hasBias = biasFlags.length > 0;

  const classificationColor: Record<string, string> = {
    VERIFIED: "var(--verified)",
    UNVERIFIED: "var(--unverified)",
    HALLUCINATION: "var(--hallucination)",
    WEB_VERIFIED: "var(--web-verified)",
    WEB_CONTRADICTED: "var(--web-contradicted)",
  };

  return (
    <div className="data-page" style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ marginBottom: 32 }}>
        <motion.div variants={fadeInUp} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
              Hallucination Audit Trail
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Auditor: <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{user?.name}</strong> · {user?.organization} · Two-layer verification
            </p>
          </div>
          {phase === "done" && (
            <Link href="/dashboard/contest">
              <button className="btn-danger" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Contest Decision <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Link>
          )}
        </motion.div>
      </motion.div>

      {/* Bias alert */}
      {hasBias && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)", marginBottom: 24, fontFamily: "Lora, serif", fontSize: 14, color: "var(--unverified)" }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <span><strong>Systemic Bias Alert:</strong> This applicant belongs to a demographic flagged as HIGH RISK (Rural AgriTech). Insufficient training data for this group may have influenced the automated denial.</span>
        </motion.div>
      )}

      {/* Legend bar */}
      {phase !== "idle" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--bg-border)", background: "var(--bg-surface)", marginBottom: 24 }} role="note" aria-label="Audit legend">
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)" }}>Legend:</span>
          {[
            { cls: "claim-verified", label: "Verified" },
            { cls: "claim-web-verified", label: "Web-Verified" },
            { cls: "claim-unverified", label: "Unverified" },
            { cls: "claim-web-contradicted", label: "Web-Contradicted" },
            { cls: "claim-hallucination", label: "Hallucination" },
          ].map((l) => (
            <span key={l.label} className={l.cls} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4 }}>{l.label}</span>
          ))}
          {(phase === "generating" || phase === "auditing") && (
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--accent-cyan)" }}>
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} aria-hidden="true" />
              {phase === "generating" ? "Generating letter…" : AUDIT_STEPS[auditStep] ?? "Running audit…"}
            </span>
          )}
        </div>
      )}

      {/* IDLE state */}
      {phase === "idle" && (
        <div className="card" style={{ padding: 48, textAlign: "center", marginBottom: 24 }}>
          <Zap size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} aria-hidden="true" />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Run the Hallucination Audit</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 28px" }}>
            Claude generates a rejection letter for Aarav Sharma’s GreenLeaf AgriTech application, then audits every factual claim against source data AND the live web.
          </p>
          <button onClick={runFullAudit} className="btn-primary">
            Run Two-Layer Audit on Demo Case
          </button>
        </div>
      )}

      {/* Split panel */}
      {phase !== "idle" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Source data */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <User size={16} aria-hidden="true" /> Source Data — {DEMO_APP.application_id}
            </h2>
            <dl style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {Object.entries({ Name: DEMO_APP.name, Business: DEMO_APP.business, Type: DEMO_APP.type, Location: DEMO_APP.location, "Annual Revenue": `$${DEMO_APP.annual_revenue.toLocaleString()}`, "Years in Business": `${DEMO_APP.years_in_business} years`, "Credit Score": DEMO_APP.credit_score, "Loan Requested": `$${DEMO_APP.loan_requested.toLocaleString()}` }).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--bg-border)" }}>
                  <dt style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>{k}</dt>
                  <dd style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Annotated letter */}
          <div className="card" style={{ padding: 24, overflow: "auto" }}>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
              AI Rejection Letter — {phase === "done" ? "Audited" : "Generating…"}
            </h2>
            {phase !== "done" ? (
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, lineHeight: 2, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }} aria-live="polite">
                {letter}<span style={{ display: "inline-block", width: 8, height: 14, background: "var(--accent-cyan)", animation: "blink 1s step-end infinite", verticalAlign: "text-bottom" }} aria-hidden="true" />
              </div>
            ) : (
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, lineHeight: 2, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: annotated }} />
            )}
          </div>
        </div>
      )}

      {/* Audit loading steps */}
      {phase === "auditing" && auditStep >= 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-live="polite" aria-label="Audit progress">
            {AUDIT_STEPS.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {i < auditStep ? <CheckCircle2 size={14} style={{ color: "var(--verified)" }} aria-hidden="true" /> : i === auditStep ? <Loader2 size={14} style={{ color: "var(--accent-cyan)", animation: "spin 1s linear infinite" }} aria-hidden="true" /> : <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--bg-border)", display: "inline-block" }} aria-hidden="true" />}
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: i === auditStep ? "var(--accent-cyan)" : i < auditStep ? "var(--verified)" : "var(--text-tertiary)" }}>
                  {step}
                  {i === 2 && <span style={{ marginLeft: 8, fontSize: 10, color: "var(--accent-cyan)" }}>← KEY DIFFERENTIATOR</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score + claims */}
      {phase === "done" && summary && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {/* Score card */}
          <motion.div variants={fadeInUp} className="card" style={{ padding: 28, marginBottom: 24, display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 64, fontWeight: 700, lineHeight: 1, color: summary.overall_reliability_score < 50 ? "var(--hallucination)" : "var(--verified)" }} aria-label={`Reliability score: ${summary.overall_reliability_score} out of 100`}>
                {summary.overall_reliability_score}
              </p>
              <p style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "var(--text-tertiary)" }}>/100 Reliability</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color: summary.overall_reliability_score < 50 ? "var(--hallucination)" : "var(--verified)", marginBottom: 6 }}>
                {summary.overall_reliability_score < 50 ? "⚠ AUDIT FAIL" : "✓ AUDIT PASS"}
              </p>
              <p style={{ fontFamily: "Lora, serif", fontSize: 14, color: "var(--text-secondary)" }}>
                {claims.length} claims analyzed · {summary.verified_count} verified · {summary.unverified_count} unverified · {summary.hallucination_count} hallucination(s) detected
              </p>
              <p style={{ fontFamily: "Lora, serif", fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
                Audited by {user?.name} · Case {DEMO_APP.application_id}
              </p>
            </div>
          </motion.div>

          {/* Claims */}
          <motion.div variants={fadeInUp} className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>Claim-by-Claim Breakdown</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }} role="list" aria-label="Individual claim audit results">
              {claims.map((claim, i) => (
                <motion.div key={claim.id} variants={claimReveal} custom={i} role="listitem">
                  <ClaimCard claim={claim} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      `}</style>
    </div>
  );
}

function ClaimCard({ claim }: { claim: AuditClaim }) {
  const [open, setOpen] = useState(false);
  const BADGE_VARIANT: Record<string, string> = {
    VERIFIED:         "badge badge-verified",
    UNVERIFIED:       "badge badge-unverif",
    HALLUCINATION:    "badge badge-hallu",
    WEB_VERIFIED:     "badge badge-web-verified",
    WEB_CONTRADICTED: "badge badge-web-contra",
  };
  const CARD_CLS: Record<string, string> = {
    VERIFIED:         "claim-card claim-verified",
    UNVERIFIED:       "claim-card claim-unverified",
    HALLUCINATION:    "claim-card claim-hallu",
    WEB_VERIFIED:     "claim-card claim-web-v",
    WEB_CONTRADICTED: "claim-card claim-web-c",
  };
  const badgeCls = BADGE_VARIANT[claim.classification] ?? "badge badge-unverif";
  const cardCls  = CARD_CLS[claim.classification]    ?? "claim-card claim-unverified";
  const confidence = Math.round(claim.confidence * 100);
  const confColor = claim.classification === "HALLUCINATION" ? "var(--hallucination)"
    : claim.classification === "VERIFIED" || claim.classification === "WEB_VERIFIED" ? "var(--verified)"
    : "var(--unverified)";

  return (
    <div className={cardCls}>
      {/* Row 1: badge + confidence */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span className={badgeCls}>{claim.classification.replace("_", "-")}</span>
        {/* Confidence bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 80, height: 4, borderRadius: "var(--radius-full)", background: "var(--bg-elevated)", overflow: "hidden" }}>
            <div style={{ width: `${confidence}%`, height: "100%", background: confColor, transition: "width 0.4s ease" }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{confidence}%</span>
        </div>
      </div>

      {/* Row 2: claim text */}
      <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 10 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.6 }}>
          &ldquo;{claim.text}&rdquo;
        </p>
      </div>

      {/* Row 3: source */}
      {claim.source_field && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
          <span style={{ color: "var(--text-muted)" }}>Source [{claim.source_field}]</span> → {claim.source_value}
        </p>
      )}

      {/* Row 4: explanation (expandable) */}
      <button
        onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, marginBottom: open ? 8 : 0 }}
        aria-expanded={open}
      >
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{open ? "Hide" : "Show"} explanation</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, paddingTop: 4 }}>{claim.explanation}</p>
            {claim.source_url && (
              <a href={claim.source_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", display: "block", marginTop: 6, wordBreak: "break-all" }}>Web source: {claim.source_url}</a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 5: contest button — only on HALLUCINATION */}
      {claim.classification === "HALLUCINATION" && (
        <Link href="/dashboard/contest" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, fontSize: 13, fontWeight: 600, color: "var(--hallucination)" }}>
          Contest This Claim →
        </Link>
      )}
    </div>
  );
}

function buildAnnotatedLetter(text: string, claims: AuditClaim[]): string {
  let result = text;
  const map: Record<string, string> = {
    VERIFIED: "claim-verified", UNVERIFIED: "claim-unverified",
    HALLUCINATION: "claim-hallucination", WEB_VERIFIED: "claim-web-verified",
    WEB_CONTRADICTED: "claim-web-contradicted",
  };
  const sorted = [...claims].sort((a, b) => b.text.length - a.text.length);
  for (const c of sorted) {
    const cls = map[c.classification] ?? "claim-unverified";
    const esc = c.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(esc, "g"), `<mark class="${cls}" title="${c.explanation.replace(/"/g, "'")}">${c.text}</mark>`);
  }
  return result;
}

const MOCK_LETTER = `Dear Mr. Sharma,

Thank you for your loan application for GreenLeaf AgriTech (Application ID: APP-7842).

The applicant is a tech startup operating in the agricultural technology sector with operations in Jaipur, Rajasthan. However, market conditions for tech startups are currently volatile, and sector-wide default rates are increasing by an estimated 18% year-over-year.

Our records indicate the applicant has less than 1 year of revenue history, which does not satisfy our minimum underwriting threshold of 24 months of documented revenue. The requested loan of $250,000 significantly exceeds typical approval ranges for rural zip codes, which average $45,000 in our portfolio.

Based on this assessment, your application has been DENIED.

— Automated Underwriting Engine v3.1`;

const MOCK_CLAIMS: AuditClaim[] = [
  { id: "c1", text: "tech startup operating in the agricultural technology sector", classification: "VERIFIED", confidence: 0.97, source_field: "type", source_value: "Rural Tech Startup / AgriTech", explanation: "Directly matches business type and industry fields in source data." },
  { id: "c2", text: "sector-wide default rates are increasing by an estimated 18% year-over-year", classification: "UNVERIFIED", confidence: 0.68, source_field: null, source_value: null, explanation: "External market statistic not present in applicant source data.", search_query: "AgriTech startup default rates India 2024 increase" },
  { id: "c3", text: "applicant has less than 1 year of revenue history", classification: "HALLUCINATION", confidence: 0.99, source_field: "years_in_business", source_value: "3 years", explanation: "Source data clearly states 3 years in business. This is a direct factual contradiction.", letter_value: "< 1 year" },
  { id: "c4", text: "$250,000 significantly exceeds typical approval ranges for rural zip codes, which average $45,000", classification: "UNVERIFIED", confidence: 0.61, source_field: "loan_requested", source_value: "250000", explanation: "Loan amount is accurate but 'average $45,000' is an internal model claim not in source data.", search_query: "rural MSME loan average India AgriTech approval" },
];

const MOCK_SUMMARY = { overall_reliability_score: 34, hallucination_count: 1, verified_count: 1, unverified_count: 2 };
