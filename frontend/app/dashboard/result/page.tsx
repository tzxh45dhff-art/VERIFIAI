"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, FileText, RotateCcw, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { useAuditStore } from "@/store/audit-store";
import { useAuthStore } from "@/store/auth-store";
import type { ReevalResult, DeltaItem } from "@/lib/types";
import { staggerContainer, fadeInUp } from "@/lib/motion";

const FALLBACK: ReevalResult = {
  case_id: "CASE-DEMO01",
  delta_items: [
    { field: "Years in Business", old_value: "< 1 Year (Hallucinated)", new_value: "3 Years (Verified)", old_risk_contribution: 35, new_risk_contribution: 11, delta: -24, explanation: "Correcting to 3 years moves applicant past the 2-year minimum threshold." },
    { field: "Bias Adjustment",   old_value: "Rural penalty (+15)", new_value: "Bias correction applied", old_risk_contribution: 15, new_risk_contribution: 7, delta: -8, explanation: "Rural AgriTech demographic has known training data gap; supervisor bias correction applied." },
    { field: "Market Claim",      old_value: "18% default rate spike (Unverified)", new_value: "Claim removed", old_risk_contribution: 24, new_risk_contribution: 11, delta: -13, explanation: "Unverified market claim removed from risk scoring as it had no source basis." },
  ],
  old_total_score: 85, new_total_score: 29, threshold: 50,
  old_decision: "DENIED", new_decision: "APPROVED", decision_flipped: true,
  confidence: 0.94,
  supervisor_note: "After reviewing the counter-evidence submitted, it is clear the automated underwriting system made a critical factual error regarding revenue history. GreenLeaf AgriTech has 3 verified years of operation, satisfying our tenure requirements. With a credit score of 710 and ₹40L collateral, the corrected risk profile supports approval.",
  conditions: ["Loan approved subject to quarterly revenue review for first year.", "Collateral documentation required before disbursement."],
  evaluated_at: new Date().toISOString(),
};

