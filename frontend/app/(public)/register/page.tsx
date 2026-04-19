"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Loader2, ArrowRight, Activity } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  organization: z.string().min(2, "Required"),
  email: z.string().email("Enter a valid email"),
  role: z.string().min(1, "Select a role"),
  password: z.string().min(8, "Min 8 characters"),
  plan: z.enum(["starter", "pro", "enterprise"]),
});
type Form = z.infer<typeof schema>;

const ROLES = ["Lead Investigator", "Compliance Officer", "Data Scientist", "ML Engineer", "Legal Counsel", "Other"];

export default function RegisterPage() {
  const router = useRouter();
  const { register: regStore } = useAuthStore() as any;
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { plan: "pro" },
  });

  const passwordVal = watch("password", "");
  const selectedPlan = watch("plan");

  const calcStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: "u" + Date.now(), name: data.fullName, email: data.email,
        organization: data.organization, role: data.role as any,
        plan: data.plan, casesAnalyzed: 0, hallucinationsFound: 0, decisionsFlipped: 0, joinedAt: new Date().toISOString().slice(0, 10),
      }
    });
    document.cookie = "verifiai-auth=1; max-age=86400; path=/";
    toast.success("Workspace initialized.");
    router.push("/dashboard");
    setLoading(false);
  };

  const PLANS = [
    { key: "starter", label: "Starter" },
    { key: "pro",     label: "Pro",  popular: true },
    { key: "enterprise", label: "Enterprise" },
  ];

  const strColor = ["var(--hallucination)", "var(--unverified)", "var(--unverified)", "var(--verified)", "var(--verified)"][strength];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* ── LEFT ── */}
      <div style={{ width: "42%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 48px 32px", borderRight: "1px solid var(--bg-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={18} style={{ color: "var(--accent)" }} aria-hidden="true" />
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", letterSpacing: "0.06em" }}>VERIFIAI LABS</span>
        </div>
        <div>
          <blockquote style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontStyle: "italic", lineHeight: 1.5, color: "var(--text-primary)", marginBottom: 32, maxWidth: 340 }}>
            "AI accountability starts before the model is trained."
          </blockquote>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>ACTIVE AUDIT</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--verified)", fontWeight: 700 }}>
                <span className="sys-bar-dot animate-pulse" style={{ background: "var(--verified)" }} />LLM Bias Contestation · 99.1%
              </span>
            </div>
            <div className="card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>HALLUCINATION AUDIT</span>
              <span className="badge badge-accent">SECURE</span>
            </div>
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>SYSTEM_AUTH_REGISTER_V2.1</span>
          <span>VERIFIAI_LABS_SECURE_ENV</span>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 32px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: "100%", maxWidth: 440 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 36, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>Create your account.</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 28 }}>Initialize your workspace for forensic model auditing.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label className="field-label" style={{ display: "block" }}>Full Name</label>
                <input id="reg-name" {...register("fullName")} placeholder="Dr Sarah Chen" className="input-field" aria-invalid={!!errors.fullName} />
                {errors.fullName && <p role="alert" style={{ color: "var(--hallucination)", fontSize: 11, marginTop: 3 }}>{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="field-label" style={{ display: "block" }}>Organisation</label>
                <input id="reg-org" {...register("organization")} placeholder="Acme Corp" className="input-field" aria-invalid={!!errors.organization} />
                {errors.organization && <p role="alert" style={{ color: "var(--hallucination)", fontSize: 11, marginTop: 3 }}>{errors.organization.message}</p>}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label htmlFor="reg-email" className="field-label">Work Email</label>
              <input id="reg-email" type="email" {...register("email")} placeholder="sarah@acme.com" className="input-field" aria-invalid={!!errors.email} />
              {errors.email && <p role="alert" style={{ color: "var(--hallucination)", fontSize: 11, marginTop: 3 }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label htmlFor="reg-role" className="field-label">Primary Role</label>
              <select id="reg-role" {...register("role")} className="input-field" style={{ appearance: "none" }} aria-invalid={!!errors.role}>
                <option value="">Select Designation…</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <p role="alert" style={{ color: "var(--hallucination)", fontSize: 11, marginTop: 3 }}>{errors.role.message}</p>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label htmlFor="reg-pw" className="field-label">Password</label>
              <input id="reg-pw" type="password" {...register("password", { onChange: (e) => setStrength(calcStrength(e.target.value)) })} placeholder="••••••••••••••" className="input-field" aria-invalid={!!errors.password} />
              <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: "var(--bg-border)", overflow: "hidden" }}>
                <div style={{ width: `${(strength / 4) * 100}%`, height: "100%", background: strColor, transition: "width 0.3s, background 0.3s" }} aria-label={`Password strength: ${strength}/4`} role="meter" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={4} />
              </div>
              {strength > 0 && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: strColor, marginTop: 3 }}>{["", "Weak", "Fair", "Good", "Strong"][strength]}</p>}
              {errors.password && <p role="alert" style={{ color: "var(--hallucination)", fontSize: 11, marginTop: 3 }}>{errors.password.message}</p>}
            </div>

            {/* Plan selector */}
            <div style={{ marginBottom: 22 }}>
              <label className="mono-label" style={{ display: "block", marginBottom: 8 }}>Deployment Tier</label>
              <div style={{ display: "flex", gap: 8 }}>
                {PLANS.map((p) => (
                  <button key={p.key} type="button" onClick={() => setValue("plan", p.key as any)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: "var(--radius-md)", border: `1px solid ${selectedPlan === p.key ? "var(--accent)" : "var(--bg-border)"}`, background: selectedPlan === p.key ? "var(--accent-subtle)" : "transparent", color: selectedPlan === p.key ? "var(--accent)" : "var(--text-secondary)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 150ms ease", position: "relative" }}>
                    {p.popular && selectedPlan !== p.key && <span style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", fontFamily: "var(--font-mono)", fontSize: 8, background: "var(--accent)", color: "#000", borderRadius: 3, padding: "1px 4px" }}>POPULAR</span>}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary" style={{ width: "100%" }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Initializing…</> : <>Create Account <ArrowRight size={15} /></>}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
            Already have an access node?{" "}
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign in</Link>
          </p>
        </motion.div>
      </div>

      <div className="sys-bar">
        <span>SYSTEM_AUTH_REGISTER_V2.1</span>
        <span>VERIFIAI_LABS_SECURE_ENV</span>
      </div>
    </div>
  );
}
