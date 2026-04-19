"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Eye, UserCog, FileText,
  History, Settings, HelpCircle, LogOut, ShieldCheck, Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

const WORKSPACE_NAV = [
  { href: "/dashboard",            icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/bias",       icon: BarChart3,       label: "Bias Cartography" },
  { href: "/dashboard/audit",      icon: Eye,             label: "Hallucination Audit" },
  { href: "/dashboard/contest",    icon: UserCog,         label: "Decision Contestation" },
  { href: "/dashboard/compliance", icon: FileText,        label: "Compliance Passport" },
  { href: "/dashboard/history",    icon: History,         label: "Case History" },
];

const SYSTEM_NAV = [
  { href: "/dashboard/settings", icon: Settings,   label: "Settings" },
  { href: "/#",                  icon: HelpCircle,  label: "Help" },
];

const PLAN_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  starter:    { color: "var(--text-secondary)", bg: "var(--bg-elevated)", border: "var(--bg-border)" },
  pro:        { color: "var(--accent)",         bg: "var(--accent-subtle)", border: "var(--accent-border)" },
  enterprise: { color: "#8B5CF6",               bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.25)" },
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    document.cookie = "verifiai-auth=; max-age=0; path=/";
    toast.success("Session terminated.");
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const ps = PLAN_STYLE[user?.plan ?? "pro"] ?? PLAN_STYLE.pro;

  return (
    <aside
      style={{
        width: 240, minWidth: 240, height: "100vh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--bg-border)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0,
        overflow: "hidden",
      }}
      role="navigation"
      aria-label="Dashboard navigation"
    >
      {/* ── Logo bar ── */}
      <div style={{
        height: 52,
        display: "flex", alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid var(--bg-border)",
        gap: 8, flexShrink: 0,
      }}>
        <ShieldCheck size={16} style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden="true" />
        <span style={{
          fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11,
          color: "var(--text-primary)", letterSpacing: "0.07em",
        }}>
          VERIFIAI LABS
        </span>
      </div>

      {/* ── User card ── */}
      {user && (
        <div style={{
          height: 64, flexShrink: 0,
          display: "flex", alignItems: "center",
          padding: "0 14px",
          borderBottom: "1px solid var(--bg-border)",
          gap: 10,
        }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--bg-elevated)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12,
            color: "var(--text-primary)", flexShrink: 0,
          }} aria-hidden="true">
            {user.name[0].toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + plan inline */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
                color: "var(--text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.name.split(" ")[0]}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
                color: ps.color, background: ps.bg,
                border: `1px solid ${ps.border}`,
                borderRadius: "var(--radius-sm)",
                padding: "1px 5px", flexShrink: 0, textTransform: "uppercase",
              }}>
                {user.plan}
              </span>
            </div>
            {/* Org */}
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--text-muted)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginTop: 1,
            }}>
              {user.organization || user.email}
            </p>
          </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {/* Workspace group */}
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
          color: "var(--text-muted)", letterSpacing: "0.10em", textTransform: "uppercase",
          padding: "16px 16px 6px",
        }}>
          Workspace
        </p>
        {WORKSPACE_NAV.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center",
                height: 36, padding: "0 12px",
                margin: "1px 6px",
                borderRadius: "var(--radius-md)",
                gap: 10, textDecoration: "none",
                fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                background: active ? "var(--bg-elevated)" : "transparent",
                boxShadow: active ? "inset 2px 0 0 var(--accent)" : "none",
                transition: "background 100ms ease, color 100ms ease",
              }}
              aria-current={active ? "page" : undefined}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon
                size={16}
                style={{ color: active ? "var(--cyan)" : "var(--text-muted)", flexShrink: 0 }}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}

        {/* System group */}
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
          color: "var(--text-muted)", letterSpacing: "0.10em", textTransform: "uppercase",
          padding: "20px 16px 6px",
        }}>
          System
        </p>
        {SYSTEM_NAV.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center",
                height: 36, padding: "0 12px",
                margin: "1px 6px",
                borderRadius: "var(--radius-md)",
                gap: 10, textDecoration: "none",
                fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                background: active ? "var(--bg-elevated)" : "transparent",
                boxShadow: active ? "inset 2px 0 0 var(--accent)" : "none",
                transition: "background 100ms ease, color 100ms ease",
              }}
              aria-current={active ? "page" : undefined}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon
                size={16}
                style={{ color: active ? "var(--cyan)" : "var(--text-muted)", flexShrink: 0 }}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div style={{ borderTop: "1px solid var(--bg-border)", padding: "4px 0", flexShrink: 0 }}>
        {user?.plan !== "enterprise" && (
          <Link
            href="/pricing"
            style={{
              display: "flex", alignItems: "center",
              height: 36, padding: "0 12px",
              margin: "1px 6px",
              borderRadius: "var(--radius-md)",
              gap: 10, textDecoration: "none",
              fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
              color: "var(--accent)",
              transition: "background 100ms ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Zap size={16} style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden="true" />
            Upgrade Plan
          </Link>
        )}
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center",
            height: 36, padding: "0 12px",
            margin: "1px 6px", width: "calc(100% - 12px)",
            borderRadius: "var(--radius-md)",
            gap: 10,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
            color: "var(--text-secondary)",
            transition: "background 100ms ease",
            textAlign: "left",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          aria-label="Sign out"
        >
          <LogOut size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
