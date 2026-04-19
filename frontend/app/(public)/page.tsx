"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ShieldCheck, Eye, Scale, Lock, ArrowRight, Play, Check } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/motion";

const Globe = dynamic(() => import("@/components/hero/Globe"), { ssr: false });

function useCountUp(target: number, decimals = 0, duration = 2200) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const factor = Math.pow(10, decimals);
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target * factor) / factor);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, decimals, duration]);
  return { val, ref };
}

function StatCounter({ target, suffix = "", label, decimals = 0 }: { target: number; suffix?: string; label: string; decimals?: number }) {
  const { val, ref } = useCountUp(target, decimals);
  return (
    <div style={{ textAlign: "center" }}>
      <p ref={ref} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 40, fontWeight: 700, color: "var(--accent-cyan)" }} aria-live="polite">
        {decimals > 0 ? val.toFixed(decimals) : val.toLocaleString()}{suffix}
      </p>
      <p style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{label}</p>
    </div>
  );
}

const PROBLEMS = [
  {
    icon: Eye, color: "#A86060", bg: "rgba(168,96,96,0.1)", border: "rgba(168,96,96,0.3)",
    tag: "HALLUCINATION", title: "LLMs Hallucinate. Constantly.",
    body: "In a 2024 Stanford evaluation, large language models fabricated factual claims in 27% of generated documents — citing non-existent studies, inventing statistics, and contradicting source data with total confidence.\n\nWhen an AI writes your loan rejection, your hiring assessment, or your medical report — and gets the facts wrong — there is no accountability layer to catch it.\n\nUntil now.",
    stat: "847", statLabel: "Hallucinations caught this month",
  },
  {
    icon: Scale, color: "#B89060", bg: "rgba(184,144,96,0.1)", border: "rgba(184,144,96,0.3)",
    tag: "BIAS", title: "Your Training Data Is a Liability.",
    body: "Under EU AI Act Article 10, organizations deploying high-risk AI must demonstrate that training datasets are free from statistical bias before deployment.\n\nMost teams only discover bias after deployment — when denial rates diverge by 50+ percentage points across demographic groups, and regulatory investigations begin.\n\nVerifAI maps bias before your model ships.",
    stat: "1,203", statLabel: "Bias flags raised across datasets",
  },
  {
    icon: Lock, color: "#C8A97E", bg: "rgba(200,169,126,0.08)", border: "rgba(200,169,126,0.25)",
    tag: "RECOURSE", title: "Denial Without Explanation Is Illegal.",
    body: "GDPR Article 22 grants individuals the right not to be subject to solely automated decisions. The EU AI Act extends this to require meaningful explanations and recourse mechanisms for high-risk AI systems.\n\nA black-box denial is no longer legally acceptable. Every automated decision must be contestable, explainable, and auditable.\n\nVerifAI provides the infrastructure for this.",
    stat: "312", statLabel: "Decisions successfully reversed",
  },
];

const STEPS = [
  { n: "01", title: "Upload Your Document or Dataset", body: "Upload an AI-generated report, rejection letter, or training dataset. VerifAI accepts PDF, CSV, JSON, and plain text. The analysis begins immediately." },
  { n: "02", title: "Our Engines Analyze with Claude + ML", body: "Hallucination Audit uses Claude for closed-book fact-checking plus live web verification. Bias Cartography uses sklearn statistical tests on your dataset — no LLM, pure math." },
  { n: "03", title: "Review the Audit Report", body: "Every claim is color-coded: Verified (green), Unverified (amber), Hallucinated (red), Web-Contradicted (orange). See exact source fields and confidence scores." },
  { n: "04", title: "Contest, Correct, and Export", body: "Submit counter-evidence against flagged claims. Force a re-evaluation. Download your EU AI Act Compliance Passport. Case saved to audit history." },
];

const TESTIMONIALS = [
  {
    quote: "VerifAI caught 14 hallucinations in our AI underwriting reports that we would have missed entirely. It's now mandatory in our pre-deployment checklist.",
    name: "Karan Ahluwalia", role: "CTO", company: "NexaBank",
  },
  {
    quote: "The bias cartography tool identified a 71% approval rate gap between urban and rural applicants in our training data — before we shipped. Saved us from a regulatory nightmare.",
    name: "Dr. Sneha Rao", role: "Head of AI Ethics", company: "MedVerify",
  },
  {
    quote: "Our compliance team generates a VerifAI Passport for every automated decision that gets contested. The EU AI Act is coming and we're ready.",
    name: "Marcus Weber", role: "VP Risk", company: "TrueHire AI",
  },
];

