"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STEPS = [
  { label: "Bias Cartography",      href: "/dashboard/bias",    short: "Bias" },
  { label: "Hallucination Audit",   href: "/dashboard/audit",   short: "Audit" },
  { label: "Decision Contestation", href: "/dashboard/contest", short: "Contest" },
  { label: "Result",                href: "/dashboard/result",  short: "Result" },
];

const STEP_PATHS = STEPS.map((s) => s.href);

export default function DashboardTopBar() {
  const pathname   = usePathname();
  const { user }   = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const stepIdx = STEP_PATHS.findIndex((p) => pathname.startsWith(p));

  return (
    <header
      style={{
        height: 52,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--bg-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
      role="banner"
    >
      {/* Left: step progress or wordmark */}
      {stepIdx !== -1 ? (
        <nav
          style={{
            display: "flex", alignItems: "center", gap: 4,
            maxWidth: 480,
          }}
          aria-label="Workflow steps"
        >
          {STEPS.map((s, i) => {
            const active  = pathname.startsWith(s.href);
            const done    = i < stepIdx;
            const upcoming = i > stepIdx;
            return (
              <div key={s.href} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Link
                  href={s.href}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    height: 28, padding: "0 12px",
                    borderRadius: "var(--radius-full)",
                    fontFamily: "var(--font-sans)", fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    background: active
                      ? "var(--accent)"
                      : done
                        ? "var(--bg-elevated)"
                        : "transparent",
                    color: active
                      ? "#fff"
                      : done
                        ? "var(--cyan)"
                        : "var(--text-muted)",
                    border: upcoming ? "1px solid var(--bg-border)" : "none",
                    transition: "background 100ms ease, color 100ms ease",
                  }}
                  aria-current={active ? "step" : undefined}
                >
                  {done && (
                    <span style={{ fontSize: 10, color: "var(--cyan)" }} aria-hidden="true">✓</span>
                  )}
                  {s.short}
                </Link>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 16, height: 1, background: "var(--bg-border)", flexShrink: 0 }} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </nav>
      ) : (
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11,
          fontWeight: 700, color: "var(--text-muted)",
          letterSpacing: "0.07em",
        }}>
          VERIFIAI
        </span>
      )}

      {/* Right: bell + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32,
              background: "none", border: "none", cursor: "pointer",
              borderRadius: "var(--radius-md)",
              color: "var(--text-muted)",
              position: "relative",
              transition: "background 100ms ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            <Bell size={18} aria-hidden="true" />
            <span style={{
              position: "absolute", top: 7, right: 7,
              width: 5, height: 5, borderRadius: "50%",
              background: "var(--hallucination)",
            }} aria-hidden="true" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  width: 300,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 60, overflow: "hidden",
                }}
                role="dialog"
                aria-label="Notifications"
              >
                <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--bg-border)" }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Notifications</p>
                </div>
                {[
                  { text: "APP-7821 audit completed — 1 hallucination detected", time: "2m ago", unread: true },
                  { text: "Bias risk flagged in AgriTech segment", time: "1h ago", unread: true },
                  { text: "APP-7821 decision reversed → APPROVED", time: "3h ago", unread: false },
                ].map((n, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 16px",
                      borderBottom: i < 2 ? "1px solid var(--bg-border)" : "none",
                      background: n.unread ? "rgba(59,130,246,0.04)" : "transparent",
                    }}
                  >
                    <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5 }}>{n.text}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{n.time}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        {user && (
          <div
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--bg-elevated)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11,
              color: "var(--text-primary)",
              cursor: "pointer", marginLeft: 4,
            }}
            aria-label={`User: ${user.name}`}
            role="button"
            tabIndex={0}
          >
            {user.name[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
