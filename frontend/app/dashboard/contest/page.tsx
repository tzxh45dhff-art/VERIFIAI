"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, XCircle, Loader2, Sliders, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuditStore } from "@/store/audit-store";
import { useAuthStore } from "@/store/auth-store";
import type { AuditClaim, ContestItem } from "@/lib/types";
import { toast } from "sonner";
import { computeRisk, counterfactualHint, type RiskInputs } from "@/lib/risk-formula";

const MOCK_CLAIMS: AuditClaim[] = [
  { id: "c2", text: "sector-wide default rates are increasing by an estimated 18% year-over-year", classification: "UNVERIFIED", confidence: 0.68, source_field: null, source_value: null, explanation: "External market statistic not in source data.", search_query: null },
  { id: "c3", text: "applicant has less than 1 year of revenue history", classification: "HALLUCINATION", confidence: 0.99, source_field: "years_in_business", source_value: "3 years", explanation: "Source data states 3 years. Letter claims < 1 year — direct contradiction.", letter_value: "< 1 year" },
  { id: "c4", text: "$250,000 significantly exceeds typical approval ranges for rural zip codes, which average $45,000", classification: "UNVERIFIED", confidence: 0.61, source_field: "loan_requested", source_value: "250000", explanation: "Loan amount is accurate but '$45,000 average' is unverified.", search_query: null },
];

const LOADING_STEPS = [
  "Submitting your evidence…",
  "Cross-referencing counter-claims against source data…",
  "Forwarding to re-evaluation engine…",
  "Re-evaluating risk score with corrected data…",
  "Generating Explainable Delta…",
  "Preparing verdict…",
];

