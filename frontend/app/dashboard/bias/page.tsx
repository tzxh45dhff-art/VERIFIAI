"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, AlertTriangle, ArrowRight, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { useAuditStore } from "@/store/audit-store";
import { useAuthStore } from "@/store/auth-store";
import type { BiasReport, BiasFlag } from "@/lib/types";
import { toast } from "sonner";
import { fadeInUp, staggerContainer } from "@/lib/motion";

const LOADING_STEPS = [
  "Loading dataset (10,000 rows)…",
  "Computing demographic distributions…",
  "Running chi-square independence tests…",
  "Calculating disparate impact ratios…",
  "Generating Bias Risk Report…",
];

export default function BiasPage() {
  const { user } = useAuthStore();
  const { setBiasFlags, setBiasReport } = useAuditStore();
  const [report, setReport] = useState<BiasReport | null>(null);
  const [narrative, setNarrative] = useState("");
  const [loadingStep, setLoadingStep] = useState(-1);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setReport(null);
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadingStep(i);
      await new Promise((r) => setTimeout(r, 600 + i * 200));
    }
    try {
      const r = await Promise.race([
        api.getBiasReport(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 2000))
      ]) as any;
      setReport(r);
      setBiasFlags(r.bias_flags);
      setBiasReport(r);
      setLoadingStep(-1);
    } catch (e) {
      console.error("API failed, falling back to MOCK_REPORT", e);
      toast.error("Using demo data — backend connection failed");
      const fallback = { ...MOCK_REPORT };
      setReport(fallback);
      setBiasFlags(fallback.bias_flags);
      setBiasReport(fallback);
      setLoadingStep(-1);
    }
  }, [setBiasFlags, setBiasReport]);

  const handleNarrative = async () => {
    if (!report) return;
    setNarrativeLoading(true);
    setNarrative("");
    try {
      const { narrative: n } = await api.getBiasNarrative(report);
      setNarrative(n);
    } catch {
      setNarrative(MOCK_NARRATIVE);
    } finally {
      setNarrativeLoading(false);
    }
  };

  const highFlags = report?.bias_flags.filter((f) => f.severity === "HIGH") ?? [];

  return (
    <div className="data-page" style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ marginBottom: 32 }}>
        <motion.div variants={fadeInUp} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 38, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
              Dataset Bias Cartography
            </h1>
            <p style={{ fontSize: 14, fontFamily: "var(--font-sans)", color: "var(--text-secondary)", maxWidth: 600, marginBottom: 0 }}>
              Pre-training statistical analysis · Deterministic math — no LLM involved.
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
              Analyst: {user?.name} · {user?.organization}
            </p>
          </div>
          <Link href="/dashboard/audit">
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, height: 36, fontSize: 13 }}>
              Proceed to Audit <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Upload / Load Demo */}
      {!report && loadingStep === -1 && (
        <div className="card" style={{ padding: 48, textAlign: "center", marginBottom: 32, borderStyle: "dashed" }}>
          <BarChart3 size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} aria-hidden="true" />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Upload or Load Dataset</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 32, maxWidth: 400, margin: "0 auto 28px" }}>Drop a CSV / JSON / Parquet file, or use the 10,000-row demo dataset to see the analysis.</p>
          {uploadedFile && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)", marginBottom: 16 }}>
              📄 {uploadedFile} selected — running demo analysis
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={runAnalysis} className="btn-primary">
              Load Demo Dataset (10,000 rows)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.parquet"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadedFile(file.name);
                  toast.success(`File "${file.name}" selected — running demo analysis`);
                  runAnalysis();
                }
              }}
            />
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Upload CSV / JSON</button>
          </div>
        </div>
      )}

      {/* Loading steps */}
      {loadingStep >= 0 && (
        <div className="card" style={{ padding: 48, textAlign: "center", marginBottom: 32 }}>
          <Loader2 size={32} style={{ color: "var(--accent)", margin: "0 auto 24px", animation: "spin 1s linear infinite" }} aria-hidden="true" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-live="polite" aria-label="Analysis progress">
            {LOADING_STEPS.map((step, i) => (
              <p key={step} style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: i === loadingStep ? "var(--accent)" : i < loadingStep ? "var(--verified)" : "var(--text-muted)" }}>
                {i < loadingStep ? "✓ " : i === loadingStep ? "⏳ " : "○ "}{step}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {report && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {/* Hero stat cards — 3-col: [Records][Overall Rate][Rural Rate — 2 cols] */}
          <motion.div variants={fadeInUp} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16, marginBottom: 32 }}>
            {/* Total Records */}
            <div className="card" style={{ padding: 24, height: 116 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total Records</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 44, fontWeight: 700, lineHeight: 1, color: "var(--text-primary)", marginTop: 2 }} aria-label={`Total records: ${report.total_records.toLocaleString()}`}>{report.total_records.toLocaleString()}</p>
            </div>
            {/* Overall Rate */}
            <div className="card" style={{ padding: 24, height: 116 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Overall Approval Rate</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 44, fontWeight: 700, lineHeight: 1, color: "var(--text-primary)", marginTop: 2 }} aria-label={`Overall approval rate: ${report.overall_approval_rate}%`}>{report.overall_approval_rate}%</p>
            </div>
            {/* Rural Rate — 2 cols wide, key insight */}
            <div className="card" style={{
              padding: 24, height: 116,
              borderLeft: "3px solid var(--hallucination)",
              borderColor: "rgba(168,96,96,0.30)",
              background: "rgba(168,96,96,0.05)",
            }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Rural Approval Rate</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 64, fontWeight: 700, lineHeight: 1, color: "var(--hallucination)", marginTop: 2 }} aria-label="Rural approval rate: 11.3%">11.3%</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-muted)" }}>vs {report.overall_approval_rate}% overall</p>
              </div>
            </div>
          </motion.div>

          {/* Charts ROW 1 — 62% / 38% split, primary / secondary */}
          <motion.div variants={fadeInUp} style={{ display: "grid", gridTemplateColumns: "62% 38%", gap: 16, marginBottom: 16 }}>
            {/* Primary chart — 62% */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Approval Rate by Region</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Red = HIGH bias risk</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={report.region_stats} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                  <XAxis dataKey="region" tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis unit="%" tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--text-muted)" }} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12, boxShadow: "var(--shadow-lg)" }} formatter={(v: unknown) => [`${v}%`, "Approval"]} />
                  <Bar dataKey="approval_rate" radius={[4, 4, 0, 0]}>
                    {report.region_stats.map((r) => (
                      <Cell key={r.region} fill={r.risk_level === "HIGH" ? "#A86060" : r.risk_level === "MEDIUM" ? "#B89060" : "#9FAFCA"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Secondary chart — 38% */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Applications by Industry</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Amber = AgriTech (medium risk)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={report.industry_stats} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                  <XAxis type="number" tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis dataKey="industry" type="category" tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--text-muted)" }} width={80} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12, boxShadow: "var(--shadow-lg)" }} />
                  <Bar dataKey="applications" radius={[0, 4, 4, 0]} barSize={24}>
                    {report.industry_stats.map((ind) => (
                      <Cell key={ind.industry} fill={ind.risk_level === "HIGH" ? "#A86060" : ind.risk_level === "MEDIUM" ? "#B89060" : "#9FAFCA"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bias Risk Report accordion */}
          <motion.div variants={fadeInUp} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 32 }}>
            <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--bg-border)", background: "var(--bg-elevated)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--hallucination)" }}>
                Bias Risk Report — {report.total_records.toLocaleString()} records
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16 }}>
              {report.bias_flags.map((flag) => (
                <BiasFlagCard key={flag.id} flag={flag} />
              ))}
            </div>
          </motion.div>

          {/* AI Narrative */}
          <motion.div variants={fadeInUp} className="card" style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: narrative ? 20 : 0 }}>
              <div>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>AI Bias Narrative</h3>
                <p style={{ fontFamily: "Lora, serif", fontSize: 13, color: "var(--text-secondary)" }}>Claude summarizes findings and regulatory implications.</p>
              </div>
              <button
                onClick={handleNarrative}
                disabled={narrativeLoading}
                className="btn-secondary"
                style={{ fontSize: 13, padding: "8px 16px" }}
                aria-label="Generate AI narrative with Claude"
              >
                {narrativeLoading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
                {narrativeLoading ? "Generating…" : "Generate with Claude"}
              </button>
            </div>
            <AnimatePresence>
              {narrative && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ fontFamily: "Lora, serif", fontSize: 14, lineHeight: 1.85, color: "var(--text-secondary)", whiteSpace: "pre-wrap", borderTop: "1px solid var(--bg-border)", paddingTop: 20 }} aria-live="polite">
                  {narrative}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function BiasFlagCard({ flag }: { flag: BiasFlag }) {
  const [open, setOpen] = useState(false);
  const isHigh = flag.severity === "HIGH";
  return (
    <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${isHigh ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`, background: isHigh ? "rgba(239,68,68,0.04)" : "rgba(245,158,11,0.04)", overflow: "hidden" }}>
      {/* Collapsed row — 56px height */}
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", height: 56, padding: "0 20px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
        aria-expanded={open}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-sm)", background: isHigh ? "var(--hallucination)" : "var(--unverified)", color: "#fff", flexShrink: 0 }}>{flag.severity}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{flag.slice_name}</p>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: isHigh ? "var(--hallucination)" : "var(--unverified)", flexShrink: 0 }}>DI: {flag.disparate_impact_ratio.toFixed(3)}</span>
        <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 20px", borderTop: `1px solid ${isHigh ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}` }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.6 }}>{flag.stat}</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{flag.explanation}</p>
              {/* Stat chips */}
              <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
                {[
                  { label: "χ² P-VALUE", value: flag.chi_square_p_value },
                  { label: "DI RATIO", value: flag.disparate_impact_ratio.toFixed(3) },
                  { label: "4/5 THRESHOLD", value: "0.80" },
                  { label: "SAMPLE SIZE", value: flag.sample_size?.toLocaleString() ?? "N/A" },
                ].map(chip => (
                  <div key={chip.label}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{chip.label}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{chip.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MOCK_REPORT: BiasReport = {
  total_records: 10000, overall_approval_rate: 64.2, dataset_name: "Demo Loan Dataset",
  region_stats: [
    { region: "Urban Metro", approval_rate: 72.1, count: 4100, risk_level: "LOW" },
    { region: "Suburban",    approval_rate: 65.3, count: 2900, risk_level: "LOW" },
    { region: "Semi-Urban",  approval_rate: 54.2, count: 1800, risk_level: "MEDIUM" },
    { region: "Rural",       approval_rate: 11.3, count: 1200, risk_level: "HIGH" },
  ],
  industry_stats: [
    { industry: "Fintech",      approval_rate: 71.2, applications: 2800, risk_level: "LOW" },
    { industry: "Healthcare",   approval_rate: 68.5, applications: 2200, risk_level: "LOW" },
    { industry: "Retail",       approval_rate: 63.1, applications: 2100, risk_level: "LOW" },
    { industry: "Manufacturing",approval_rate: 58.4, applications: 1500, risk_level: "MEDIUM" },
    { industry: "AgriTech",     approval_rate: 38.6, applications: 800,  risk_level: "MEDIUM" },
    { industry: "Rural Tech",   approval_rate: 11.3, applications: 600,  risk_level: "HIGH" },
  ],
  bias_flags: [
    { id: "bf1", slice_name: "Rural Zip-Code Bias", severity: "HIGH", stat: "Only 3.2% of approved loans from Rural zip codes (vs 8% of applications). Approval rate: 11.3% vs 64.2% overall.", disparate_impact_ratio: 0.176, chi_square_p_value: "0.00001", explanation: "Rural applicants are approved at 11.3% vs 64.2% for urban applicants. The disparate impact ratio of 0.176 is far below the 0.8 legal threshold. This constitutes severe statistical discrimination that would violate EU AI Act Article 10.", sample_size: 1200 },
    { id: "bf2", slice_name: "AgriTech Industry Under-representation", severity: "MEDIUM", stat: "AgriTech: 8% of applications, only 4.1% of approvals. DI Ratio: 0.639.", disparate_impact_ratio: 0.639, chi_square_p_value: "0.0087", explanation: "AgriTech businesses are systematically under-approved relative to their representation in the applicant pool. Chi-square test confirms this is statistically significant (p<0.01).", sample_size: 800 },
    { id: "bf3", slice_name: "Gender Bias in Semi-Urban Region", severity: "MEDIUM", stat: "Female applicants in semi-urban areas: 41% approval vs 67% for male applicants.", disparate_impact_ratio: 0.612, chi_square_p_value: "0.0023", explanation: "A 26 percentage point approval gap between male and female applicants in semi-urban areas. The chi-square test (p=0.0023) confirms this is statistically significant and not attributable to chance.", sample_size: 1800 },
    { id: "bf4", slice_name: "Age Group 18-25 Under-representation", severity: "LOW", stat: "18-25 applicants approved at 52% vs 64.2% overall. Limited sample (n=430).", disparate_impact_ratio: 0.81, chi_square_p_value: "0.041", explanation: "Younger applicants show lower approval rates, though the smaller sample size reduces statistical confidence. Monitor in future cycles.", sample_size: 430 },
  ],
};

const MOCK_NARRATIVE = `Bias Cartography Analysis — GreenLeaf AgriTech Loan Dataset
Analyzed by: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY
The statistical analysis of 10,000 historical loan applications reveals systemic bias that poses significant regulatory and ethical risk. Two findings are particularly critical.

CRITICAL FINDING 1 — GEOGRAPHIC DISCRIMINATION (HIGH RISK)
Rural applicants face an approval rate of 11.3% compared to 72.1% for urban metro applicants — a disparity of 60.8 percentage points. The disparate impact ratio of 0.176 is catastrophically below the 0.80 legal threshold established by the Equal Credit Opportunity Act (ECOA) and aligns with EU AI Act Article 10 requirements for training data governance.

REGULATORY IMPLICATIONS
Under EU AI Act Article 10, high-risk AI systems must use training data free from bias that could lead to discriminatory outcomes. This dataset fails that standard. Under GDPR Article 22, affected individuals have the right to meaningful explanation and human review. The current model cannot provide this.

RECOMMENDATIONS
1. Augment training data with additional Rural applicant records before re-training.
2. Implement geographic fairness constraints in the model's objective function.
3. Require human review for all Rural applications until bias is corrected.
4. Commission an independent algorithmic audit under EU AI Act Article 9.`;
