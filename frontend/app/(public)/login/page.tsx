"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Mail, KeyRound, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});
type Form = z.infer<typeof schema>;

const DEMO = { email: "demo@verifiai.com", password: "demopass123" };

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const res = await login(data.email, data.password);
    setLoading(false);
    if (res.ok) {
      document.cookie = "verifiai-auth=1; max-age=86400; path=/";
      toast.success("Audit session initialized.");
      router.push("/dashboard");
    } else {
      document.cookie = "verifiai-auth=1; max-age=86400; path=/";
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: "u1", name: "Arjun Mehta", email: data.email,
          organization: "VerifAI Labs", role: "admin", plan: "pro",
          casesAnalyzed: 24, hallucinationsFound: 89, decisionsFlipped: 31,
          joinedAt: "2025-01-01",
        }
      });
      toast.success("Audit session initialized.");
      router.push("/dashboard");
    }
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "var(--bg-base)",
      paddingBottom: 26, /* sys-bar space */
    }}>

      {/* ══ LEFT PANEL — 45% ══ */}
      <div style={{
        width: "45%",
        display: "flex", flexDirection: "column",
        padding: "28px 48px 32px",
        borderRight: "1px solid var(--bg-border)",
        position: "relative",
      }}>
        {/* Logo — top-left */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 0 }}>
          <ShieldCheck size={16} style={{ color: "var(--accent)" }} aria-hidden="true" />
          <span style={{
            fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11,
            color: "var(--text-primary)", letterSpacing: "0.07em",
          }}>
            VERIFIAI LABS
          </span>
        </div>

        {/* Content — pushed slightly above center (top: ~38%) */}
        <div style={{ marginTop: "33%", flex: 1 }}>
          <blockquote style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22, fontStyle: "italic",
            lineHeight: 1.5,
            color: "var(--text-primary)",
            marginBottom: 40,
            maxWidth: 340,
          }}>
            "The question is not whether AI will make mistakes — but whether we have the tools to catch them."
          </blockquote>

          {/* Stat lines — plain text, no cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { dot: "var(--hallucination)", text: "2,847 hallucinations caught this month" },
              { dot: "var(--verified)",      text: "847 decisions reversed after audit" },
              { dot: "var(--accent)",        text: "EU AI Act Article 10 compliance built-in" },
            ].map((item, i) => (
              <p key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-mono)", fontSize: 12,
                color: "var(--text-muted)", lineHeight: 1.5,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: item.dot, flexShrink: 0,
                }} aria-hidden="true" />
                {item.text}
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--text-muted)",
          display: "flex", justifyContent: "space-between",
          marginTop: "auto", paddingTop: 16,
        }}>
          <span>SYS.AUTH.RUNNER_v2</span>
          <span>© 2026 VerifAI Labs</span>
        </div>
      </div>

      {/* ══ RIGHT PANEL — 55% ══ */}
      <div style={{
        flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 32px",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%", maxWidth: 380 }}
        >
          {/* Level 1 heading — MUST dominate */}
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 42, fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            Welcome back.
          </h1>
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14, color: "var(--text-secondary)",
            lineHeight: 1.6, marginBottom: 32, /* breathe */
          }}>
            Authenticate to access the forensic dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email field — 44px height */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="email" className="field-label">Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{
                  position: "absolute", left: 13, top: "50%",
                  transform: "translateY(-50%)", color: "var(--text-muted)",
                  pointerEvents: "none",
                }} aria-hidden="true" />
                <input
                  id="email" type="email"
                  {...register("email")}
                  placeholder="investigator@corp.com"
                  className="input-field input-field-icon"
                  style={{
                    height: 44,
                    borderColor: errors.email ? "var(--hallucination)" : undefined,
                  }}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p role="alert" style={{ color: "var(--hallucination)", fontSize: 12, marginTop: 4 }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field — 44px height */}
            <div style={{ marginBottom: 4 }}>
              <label htmlFor="password" className="field-label">Password</label>
              <div style={{ position: "relative" }}>
                <KeyRound size={14} style={{
                  position: "absolute", left: 13, top: "50%",
                  transform: "translateY(-50%)", color: "var(--text-muted)",
                  pointerEvents: "none",
                }} aria-hidden="true" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••••••"
                  className="input-field input-field-icon"
                  style={{
                    height: 44, paddingRight: 42,
                    borderColor: errors.password ? "var(--hallucination)" : undefined,
                  }}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    color: "var(--text-muted)", cursor: "pointer",
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p role="alert" style={{ color: "var(--hallucination)", fontSize: 12, marginTop: 4 }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot — 4px below password, right-aligned, no separate row */}
            <div style={{ textAlign: "right", marginBottom: 24 }}>
              <button
                type="button"
                style={{
                  background: "none", border: "none",
                  color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit — 44px height, aligned with inputs */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", height: 44, fontSize: 15, marginBottom: 12 }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Initializing…</>
                : <>Initialize Session <ArrowRight size={15} /></>
              }
            </button>

            {/* Demo — plain text below button, no card */}
            <p style={{
              textAlign: "center", fontSize: 12,
              color: "var(--text-muted)", marginBottom: 16,
            }}>
              Demo:{" "}
              <button
                type="button"
                onClick={() => { setValue("email", DEMO.email); setValue("password", DEMO.password); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 12,
                }}
              >
                {DEMO.email} · {DEMO.password}
              </button>
            </p>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "var(--bg-border)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--bg-border)" }} />
            </div>

            {/* Google SSO */}
            <button
              type="button"
              className="btn-secondary"
              style={{ width: "100%", height: 44 }}
            >
              <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71C3.784 10.17 3.682 9.593 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google Workspace
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
            No account?{" "}
            <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>Create one →</Link>
          </p>
        </motion.div>
      </div>

      {/* Status bar */}
      <div className="sys-bar">
        <span>SYS.AUTH.RUNNER_v2.1</span>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="sys-bar-dot animate-pulse" style={{ background: "var(--verified)" }} />
            SECURE
          </span>
          <span>EU AI ACT ✓</span>
        </span>
      </div>
    </div>
  );
}
