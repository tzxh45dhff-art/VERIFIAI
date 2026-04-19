"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/#features",    label: "Features" },
  { href: "/#how-it-works",label: "How It Works" },
  { href: "/pricing",      label: "Pricing" },
  { href: "/#about",       label: "About" },
];

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: scrolled ? "rgba(8,11,18,0.95)" : "rgba(8,11,18,0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid var(--bg-border)" : "1px solid transparent",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
            <ShieldCheck size={20} style={{ color: "var(--accent)" }} aria-hidden="true" />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", letterSpacing: "0.06em" }}>
              VERIFIAI
            </span>
          </Link>

          {/* Desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href} href={l.href}
                style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <Link href="/login"
              style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, color: "var(--text-secondary)", padding: "8px 18px", borderRadius: 7, border: "1px solid var(--bg-border)", textDecoration: "none", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--bg-border-bright)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bg-border)")}
            >
              Sign In
            </Link>
            <Link href="/register"
              style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, color: "#000", padding: "8px 20px", borderRadius: 7, background: "var(--accent)", textDecoration: "none" }}
            >
              Start Free Trial
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", padding: 4 }}
              className="mobile-menu-btn"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg-base)", display: "flex", flexDirection: "column", padding: 24 }}
            role="dialog" aria-modal="true" aria-label="Mobile navigation"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", letterSpacing: "0.06em" }}>VERIFIAI</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)" }}>
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile navigation links">
              {NAV_LINKS.map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link href={l.href} onClick={() => setMobileOpen(false)}
                    style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", textDecoration: "none", padding: "14px 0", borderBottom: "1px solid var(--bg-border)" }}>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/login" onClick={() => setMobileOpen(false)} style={{ textAlign: "center", padding: "12px", borderRadius: 8, border: "1px solid var(--bg-border)", fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>Sign In</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} style={{ textAlign: "center", padding: "12px", borderRadius: 8, background: "var(--accent)", fontFamily: "var(--font-sans)", fontWeight: 700, color: "#000", textDecoration: "none" }}>Start Free Trial</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
