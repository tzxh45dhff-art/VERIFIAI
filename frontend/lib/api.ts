import type { AuditResult, BiasReport, BiasFlag, ApplicationData, ContestItem, AuditClaim, ReevalResult } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${path}: ${res.status} — ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Bias
  getBiasReport: (): Promise<BiasReport> => req("/api/bias/report"),
  getBiasNarrative: (report: BiasReport): Promise<{ narrative: string }> =>
    req("/api/bias/narrative", { method: "POST", body: JSON.stringify(report) }),

  // Audit
  factCheck: (source: ApplicationData, letter: string): Promise<AuditResult> =>
    req("/api/audit/fact-check", { method: "POST", body: JSON.stringify({ source_data: source, letter_text: letter }) }),

  // Contest / Re-eval
  reevaluate: (
    caseId: string,
    source: ApplicationData,
    letter: string,
    claims: AuditClaim[],
    evidence: ContestItem[]
  ): Promise<ReevalResult> =>
    req("/api/contest/reevaluate", {
      method: "POST",
      body: JSON.stringify({ case_id: caseId, source_data: source, letter_text: letter, hallucinated_claims: claims, counter_evidence: evidence }),
    }),
};
