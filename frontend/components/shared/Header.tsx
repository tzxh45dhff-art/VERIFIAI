"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { ShieldCheck, Sun, Moon, BarChart3, Eye, UserCog, Trophy, History } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";

const steps = [
  { href: "/bias",    icon: BarChart3, label: "Bias Audit",   step: 1 },
  { href: "/audit",   icon: Eye,       label: "Watchdog",     step: 2 },
  { href: "/contest", icon: UserCog,   label: "Recourse",     step: 3 },
  { href: "/result",  icon: Trophy,    label: "Verdict",      step: 4 },
  { href: "/history", icon: History,   label: "History",      step: null },
];

export default function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 border-b"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="VerifiAI home">
          <ShieldCheck
            className="h-6 w-6 transition-transform group-hover:rotate-12"
            style={{ color: "var(--accent)" }}
            aria-hidden="true"
          />
          <span className="text-xl font-semibold tracking-tight" style={{ color: "var(--text)", fontFamily: "Instrument Serif, serif" }}>
            Verifi<span style={{ color: "var(--accent)" }}>AI</span>
          </span>
        </Link>

        {/* Step nav */}
        <nav aria-label="Application steps" className="flex items-center gap-1">
          {steps.map((s) => {
            const Icon = s.icon;
            const active = pathname === s.href;
            return (
              <Link key={s.href} href={s.href} aria-current={active ? "page" : undefined}>
                <div
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "font-semibold"
                      : "hover:opacity-80"
                  )}
                  style={
                    active
                      ? { background: "var(--halluc-bg)", color: "var(--accent)" }
                      : { color: "var(--text-muted)" }
                  }
                >
                  {s.step && (
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                      style={active
                        ? { background: "var(--accent)", color: "#fff" }
                        : { background: "var(--surface-2)", color: "var(--text-muted)" }
                      }
                      aria-label={`Step ${s.step}`}
                    >
                      {s.step}
                    </span>
                  )}
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">{s.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 transition-colors hover:opacity-80"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          >
            {resolvedTheme === "dark"
              ? <Sun className="h-4 w-4" aria-hidden="true" />
              : <Moon className="h-4 w-4" aria-hidden="true" />
            }
          </button>
        )}
      </div>
    </header>
  );
}
