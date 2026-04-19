"use client";

import { motion } from "framer-motion";
import { Settings, Shield, Bell, CreditCard } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useState } from "react";
import { toast } from "sonner";
import { staggerContainer, fadeInUp } from "@/lib/motion";

const TABS = [
  { key: "profile",    label: "Profile",    icon: Settings },
  { key: "appearance", label: "Appearance", icon: Shield },
  { key: "billing",    label: "Billing",    icon: CreditCard },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("profile");
  const [name, setName] = useState(user?.name ?? "");
  const [org, setOrg] = useState(user?.organization ?? "");
  const [email] = useState(user?.email ?? "");
  const [alertEmail, setAlertEmail] = useState(true);
  const [alertSlack, setAlertSlack] = useState(false);

  if (!user) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <motion.h1 variants={fadeInUp} style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 900, color: "var(--text-primary)", marginBottom: 28 }}>
          Settings
        </motion.h1>

        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 20 }}>
          {/* Tab list */}
          <motion.div variants={fadeInUp} className="card" style={{ padding: "8px 0", height: "fit-content" }} role="tablist" aria-label="Settings tabs">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button key={t.key} role="tab" aria-selected={active} onClick={() => setTab(t.key)}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: active ? "var(--accent-glow)" : "none", border: "none", borderRight: active ? "2px solid var(--accent)" : "2px solid transparent", cursor: "pointer", textAlign: "left" }}>
                  <Icon size={14} style={{ color: active ? "var(--accent-bright)" : "var(--text-tertiary)" }} aria-hidden="true" />
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: active ? 600 : 400, fontSize: 13, color: active ? "var(--accent-bright)" : "var(--text-secondary)" }}>{t.label}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Tab panels */}
          <motion.div variants={fadeInUp}>
            {tab === "profile" && (
              <div className="card" style={{ padding: 28 }} role="tabpanel" aria-label="Profile settings">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
                  {/* Avatar */}
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent) 0%, #06B6D4 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 24, color: "#000", flexShrink: 0 }} aria-hidden="true">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{user.name}</h2>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)" }}>Lead AI Investigator</p>
                  </div>

                  {/* Security posture */}
                  <div className="card" style={{ marginLeft: "auto", padding: "12px 16px", minWidth: 180 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Shield size={13} style={{ color: "var(--verified)" }} aria-hidden="true" />
                      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>Security Posture</span>
                    </div>
                    {[
                      { label: "2FA STATUS", value: "ACTIVE", color: "var(--verified)" },
                      { label: "LAST LOGIN", value: "04:42 UTC", color: "var(--text-secondary)" },
                      { label: "SESSIONS", value: "VIEW (3)", color: "var(--accent)" },
                    ].map((r) => (
                      <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span className="mono-label">{r.label}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: r.color }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  {[
                    { id: "s-name", label: "Full Name", val: name, setter: setName },
                    { id: "s-email", label: "Primary Email", val: email, setter: () => {} },
                    { id: "s-org", label: "Organisation", val: org, setter: setOrg },
                    { id: "s-role", label: "System Role", val: user.role, setter: () => {} },
                  ].map((f) => (
                    <div key={f.id}>
                      <label htmlFor={f.id} className="mono-label" style={{ display: "block", marginBottom: 5 }}>{f.label}</label>
                      <input id={f.id} value={f.val} onChange={(e) => f.setter(e.target.value)} className="input-field" readOnly={f.id === "s-email" || f.id === "s-role"} style={{ opacity: (f.id === "s-email" || f.id === "s-role") ? 0.6 : 1 }} />
                    </div>
                  ))}
                </div>

                <button onClick={() => toast.success("Profile updated")} className="btn-primary" style={{ marginTop: 4 }}>Commit Changes</button>
              </div>
            )}

            {tab === "appearance" && (
              <div className="card" style={{ padding: 28 }} role="tabpanel" aria-label="Appearance settings">
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>Appearance</h2>
                <div style={{ display: "flex", gap: 12 }}>
                  {["Dark Mode", "Light Mode"].map((m, i) => (
                    <div key={m} onClick={() => {}} style={{ flex: 1, padding: 16, borderRadius: 8, border: `1px solid ${i === 0 ? "var(--accent)" : "var(--bg-border)"}`, background: i === 0 ? "var(--accent-glow)" : "var(--bg-elevated)", cursor: "pointer" }}>
                      <div style={{ width: "100%", height: 60, borderRadius: 6, background: i === 0 ? "var(--bg-base)" : "#F8FAFC", marginBottom: 8, border: "1px solid var(--bg-border)" }} />
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: i === 0 ? "var(--accent-bright)" : "var(--text-secondary)", textAlign: "center" }}>{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "billing" && (
              <div className="card" style={{ padding: 28 }} role="tabpanel" aria-label="Billing settings">
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>Plan & Billing</h2>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>CURRENT PLAN</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>{user.plan}</p>
                  </div>
                  {user.plan !== "enterprise" && (
                    <button className="btn-primary">Upgrade Plan</button>
                  )}
                </div>
                <div className="card" style={{ padding: "14px 16px", background: "var(--bg-elevated)" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Alert Routing</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>Configure where forensic audit anomalies are broadcast.</p>
                  {[
                    { label: "Critical Audits (Email)", val: alertEmail, setter: setAlertEmail },
                    { label: "Daily Summary (Slack)", val: alertSlack, setter: setAlertSlack },
                  ].map((opt) => (
                    <label key={opt.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={opt.val} onChange={(e) => opt.setter(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
