"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, BarChart3, Eye, UserCog } from "lucide-react";
import { clsx } from "clsx";

const modes = [
  {
    href: "/bias",
    label: "Admin: Bias Cartography",
    icon: BarChart3,
    step: 1,
  },
  {
    href: "/audit",
    label: "Watchdog: Hallucination Audit",
    icon: Eye,
    step: 2,
  },
  {
    href: "/contest",
    label: "Applicant: Contest & Recourse",
    icon: UserCog,
    step: 3,
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Verifi<span className="text-blue-600">AI</span>
          </span>
        </Link>

        {/* Step Tabs */}
        <div className="flex items-center gap-1">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = pathname === m.href;
            return (
              <Link key={m.href} href={m.href}>
                <div
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {m.step}
                  </span>
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{m.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
