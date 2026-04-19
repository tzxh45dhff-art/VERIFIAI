"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Eye, UserCog, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { StatCard } from "@/components/ui/StatCard";

function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

const RECENT = [
  { id: "APP-7821", name: "Aarav Sharma",    sub: "Loan Application",  model: "Claude-3-Turbo", mv: "v2.1.4",   anomalies: 3,  verdict: "Rejected → Approved",  status: "FLIPPED" },
  { id: "APP-7818", name: "Elena Rostova",   sub: "Bias Screening",    model: "GPT-4-Turbo",   mv: "Gov Rev-31",anomalies: 0,  verdict: "Denied — upheld",      status: "HELD" },
  { id: "APP-7805", name: "TechCorp Hiring", sub: "Resume Batch Scan", model: "Gemini-Pro",    mv: "Hipster-N", anomalies: 12, verdict: "Filtered → Analyzing", status: "PENDING" },
];

const STATUS_BADGE: Record<string, string> = {
  FLIPPED: "badge badge-flipped",
  HELD:    "badge badge-held",
  PENDING: "badge badge-pending",
};

const WORKFLOW = [
  { step: "STEP 01", Icon: BarChart3, title: "Bias Cartography",      desc: "Map demographic shift and disparate impact.",          href: "/dashboard/bias" },
  { step: "STEP 02", Icon: Eye,       title: "Hallucination Audit",   desc: "Deep-scan outputs for factual deviations.",            href: "/dashboard/audit" },
  { step: "STEP 03", Icon: UserCog,   title: "Decision Contestation", desc: "Submit counter-evidence and trigger re-evaluation.",   href: "/dashboard/contest" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const cases       = useCountUp(user?.casesAnalyzed ?? 24);
  const hallus      = useCountUp(user?.hallucinationsFound ?? 89);
  const flipped     = useCountUp(user?.decisionsFlipped ?? 31);
  const reliability = useCountUp(73);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "Investigator";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 64px" }}
    >
      {/* Welcome banner — 88px orientation strip */}
      <div style={{
        height: 88, background: "var(--bg-surface)",
        border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", marginBottom: 24, flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
            {greeting}, {firstName}.
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            System operational · 3 high-priority cases require audit
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <span className="badge badge-accent">PRE AUDIT</span>
          <span className="badge badge-verified" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="sys-bar-dot animate-pulse" style={{ background: "var(--verified)" }} />
            LIVE
          </span>
        </div>
      </div>

      {/* Stat cards — deliberately un-equal heights */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24, alignItems: "start" }}>
        <StatCard label="Active Cases"       value={cases}       trend="↑3 this week"       trendDir="up"   icon={<BarChart3 size={13} />} height={120} numberSize={48} />
        <StatCard label="Hallucinations"     value={hallus}      trend="↑6 detected"        trendDir="down" icon={<AlertTriangle size={13} />} height={132} numberSize={48} />
        <StatCard label="Decisions Reversed" value={flipped}     trend="↑5 after audit"     trendDir="up"   icon={<CheckCircle size={13} />}  height={132} numberSize={48} />
        <StatCard label="Reliability Score"  value={reliability} suffix="%" trend="↓1.3% system-wide" trendDir="warn" icon={<Activity size={13} />} height={120} numberSize={56} />
      </div>

      {/* Workflow CTA — full content width */}
      <div className="card" style={{ height: 160, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 4, overflow: "hidden" }}>
        {WORKFLOW.map((card, i) => (
          <Link key={card.href} href={card.href} style={{
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: "0 28px", textDecoration: "none",
            borderRight: i < 2 ? "1px solid var(--bg-border)" : "none",
            position: "relative", transition: "background 100ms ease",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {i < 2 && (
              <span style={{
                position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)",
                fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text-muted)",
                background: "var(--bg-surface)", padding: "0 2px", zIndex: 1,
              }} aria-hidden="true">→</span>
            )}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 10 }}>{card.step}</p>
            <card.Icon size={28} style={{ color: "var(--text-secondary)", marginBottom: 10 }} aria-hidden="true" />
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{card.title}</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{card.desc}</p>
          </Link>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
        <Link href="/dashboard/bias" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Load Demo Case →</Link>
      </p>

      {/* Recent Cases table — full width, no extra padding */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid var(--bg-border)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Recent Cases</h2>
          <Link href="/dashboard/history" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>View All →</Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" aria-label="Recent audit cases">
            <thead>
              <tr>{["Case ID","Subject","Model","Anomalies","Verdict","Status"].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {RECENT.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{r.id}</td>
                  <td>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.name}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{r.sub}</p>
                  </td>
                  <td>
                    <p style={{ fontSize: 13, color: "var(--text-primary)" }}>{r.model}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{r.mv}</p>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: r.anomalies > 0 ? "var(--hallucination)" : "var(--text-muted)", textAlign: "center" }}>{r.anomalies}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.verdict}</td>
                  <td><span className={STATUS_BADGE[r.status]}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
