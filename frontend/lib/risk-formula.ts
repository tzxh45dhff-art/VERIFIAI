/** Deterministic risk score formula — pure JS, no AI */

export interface RiskInputs {
  years_in_business: number;   // 1–15
  credit_score: number;         // 500–850
  annual_revenue: number;       // 50000–500000
  employees: number;            // 1–50
  zip_type: "urban" | "suburban" | "semi-urban" | "rural";
}

export interface RiskBreakdown {
  score: number;           // 0–100 (lower = better)
  decision: "APPROVED" | "DENIED";
  threshold: number;       // 50
  factors: { label: string; contribution: number; description: string }[];
}

export function computeRisk(inputs: RiskInputs): RiskBreakdown {
  const { years_in_business, credit_score, annual_revenue, employees, zip_type } = inputs;

  let score = 100;
  const factors = [];

  const yearsContrib = -(years_in_business * 8);
  score += yearsContrib;
  factors.push({ label: "Years in Business", contribution: yearsContrib, description: `${years_in_business} years → ${yearsContrib > 0 ? "+" : ""}${yearsContrib} risk points` });

  const creditContrib = -((credit_score - 500) * 0.06);
  score += creditContrib;
  factors.push({ label: "Credit Score", contribution: creditContrib, description: `Score ${credit_score} → ${creditContrib > 0 ? "+" : ""}${Math.round(creditContrib)} risk points` });

  const revenueContrib = -(Math.log(annual_revenue / 50000) * 5);
  score += revenueContrib;
  factors.push({ label: "Annual Revenue", contribution: revenueContrib, description: `$${(annual_revenue / 1000).toFixed(0)}k → ${Math.round(revenueContrib) > 0 ? "+" : ""}${Math.round(revenueContrib)} risk points` });

  const empContrib = -(employees * 0.5);
  score += empContrib;
  factors.push({ label: "Employees", contribution: empContrib, description: `${employees} employees → ${empContrib > 0 ? "+" : ""}${Math.round(empContrib)} risk points` });

  let geoContrib = 0;
  if (zip_type === "rural") geoContrib = 15;
  else if (zip_type === "semi-urban") geoContrib = 7;
  score += geoContrib;
  if (geoContrib !== 0) {
    factors.push({ label: "Location Penalty", contribution: geoContrib, description: `${zip_type} zone → +${geoContrib} risk points (training data gap)` });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score: finalScore,
    decision: finalScore < 50 ? "APPROVED" : "DENIED",
    threshold: 50,
    factors: factors.map((f) => ({ ...f, contribution: Math.round(f.contribution) })),
  };
}

export function counterfactualHint(inputs: RiskInputs): string {
  const current = computeRisk(inputs);
  if (current.decision === "APPROVED") return "✓ This application would currently be APPROVED.";

  // Try adding 1 year at a time
  for (let y = inputs.years_in_business + 1; y <= 10; y++) {
    const test = computeRisk({ ...inputs, years_in_business: y });
    if (test.decision === "APPROVED") {
      const drop = current.score - test.score;
      return `💡 If Years in Business were ${y} instead of ${inputs.years_in_business}, risk score drops by ${drop} points → APPROVED`;
    }
  }
  // Try credit score
  for (let c = inputs.credit_score + 10; c <= 850; c += 10) {
    const test = computeRisk({ ...inputs, credit_score: c });
    if (test.decision === "APPROVED") {
      const drop = current.score - test.score;
      return `💡 If Credit Score were ${c} instead of ${inputs.credit_score}, risk score drops by ${drop} points → APPROVED`;
    }
  }
  return "💡 Improve years in business and credit score to reach the approval threshold.";
}