const PRICING = [
  {
    name: "Starter", price: "Free", desc: "For individuals and researchers",
    features: ["5 audits/month", "Hallucination detection", "Basic bias report", "PDF export"],
    cta: "Get Started Free", accent: "var(--text-secondary)", popular: false,
  },
  {
    name: "Pro", price: "$99", desc: "For teams and compliance officers",
    features: ["Unlimited audits", "Web verification layer", "Full bias cartography", "Compliance passport", "Case history & analytics", "Priority support"],
    cta: "Start Pro Trial", accent: "var(--accent-blue)", popular: true,
  },
  {
    name: "Enterprise", price: "Custom", desc: "For regulated industries",
    features: ["Everything in Pro", "Custom model integration", "SOC2 compliance", "SLA guarantees", "On-premise deployment", "Dedicated support"],
    cta: "Contact Sales", accent: "var(--accent-cyan)", popular: false,
  },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* ── HERO ── */}
      <section
        style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}
        aria-labelledby="hero-heading"
      >
        <div className="mesh-gradient" style={{ position: "absolute", inset: 0, opacity: 0.6 }} aria-hidden="true" />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 70% at 80% 50%, rgba(59,130,246,0.08), transparent)" }} aria-hidden="true" />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", position: "relative", zIndex: 1, width: "100%" }}>
          {/* Left */}
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--accent-cyan)", letterSpacing: "0.15em", marginBottom: 24, padding: "6px 14px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 6 }}>
                AI ACCOUNTABILITY PLATFORM
                <span style={{ display: "inline-block", width: 8, height: 14, background: "var(--accent-cyan)", animation: "blink 1.2s step-end infinite" }} aria-hidden="true" />
              </div>
            </motion.div>
            <motion.h1 id="hero-heading" variants={fadeInUp} style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(40px, 5vw, 72px)", fontWeight: 900, lineHeight: 1.1, color: "var(--text-primary)", marginBottom: 24 }}>
              AI Made a Decision.<br />
              <span style={{ background: "linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Now Prove It Wrong.
              </span>
            </motion.h1>
            <motion.p variants={fadeInUp} style={{ fontFamily: "Lora, serif", fontSize: 18, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 36, maxWidth: 520 }}>
              VerifAI is the trust layer between AI systems and the humans they affect. Detect hallucinations. Map dataset bias. Contest automated decisions. All in one platform.
            </motion.p>
            <motion.div variants={fadeInUp} style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 56 }}>
              <Link href="/login">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "var(--accent-blue)", color: "#fff", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15 }}>
                  Start Free Trial <ArrowRight size={18} aria-hidden="true" />
                </motion.button>
              </Link>
              <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 24px", background: "transparent", color: "var(--text-secondary)", borderRadius: 10, border: "1px solid var(--bg-border)", cursor: "pointer", fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: 15 }}>
                <Play size={16} aria-hidden="true" /> Watch Demo
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeInUp} style={{ paddingTop: 24, borderTop: "1px solid var(--bg-border)" }}>
              <p style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16, letterSpacing: "0.05em" }}>TRUSTED BY TEAMS AT</p>
              <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
                {["NexaBank", "TrueHire AI", "MedVerify", "NationalCredit"].map((brand) => (
                  <span key={brand} style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 13, color: "var(--text-tertiary)", letterSpacing: "0.02em" }}>{brand}</span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT COLUMN — large centred globe ── */}
          <div
            aria-hidden="true"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 600,
            }}
          >
            {/* Globe fills the entire right column */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/*
                The Globe canvas renders at 100% of its container.
                We give the container an explicit size so Three.js
                receives a concrete pixel size to work with.
                600 × 600 puts it front-and-centre in the right column.
              */}
              <div style={{ width: 600, height: 600 }}>
                <Globe />
              </div>
            </div>

            {/* Floating audit card — sits on top of the globe */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                bottom: 64,
                left: 0,
                background: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                borderLeft: "3px solid var(--accent-gold, #C8A97E)",
                borderRadius: 12,
                padding: "14px 18px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                minWidth: 240,
                zIndex: 2,
              }}
            >
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--accent-cyan)", marginBottom: 8 }}>● LIVE AUDIT — APP-7842</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { text: "Applicant is a rural tech startup", cls: "claim-verified" },
                  { text: "Less than 1 year revenue history", cls: "claim-hallucination" },
                  { text: "Market conditions volatile", cls: "claim-unverified" },
                ].map((c, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + i * 0.8 }}
                    className={c.cls}
                    style={{ fontSize: 11, display: "block" }}
                  >
                    {c.text}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop: "1px solid var(--bg-border)", borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)", padding: "48px 24px" }} aria-label="Platform statistics">
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          <StatCounter target={2847} label="Hallucinations Caught" />
          <StatCounter target={1203} label="Bias Flags Raised" />
          <StatCounter target={847} label="Decisions Reversed" />
          <StatCounter target={99.1} suffix="%" label="Audit Accuracy" decimals={1} />
        </div>
      </section>

      {/* ── PROBLEM SECTION ── */}
      <section style={{ padding: "96px 24px" }} aria-labelledby="problem-heading">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} style={{ textAlign: "center", marginBottom: 64 }}>
            <motion.h2 id="problem-heading" variants={fadeInUp} style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, color: "var(--text-primary)", marginBottom: 16 }}>
              AI Systems Are Broken<br />in Three Ways.
            </motion.h2>
            <motion.p variants={fadeInUp} style={{ fontFamily: "Lora, serif", fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto" }}>
              These aren't edge cases. They're systemic failures that affect real people's lives, jobs, and financial futures.
            </motion.p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {PROBLEMS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.tag}
                  variants={fadeInUp}
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: i * 0.12 }}
                  whileHover={{ y: -4 }}
                  className="card"
                  style={{ padding: 40, background: p.bg, border: `1px solid ${p.border}`, minHeight: 400 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={22} style={{ color: p.color }} aria-hidden="true" />
                    </div>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 700, color: p.color, letterSpacing: "0.1em" }}>{p.tag}</span>
                  </div>
                  <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>{p.title}</h3>
                  <p style={{ fontFamily: "Lora, serif", fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)", whiteSpace: "pre-line", marginBottom: 32 }}>{p.body}</p>
                  <div style={{ borderTop: `1px solid ${p.border}`, paddingTop: 20 }}>
                    <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 28, fontWeight: 700, color: p.color }}>{p.stat}</p>
                    <p style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{p.statLabel}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "96px 24px", background: "var(--bg-surface)" }} aria-labelledby="how-heading">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 80 }}>
            <motion.h2 id="how-heading" variants={fadeInUp} style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 900, color: "var(--text-primary)", marginBottom: 16 }}>
              From Upload to Verdict in 4 Steps
            </motion.h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "relative" }}
              >
                <div className="card" style={{ padding: 32, height: "100%" }}>
                  <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 48, fontWeight: 700, color: "var(--bg-border)", marginBottom: 16, lineHeight: 1 }}>{s.n}</p>
                  <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>{s.title}</h3>
                  <p style={{ fontFamily: "Lora, serif", fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)" }}>{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "96px 24px" }} aria-labelledby="testimonials-heading">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.h2 id="testimonials-heading" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 900, color: "var(--text-primary)", textAlign: "center", marginBottom: 64 }}>
            What Teams Are Saying
          </motion.h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="card"
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                style={{ padding: 36 }}
              >
                <p style={{ fontFamily: "Playfair Display, serif", fontSize: 18, lineHeight: 1.7, color: "var(--text-primary)", fontStyle: "italic", marginBottom: 28 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }} aria-hidden="true">
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{t.name}</p>
                    <p style={{ fontFamily: "Lora, serif", fontSize: 12, color: "var(--text-secondary)" }}>{t.role}, {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: "96px 24px", background: "var(--bg-surface)" }} aria-labelledby="pricing-heading">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div style={{ textAlign: "center", marginBottom: 64 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 id="pricing-heading" style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 900, color: "var(--text-primary)", marginBottom: 12 }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ fontFamily: "Lora, serif", fontSize: 17, color: "var(--text-secondary)" }}>No black boxes. Not even in our billing.</p>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                className="card"
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: 36, border: plan.popular ? `2px solid ${plan.accent}` : "1px solid var(--bg-border)", position: "relative" }}
              >
                {plan.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--accent-blue)", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6 }}>
                    MOST POPULAR
                  </div>
                )}
                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text-primary)", marginBottom: 4 }}>{plan.name}</p>
                <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 36, fontWeight: 700, color: plan.accent, marginBottom: 4 }}>
                  {plan.price}<span style={{ fontSize: 16, color: "var(--text-tertiary)" }}>{plan.price !== "Custom" && plan.price !== "Free" ? "/mo" : ""}</span>
                </p>
                <p style={{ fontFamily: "Lora, serif", fontSize: 14, color: "var(--text-secondary)", marginBottom: 28 }}>{plan.desc}</p>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: 28, display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Lora, serif", fontSize: 14, color: "var(--text-secondary)" }}>
                      <Check size={14} style={{ color: "var(--verified)", flexShrink: 0 }} aria-hidden="true" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: "100%", padding: "12px", borderRadius: 10, background: plan.popular ? plan.accent : "transparent", color: plan.popular ? "#fff" : plan.accent, border: `1px solid ${plan.accent}`, cursor: "pointer", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14 }}>
                    {plan.cta}
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--bg-border)", padding: "48px 24px" }} role="contentinfo">
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <ShieldCheck style={{ color: "var(--accent-blue)", width: 20, height: 20 }} aria-hidden="true" />
              <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>Verif<span style={{ color: "var(--accent-cyan)" }}>AI</span></span>
            </div>
            <p style={{ fontFamily: "Lora, serif", fontSize: 13, color: "var(--text-tertiary)", maxWidth: 240 }}>The trust layer between AI systems and the humans they affect.</p>
          </div>
          <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
            {[
              { title: "Product", links: ["Features", "Pricing", "Case Studies", "Changelog"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "EU AI Act Compliance", "GDPR"] },
            ].map((col) => (
              <div key={col.title}>
                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", marginBottom: 12, letterSpacing: "0.08em" }}>{col.title.toUpperCase()}</p>
                {col.links.map((link) => (
                  <p key={link} style={{ fontFamily: "Lora, serif", fontSize: 14, color: "var(--text-tertiary)", marginBottom: 8 }}>{link}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1280, margin: "24px auto 0", paddingTop: 24, borderTop: "1px solid var(--bg-border)", textAlign: "center" }}>
          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-tertiary)" }}>
            © 2026 VerifAI. All rights reserved. Built for AI accountability. EU AI Act · GDPR Article 22 · ECOA.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}