export default function ContestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { auditResult, applicationData, rejectionLetter, setReevalResult, biasFlags } = useAuditStore();
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(-1);

  const claims: AuditClaim[] = auditResult?.claims ?? MOCK_CLAIMS;
  const contestable = claims.filter((c: AuditClaim) =>
    c.classification === "HALLUCINATION" || c.classification === "UNVERIFIED" || c.classification === "WEB_CONTRADICTED"
  );

  const [sim, setSim] = useState<RiskInputs>({
    years_in_business: applicationData?.years_in_business ?? 3,
    credit_score:      applicationData?.credit_score ?? 710,
    annual_revenue:    applicationData?.annual_revenue ?? 150000,
    employees:         applicationData?.employees ?? 8,
    zip_type:          applicationData?.zip_type ?? "rural",
  });

  const riskResult = useMemo(() => computeRisk(sim), [sim]);
  const hint       = useMemo(() => counterfactualHint(sim), [sim]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadStep(i);
      await new Promise(r => setTimeout(r, 700));
    }
    const contestItems: ContestItem[] = Object.entries(evidence)
      .filter(([, v]) => v.trim())
      .map(([id, text]) => ({ claim_id: id, claim_text: text, counter_evidence_text: text }));

    try {
      const appData = applicationData ?? { application_id: "APP-7842", name: "Aarav Sharma", business: "GreenLeaf AgriTech", type: "Rural Tech Startup", location: "Jaipur, Rajasthan", zip_type: "rural", zip_code: "302021", industry: "AgriTech", annual_revenue: 150000, years_in_business: 3, employees: 8, credit_score: 710, loan_requested: 250000, collateral: "", purpose: "" };
      const result = await api.reevaluate(auditResult?.case_id ?? "CASE-DEMO", appData, rejectionLetter ?? "", contestable, contestItems);
      setReevalResult(result);
    } catch {
      setReevalResult(MOCK_REEVAL as any);
      toast.success("Re-evaluation complete (demo mode)");
    }
    setLoading(false); setLoadStep(-1);
    router.push("/dashboard/result");
  }, [evidence, applicationData, auditResult, rejectionLetter, contestable, setReevalResult, router]);

  const hasEvidence = Object.values(evidence).some(v => v.trim());
  const hasBias     = biasFlags.length > 0;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 96px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 36, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
          Decision Contestation
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 560 }}>
          {user?.name} — contesting on behalf of {applicationData?.name ?? "Aarav Sharma"} · Guaranteed under GDPR Article 22.
        </p>
      </div>

      {/* Bias banner — 64px bottom margin (reading order: 1) */}
      {hasBias && (
        <div role="alert" style={{ padding: "14px 18px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)", marginBottom: 64, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertCircle size={16} style={{ color: "var(--unverified)", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 14, color: "var(--unverified)" }}>
            <strong>Systemic Bias Alert:</strong> This applicant belongs to a demographic flagged as HIGH RISK (Rural AgriTech). The model has insufficient training data for this group and may have materially influenced the denial.
          </span>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="card" style={{ padding: 48, textAlign: "center", marginBottom: 32 }}>
          <Loader2 size={36} style={{ color: "var(--accent)", margin: "0 auto 24px", animation: "spin 1s linear infinite" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-live="polite">
            {LOADING_STEPS.map((s, i) => (
              <p key={s} style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: i === loadStep ? "var(--accent)" : i < loadStep ? "var(--verified)" : "var(--text-muted)" }}>
                {i < loadStep ? "✓" : i === loadStep ? "⏳" : "○"} {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Claims section — full width, single column (reading order: 2+3) ── */}
          <div style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 32 }}>
              Flagged Claims
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {contestable.map((claim, i) => (
                <motion.div key={claim.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <ClaimContest
                    claim={claim}
                    value={evidence[claim.id] ?? ""}
                    onChange={v => setEvidence(p => ({ ...p, [claim.id]: v }))}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Evidence summary (reading order: 4) — 48px top margin */}
          <div style={{ marginTop: 48, marginBottom: 0 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>Evidence Summary</h2>
            <div className="card" style={{ overflow: "hidden" }}>
              {contestable.map((c, i) => (
                <div key={c.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 180px 120px",
                  alignItems: "center", height: 48, padding: "0 20px",
                  borderBottom: i < contestable.length - 1 ? "1px solid var(--bg-border)" : "none",
                  fontSize: 13,
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: c.classification === "HALLUCINATION" ? "var(--hallucination)" : "var(--unverified)", textTransform: "uppercase" }}>{c.classification}</span>
                  <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.text.slice(0, 48)}…</span>
                  <span style={{ color: evidence[c.id]?.trim() ? "var(--verified)" : "var(--text-muted)", fontSize: 12 }}>
                    {evidence[c.id]?.trim() ? "✓ Evidence provided" : "— Pending"}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
                    {Math.round(c.confidence * 100)}% conf.
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What-If Simulator (reading order: 5) — full-width card, 48px top margin */}
          <div style={{ marginTop: 48 }}>
            <div className="card" style={{ padding: 32, overflow: "hidden" }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <Sliders size={18} style={{ color: "var(--text-muted)" }} aria-hidden="true" /> What-If Simulator
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Deterministic formula — no AI. Real-time risk score adjustment.</p>
              </div>

              {/* 40% sliders / 60% gauge */}
              <div style={{ display: "grid", gridTemplateColumns: "40% 60%", gap: 40, alignItems: "center" }}>
                {/* Sliders */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {([
                    { key: "years_in_business", label: "Years in Business", min: 1, max: 10, step: 1,     fmt: (v: number) => `${v} yr${v > 1 ? "s" : ""}` },
                    { key: "credit_score",       label: "Credit Score",       min: 500, max: 850, step: 5,  fmt: (v: number) => String(v) },
                    { key: "annual_revenue",     label: "Annual Revenue",     min: 50000, max: 500000, step: 10000, fmt: (v: number) => `$${(v/1000).toFixed(0)}k` },
                    { key: "employees",          label: "Employees",          min: 1, max: 50, step: 1,     fmt: (v: number) => String(v) },
                  ] as const).map(s => (
                    <div key={s.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.label}</label>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--cyan)" }}>
                          {s.fmt((sim as any)[s.key])}
                        </span>
                      </div>
                      <input
                        type="range" min={s.min} max={s.max} step={s.step}
                        value={(sim as any)[s.key]}
                        onChange={e => setSim(p => ({ ...p, [s.key]: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: "var(--accent)", height: 4 }}
                        aria-label={`${s.label}: ${s.fmt((sim as any)[s.key])}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Gauge + result (60%) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  {/* SVG gauge 160×160 */}
                  {(() => {
                    const R = 64, C = 2 * Math.PI * R;
                    const fill = riskResult.score / 100;
                    const col  = riskResult.decision === "APPROVED" ? "var(--verified)" : "var(--hallucination)";
                    return (
                      <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label={`Risk score: ${riskResult.score} out of 100`}>
                        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
                        <circle cx="80" cy="80" r={R} fill="none" stroke={col} strokeWidth="10"
                          strokeDasharray={C} strokeDashoffset={C * (1 - fill)}
                          strokeLinecap="round" transform="rotate(-90 80 80)"
                          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
                        />
                        <text x="80" y="75" textAnchor="middle" fontSize="40" fontWeight="700" fill={col} fontFamily="var(--font-mono)">{riskResult.score}</text>
                        <text x="80" y="95" textAnchor="middle" fontSize="13" fill="var(--text-muted)" fontFamily="var(--font-sans)">/100</text>
                      </svg>
                    );
                  })()}
                  <p style={{ fontSize: 18, fontWeight: 700, color: riskResult.decision === "APPROVED" ? "var(--verified)" : "var(--hallucination)" }} aria-live="polite">
                    {riskResult.decision === "APPROVED" ? "✓ WOULD BE APPROVED" : "✗ WOULD BE DENIED"}
                  </p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontStyle: "italic", color: "var(--text-secondary)", textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
                    💡 {hint}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit bar (reading order: 6) — 64px top margin, page climax */}
          <div style={{
            marginTop: 64, paddingTop: 32, paddingBottom: 32,
            borderTop: "1px solid var(--bg-border)",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <button
              onClick={handleSubmit}
              disabled={!hasEvidence}
              className="btn-primary"
              style={{
                width: 480, height: 52, fontSize: 16, fontWeight: 600,
                opacity: hasEvidence ? 1 : 0.35,
                cursor: hasEvidence ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
              aria-label="Submit counter-evidence and re-evaluate decision"
            >
              Submit Evidence &amp; Re-evaluate <ArrowRight size={18} aria-hidden="true" />
            </button>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              Re-evaluation typically takes 5–8 seconds
            </p>
          </div>
        </>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ClaimContest({ claim, value, onChange }: { claim: AuditClaim; value: string; onChange: (v: string) => void }) {
  const isHalluc   = claim.classification === "HALLUCINATION";
  const isAnswered = value.trim().length > 0;
  const color      = isHalluc ? "var(--hallucination)" : "var(--unverified)";
  const borderCol  = isAnswered
    ? (isHalluc ? "rgba(16,185,129,0.30)" : "rgba(16,185,129,0.30)")
    : (isHalluc ? "rgba(239,68,68,0.30)" : "rgba(245,158,11,0.30)");
  const bgCol      = isAnswered
    ? "rgba(16,185,129,0.05)"
    : (isHalluc ? "rgba(239,68,68,0.05)" : "rgba(245,158,11,0.05)");
  const leftCol    = isAnswered ? "var(--verified)" : color;

  return (
    <div style={{ borderRadius: "var(--radius-lg)", border: `1px solid ${borderCol}`, borderLeft: `3px solid ${leftCol}`, background: bgCol, padding: 20 }}>
      {/* Classification badge + claim text */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        {isHalluc
          ? <XCircle size={16} style={{ color: "var(--hallucination)", flexShrink: 0, marginTop: 2 }} />
          : <AlertCircle size={16} style={{ color: "var(--unverified)", flexShrink: 0, marginTop: 2 }} />
        }
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            [{claim.classification}]
          </span>
          <p style={{ fontSize: 14, color: "var(--text-primary)", marginTop: 4, lineHeight: 1.6 }}>
            &ldquo;{claim.text}&rdquo;
          </p>
          {claim.source_value && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                Source data shows:
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: "var(--cyan)" }}>{claim.source_value}</p>
            </div>
          )}
        </div>
      </div>

      {/* Evidence input or confirmation */}
      {isAnswered ? (
        <div style={{
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "var(--radius-md)", padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{value}</span>
          <button onClick={() => onChange("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}>Edit</button>
        </div>
      ) : (
        <div>
          <label htmlFor={`ev-${claim.id}`} className="field-label" style={{ marginBottom: 6, display: "block" }}>
            Your Counter-Evidence
          </label>
          <textarea
            id={`ev-${claim.id}`}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={isHalluc ? `Correct: ${claim.source_value ?? "provide verified data"}` : "Provide supporting context or documentation…"}
            rows={3}
            style={{
              width: "100%", padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-base)",
              border: `1px solid ${isHalluc ? "rgba(239,68,68,0.40)" : "rgba(245,158,11,0.40)"}`,
              color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: 14,
              outline: "none", resize: "none", lineHeight: 1.6, height: 80,
            }}
          />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            {isHalluc ? "Correct the hallucinated claim with verified data." : "Provide context or supporting documentation."}
          </p>
        </div>
      )}
    </div>
  );
}

const MOCK_REEVAL = {
  case_id: "CASE-DEMO01",
  delta_items: [
    { field: "Years in Business", old_value: "< 1 Year (Hallucinated)", new_value: "3 Years (Verified)", old_risk_contribution: 35, new_risk_contribution: 11, delta: -24, explanation: "Correcting to 3 years moves applicant past the 2-year minimum tenure threshold." },
    { field: "Bias Adjustment", old_value: "Rural penalty (+15)", new_value: "Bias flag applied (−8)", old_risk_contribution: 15, new_risk_contribution: 7, delta: -8, explanation: "Rural AgriTech demographic has known training data gap. Supervisor bias correction applied." },
  ],
  old_total_score: 85, new_total_score: 29, threshold: 50,
  old_decision: "DENIED", new_decision: "APPROVED", decision_flipped: true,
  confidence: 0.94,
  supervisor_note: "After reviewing the counter-evidence submitted, it is clear the automated underwriting system made a critical factual error regarding revenue history. GreenLeaf AgriTech has 3 verified years of operation, satisfying our tenure requirements. With a credit score of 710 and ₹40L collateral, the corrected risk profile supports approval.",
  conditions: ["Loan approved subject to quarterly revenue review for first year.", "Collateral documentation required before disbursement."],
  evaluated_at: new Date().toISOString(),
};