export default function ResultPage() {
  const { reevalResult, biasFlags, applicationData } = useAuditStore();
  const { user } = useAuthStore();
  const result = reevalResult ?? FALLBACK;
  const confettiFired = useRef(false);
  const flipped = result.decision_flipped && result.new_decision === "APPROVED";
  const delta = result.old_total_score - result.new_total_score;

  useEffect(() => {
    if (flipped && !confettiFired.current) {
      confettiFired.current = true;
      import("canvas-confetti").then(m => {
        setTimeout(() => {
          m.default({ particleCount: 220, spread: 80, origin: { y: 0.5 }, colors: ["#059669","#10B981","#D1FAE5","#F59E0B"] });
        }, 600);
      });
    }
  }, [flipped]);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px 80px" }}>

      {/* ── VERDICT BANNER — 240px min, full width, climactic ── */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.1 }}
        className={flipped ? "verdict-approved" : ""}
        style={{
          minHeight: 240,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center",
          padding: "48px 40px",
          marginBottom: 40,
          background: flipped
            ? "linear-gradient(135deg, #064E3B 0%, #065F46 100%)"
            : "linear-gradient(135deg, #450A0A 0%, #7F1D1D 100%)",
          color: "#fff",
          position: "relative",
          borderRadius: "var(--radius-lg)",
        }}
        role="status" aria-live="assertive"
        aria-label={`Decision ${result.decision_flipped ? "reversed" : "upheld"}: ${result.new_decision}`}
      >
        {/* Status label */}
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: 13,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: flipped ? "#86EFAC" : "#FCA5A5",
          marginBottom: 12, fontWeight: 500,
        }}>
          {flipped ? "✓ Decision Reversed" : "✗ Decision Upheld"}
        </p>

        {/* THE main text — 88px, the largest on the entire site */}
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(56px, 8vw, 88px)",
          fontWeight: 800,
          lineHeight: 1,
          color: flipped ? "#ECFDF5" : "#FEF2F2",
          marginBottom: 16,
        }}>
          {result.new_decision}
        </h1>

        {/* Case meta — absolute bottom */}
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: 13,
          color: flipped ? "rgba(134,239,172,0.6)" : "rgba(252,165,165,0.6)",
        }}>
          {Math.round(result.confidence * 100)}% confidence · Case {result.case_id} · Audited by {user?.name}
        </p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible">

        {/* ── Score transformation — 3 squares, centered, 600px wide ── */}
        <motion.div variants={fadeInUp} className="card" style={{ padding: "40px 32px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", textAlign: "center", marginBottom: 32, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" }}>
            Before / After Risk Score
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, maxWidth: 600, margin: "0 auto" }}>
            {/* Before box — 180×180 */}
            <div style={{
              width: 180, height: 180, flexShrink: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(239,68,68,0.30)",
              background: "rgba(239,68,68,0.05)",
            }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Before</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 52, fontWeight: 700, lineHeight: 1, color: "var(--hallucination)", marginBottom: 6 }}>
                {result.old_total_score}
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--hallucination)" }}>{result.old_decision}</p>
            </div>

            {/* Center arrow + delta — 120px wide */}
            <div style={{ width: 120, flexShrink: 0, textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 32, color: "var(--text-muted)", marginBottom: 4 }}>→</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--verified)", marginBottom: 2 }}>−{delta} pts</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Score Reduction</p>
            </div>

            {/* After box — 180×180 */}
            <AnimatedAfterBox score={result.new_total_score} decision={result.new_decision} />
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "center", color: "var(--text-muted)", marginTop: 24 }}>
            Approval threshold: {result.threshold}/100 — Lower score = lower risk = better outcome
          </p>
        </motion.div>

        {/* ── Delta table — financial statement style ── */}
        <motion.div variants={fadeInUp} className="card" style={{ overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--bg-border)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Explainable Delta — What Changed and Why</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Risk score delta breakdown">
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  <th style={{ width: 200, padding: "10px 16px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Field</th>
                  <th style={{ width: 160, padding: "10px 16px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Before</th>
                  <th style={{ width: 160, padding: "10px 16px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>After</th>
                  <th style={{ width: 100, padding: "10px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Delta</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Why</th>
                </tr>
              </thead>
              <tbody>
                {result.delta_items.map((item: DeltaItem, i: number) => (
                  <motion.tr key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} style={{ borderTop: "1px solid var(--bg-border)", height: 52 }}>
                    <td style={{ padding: "0 16px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{item.field}</td>
                    <td style={{ padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--hallucination)", textDecoration: "line-through" }}>{item.old_value}</td>
                    <td style={{ padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--verified)" }}>{item.new_value}</td>
                    <td style={{ padding: "0 16px", textAlign: "right" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: item.delta < 0 ? "var(--verified)" : "var(--hallucination)" }}>
                        {item.delta < 0 ? "▼" : "▲"}{Math.abs(item.delta)}
                      </span>
                    </td>
                    <td style={{ padding: "0 16px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.explanation}</td>
                  </motion.tr>
                ))}
                {/* Total row — 64px, bold */}
                <tr style={{ borderTop: "2px solid var(--bg-border)", height: 64, background: "var(--bg-elevated)" }}>
                  <td style={{ padding: "0 16px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>TOTAL SCORE</td>
                  <td style={{ padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "var(--hallucination)" }}>{result.old_total_score}</td>
                  <td style={{ padding: "0 16px", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "var(--verified)" }}>{result.new_total_score}</td>
                  <td style={{ padding: "0 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "var(--verified)" }}>▼{delta}</td>
                  <td style={{ padding: "0 16px", fontSize: 13, fontWeight: 700, color: flipped ? "var(--verified)" : "var(--hallucination)" }}>
                    {flipped ? "✓ DECISION FLIPPED" : "✗ DECISION HELD"}
                  </td>
                </tr>
                {/* Decision row — 64px */}
                <tr style={{ borderTop: "1px solid var(--bg-border)", height: 64 }}>
                  <td style={{ padding: "0 16px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>DECISION</td>
                  <td colSpan={3} style={{ padding: "0 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: "var(--radius-full)", background: "rgba(239,68,68,0.12)", color: "var(--hallucination)" }}>{result.old_decision}</span>
                      <ArrowRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: "var(--radius-full)", background: "rgba(16,185,129,0.12)", color: "var(--verified)" }}>{result.new_decision}</span>
                    </div>
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bias impact note */}
        {biasFlags.length > 0 && (
          <motion.div variants={fadeInUp} style={{ padding: "14px 20px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)", marginBottom: 24 }} role="note">
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--unverified)", marginBottom: 4 }}>Bias Adjustment Applied</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              The model's training data had insufficient representation of Rural AgriTech applicants (11.3% approval rate vs 64.2% overall). A supervisor bias correction was applied to the final risk score.
            </p>
          </motion.div>
        )}

        {/* ── Supervisor memo — document style ── */}
        <motion.div variants={fadeInUp} style={{ maxWidth: 680, margin: "0 auto 24px", marginBottom: 24 }}>
          <div style={{
            background: "#0A0D16",
            border: "1px solid var(--bg-border)",
            borderTop: "3px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            {/* Memo header */}
            <div style={{ padding: "24px 40px 20px", borderBottom: "1px solid var(--bg-border)" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
                Underwriting Supervisor Re-Evaluation Memo
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                {[
                  ["TO:", applicationData?.name ?? "Aarav Sharma"],
                  ["FROM:", "AI Underwriting Supervisor"],
                  ["RE:", result.case_id],
                  ["DATE:", new Date(result.evaluated_at).toLocaleDateString()],
                ].map(([label, value]) => (
                  <p key={label} style={{ fontFamily: "var(--font-mono)", fontSize: 12, display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--text-muted)", minWidth: 48 }}>{label}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                  </p>
                ))}
              </div>
            </div>
            {/* Memo body */}
            <div style={{ padding: "20px 40px 24px" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.8, color: "var(--text-primary)", maxWidth: "60ch" }}>
                {result.supervisor_note}
              </p>
              {result.conditions && result.conditions.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    Conditions Upon Approval
                  </p>
                  <ol style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.conditions.map((c, i) => (
                      <li key={i} style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--text-secondary)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", flexShrink: 0 }}>{i + 1}.</span>
                        {c}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--bg-border)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                  VerifiAI Accountability Engine v1.0 · Reviewed by {user?.name} · {user?.organization}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div variants={fadeInUp} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { href: "/dashboard/compliance", Icon: FileText,   label: "Generate Compliance Passport", color: "var(--accent)" },
            { href: "/dashboard/history",    Icon: Trophy,     label: "View Full Case History",       color: "var(--verified)" },
            { href: "/dashboard/audit",      Icon: RotateCcw,  label: "Start New Audit",              color: "var(--text-secondary)" },
          ].map(cta => (
            <Link key={cta.href} href={cta.href} style={{ textDecoration: "none" }}>
              <div className="card card-hover" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <cta.Icon size={18} style={{ color: cta.color, flexShrink: 0 }} aria-hidden="true" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{cta.label}</span>
                <ArrowRight size={14} style={{ color: "var(--text-muted)", marginLeft: "auto" }} aria-hidden="true" />
              </div>
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function AnimatedAfterBox({ score, decision }: { score: number; decision: string }) {
  const [displayed, setDisplayed] = useState(85);
  useEffect(() => {
    const start = Date.now(), dur = 1600;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setDisplayed(Math.round(85 + (score - 85) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 500);
  }, [score]);

  return (
    <div style={{
      width: 180, height: 180, flexShrink: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      borderRadius: "var(--radius-lg)",
      border: "1px solid rgba(16,185,129,0.30)",
      background: "rgba(16,185,129,0.05)",
    }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>After</p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 52, fontWeight: 700, lineHeight: 1, color: "var(--verified)", marginBottom: 6, transition: "all 0.2s" }}>
        {displayed}
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--verified)" }}>{decision}</p>
    </div>
  );
}
