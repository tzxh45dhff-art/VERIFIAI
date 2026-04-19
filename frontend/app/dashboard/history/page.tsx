"use client";
import { motion } from "framer-motion";
import { History, TrendingUp, Eye } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { staggerContainer, fadeInUp } from "@/lib/motion";

const MOCK_CASES = [
  { id: "APP-7842", applicant: "Aarav Sharma", date: "2026-04-18", outcome: "APPROVED", hallucinations: 1, flipped: true },
  { id: "APP-7801", applicant: "Meera Iyer", date: "2026-04-17", outcome: "DENIED", hallucinations: 0, flipped: false },
  { id: "APP-7755", applicant: "Raj Pillai", date: "2026-04-16", outcome: "APPROVED", hallucinations: 2, flipped: true },
];

export default function HistoryPage() {
  const { user } = useAuthStore();
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <motion.h1 variants={fadeInUp} style={{ fontFamily: "Playfair Display, serif", fontSize: 36, fontWeight: 900, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <History style={{ color: "var(--accent-blue)" }} /> Case History
        </motion.h1>
        <motion.p variants={fadeInUp} style={{ fontFamily: "Lora, serif", fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>
          {user?.name}'s audit history — {user?.organization}
        </motion.p>
        <motion.div variants={fadeInUp} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[{ label: "Total Cases", value: user?.casesAnalyzed ?? 47, color: "var(--accent-blue)" }, { label: "Decisions Flipped", value: user?.decisionsFlipped ?? 23, color: "var(--verified)" }, { label: "Hallucinations Found", value: user?.hallucinationsFound ?? 134, color: "var(--hallucination)" }].map((s) => (
            <div key={s.label} className="card" style={{ padding: 20 }}>
              <p style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 36, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </motion.div>
        <motion.div variants={fadeInUp} className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Audit case history">
            <thead>
              <tr style={{ background: "var(--bg-elevated)" }}>
                {["Case ID", "Applicant", "Date", "Outcome", "Hallucinations", "Flipped?"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: "Syne, sans-serif", fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CASES.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }} style={{ borderTop: "1px solid var(--bg-border)" }}>
                  <td style={{ padding: "14px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--accent-cyan)" }}>{c.id}</td>
                  <td style={{ padding: "14px 16px", fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{c.applicant}</td>
                  <td style={{ padding: "14px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--text-tertiary)" }}>{c.date}</td>
                  <td style={{ padding: "14px 16px" }}><span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: c.outcome === "APPROVED" ? "var(--verified)" : "var(--hallucination)", background: c.outcome === "APPROVED" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 4, padding: "2px 8px" }}>{c.outcome}</span></td>
                  <td style={{ padding: "14px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: c.hallucinations > 0 ? "var(--hallucination)" : "var(--text-tertiary)", textAlign: "center" }}>{c.hallucinations}</td>
                  <td style={{ padding: "14px 16px" }}>{c.flipped && <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--verified)", fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700 }}><TrendingUp size={12} />YES</span>}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    </div>
  );
}
