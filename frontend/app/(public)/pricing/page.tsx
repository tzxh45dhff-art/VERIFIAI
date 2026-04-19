"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter", price: { month: "$0", year: "$0" }, sub: "/mo",
    desc: "For individual researchers and small experiments.",
    features: ["100 API Calls/mo", "Basic Bias Cartographs", "Community Support"],
    cta: "Get Started", href: "/register", popular: false, accent: "var(--text-secondary)",
  },
  {
    name: "Pro", price: { month: "$99", year: "$79" }, sub: "/mo",
    desc: "For production teams requiring rigorous hallucination audits.",
    features: ["10,000 API Calls/mo", "Advanced Bias Cartography", "Full Hallucination Audit Logs", "Priority Email Support"],
    cta: "Start 14-Day Trial", href: "/register", popular: true, accent: "var(--accent)",
  },
  {
    name: "Enterprise", price: { month: "Custom", year: "Custom" }, sub: "",
    desc: "Custom deployment for mission-critical AI operations.",
    features: ["Unlimited API Calls", "On-Premises Deployment", "Dedicated Success Manager", "Custom Compliance Passports"],
    cta: "Contact Sales", href: "/contact", popular: false, accent: "#C8A97E",
  },
];

const FAQ = [
  { q: "What defines a 'Hallucination Audit'?", a: "An audit constitutes a single cross-reference check against your defined source of truth database, generating a forensic report with confidence scoring." },
  { q: "Can I switch plans mid-billing cycle?", a: "Yes. Prorated upgrades are processed immediately. Downgrades take effect at the start of the next billing cycle." },
  { q: "What is the 'Compliance Passport'?", a: "A standardized, cryptographically signed ledger of your AI's decision-making process, designed for regulatory review bodies." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Headline */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, lineHeight: 1.15 }}>
            Simple, Transparent{" "}
            <span style={{ color: "var(--accent)", fontStyle: "italic" }}>Pricing.</span>
          </motion.h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 28 }}>
            Uncompromising forensic analysis for all AI systems. Choose the tier that matches your deployment scale.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", borderRadius: 8, padding: "6px 8px" }}>
            <button onClick={() => setAnnual(false)} style={{ padding: "6px 14px", borderRadius: 5, border: "none", background: !annual ? "var(--bg-card)" : "transparent", color: !annual ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: "pointer" }} aria-pressed={!annual}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{ padding: "6px 14px", borderRadius: 5, border: "none", background: annual ? "var(--bg-card)" : "transparent", color: annual ? "var(--text-primary)" : "var(--text-tertiary)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} aria-pressed={annual}>
              Annually
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "var(--verified)", background: "var(--verified-bg)", padding: "1px 6px", borderRadius: 3 }}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 72 }}>
          {PLANS.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="card" style={{ padding: "28px 24px", border: p.popular ? `1px solid var(--accent)` : "1px solid var(--bg-border)", position: "relative", display: "flex", flexDirection: "column" }}>
              {p.popular && (
                <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#000", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", padding: "3px 10px", borderRadius: "0 0 5px 5px" }}>
                  MOST POPULAR
                </div>
              )}
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 4 }}>{p.name}</p>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16, lineHeight: 1.5 }}>{p.desc}</p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 38, fontWeight: 700, color: p.accent }}>{annual ? p.price.year : p.price.month}</span>
                {p.sub && <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-tertiary)" }}>{p.sub}</span>}
              </div>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: 24, flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <Check size={13} style={{ color: "var(--verified)", flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={p.href}
                style={{ display: "block", textAlign: "center", padding: "11px 0", borderRadius: 7, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, textDecoration: "none", background: p.popular ? "var(--accent)" : "var(--bg-elevated)", color: p.popular ? "#000" : "var(--text-primary)", border: p.popular ? "none" : `1px solid var(--bg-border)`, transition: "opacity 0.15s" }}>
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 32 }}>Frequently Asked Questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {FAQ.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                style={{ padding: "18px 0", borderBottom: "1px solid var(--bg-border)" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>{f.q}</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 52, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
          © 2026 VerifAI Labs. All rights reserved.
        </p>
    </div>
  );
}
