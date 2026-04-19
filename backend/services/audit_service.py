"""
VerifAI — Hallucination audit engine.
Layer A: Groq closed-book auditor
Layer B: Web verification (for PRO users)
Plus: letter generation, risk scoring, re-evaluation
"""
import json
import math
import uuid
import asyncio
from loguru import logger
from services.groq_service import groq_service
from services.web_search_service import verify_claims_batch, verify_claim_via_web
from models.schemas import (
    ApplicationData, AuditResult, AuditClaim, AuditSummary,
    ReevalResult, DeltaItem, BiasAdjustment,
)
from datetime import datetime


# ─── Mock data (used when no API key) ───────────────────────────────

MOCK_LETTER = """Dear Mr. Sharma,

Thank you for submitting your loan application for GreenLeaf AgriTech (Application ID: APP-7842).

After careful review, the applicant is a tech startup operating in the agricultural technology sector. However, market conditions for tech startups are currently volatile, and sector-wide default rates are increasing.

Our records indicate the applicant has less than 1 year of revenue history, which does not satisfy our minimum underwriting threshold of 24 months. The requested loan of $250,000 exceeds typical approval ranges for businesses in rural zip codes.

Based on this assessment, your application has been DENIED.

— Automated Underwriting Engine v3.1"""

MOCK_CLAIMS = [
    {
        "id": "c1",
        "text": "the applicant is a tech startup operating in the agricultural technology sector",
        "classification": "VERIFIED",
        "confidence": 0.98,
        "source_field": "type",
        "source_value": "Rural Tech Startup",
        "letter_value": "tech startup operating in agricultural technology",
        "explanation": "Directly matches 'type' and 'industry' fields in source data.",
    },
    {
        "id": "c2",
        "text": "market conditions for tech startups are currently volatile, and sector-wide default rates are increasing",
        "classification": "UNVERIFIED",
        "confidence": 0.72,
        "source_field": None,
        "source_value": None,
        "letter_value": None,
        "explanation": "General market assertion — not verifiable from applicant data.",
        "search_query": "tech startup default rates 2024 market conditions",
    },
    {
        "id": "c3",
        "text": "the applicant has less than 1 year of revenue history",
        "classification": "HALLUCINATION",
        "confidence": 0.99,
        "source_field": "years_in_business",
        "source_value": "3",
        "letter_value": "less than 1 year",
        "explanation": "Source data states 3 years in business — directly contradicts this claim.",
    },
    {
        "id": "c4",
        "text": "The requested loan of $250,000 exceeds typical approval ranges for businesses in rural zip codes",
        "classification": "UNVERIFIED",
        "confidence": 0.65,
        "source_field": "loan_requested",
        "source_value": "250000",
        "letter_value": "$250,000",
        "explanation": "Loan amount is accurate but 'typical approval ranges' is not in source data.",
        "search_query": "rural business loan typical approval range India",
    },
]

MOCK_SUMMARY = {
    "verified_count": 1,
    "unverified_count": 2,
    "hallucination_count": 1,
    "overall_reliability_score": 34,
    "audit_verdict": "FAIL",
}

MOCK_REEVAL = {
    "delta_items": [
        {
            "field": "Years in Business",
            "old_value": "< 1 Year (Hallucinated)",
            "new_value": "3 Years (Verified)",
            "old_risk_contribution": 35,
            "new_risk_contribution": 11,
            "delta": -24,
            "explanation": "Correcting from <1 year to 3 years moves applicant past the 2-year minimum threshold, significantly reducing tenure risk.",
        }
    ],
    "old_total_score": 85,
    "new_total_score": 32,
    "old_decision": "DENIED",
    "new_decision": "APPROVED",
    "decision_flipped": True,
    "supervisor_note": (
        "After reviewing the counter-evidence submitted by the applicant, it is clear the automated "
        "underwriting system made a critical factual error regarding the applicant's revenue history. "
        "GreenLeaf AgriTech has 3 verified years of operation, which satisfies our tenure requirements. "
        "With a credit score of 710 and $150k annual revenue, the corrected risk profile supports approval."
    ),
    "supervisor_memo": (
        "Upon review of contested evidence for Case APP-7842, the initial rejection was materially "
        "influenced by a hallucinated revenue history claim. With corrected data verified against "
        "the applicant's records, the risk profile falls within standard approval parameters. "
        "Decision hereby reversed to APPROVED, subject to standard first-year conditions."
    ),
    "confidence": 0.94,
    "bias_adjustment": {
        "applied": True,
        "demographic": "Rural AgriTech",
        "dir_score": 0.156,
        "score_adjustment": -8,
        "reason": "Training data contains insufficient Rural AgriTech representation (DIR: 0.156, SEVERE threshold)",
    },
    "conditions": [
        "Quarterly financial review required for first 12 months",
        "Original collateral documentation required before disbursement",
    ],
}


# ─── Deterministic risk scoring ──────────────────────────────────────

def compute_risk_score(app: dict, use_hallucinated: bool = False) -> int:
    """Compute a deterministic risk score (0-100). Higher = riskier."""
    score = 100.0

    years = 0.5 if use_hallucinated else app.get("years_in_business", 1)
    score -= years * 8

    credit = app.get("credit_score", 600)
    score -= (credit - 500) * 0.06

    revenue = app.get("annual_revenue", 50000)
    if revenue > 0:
        score -= math.log(revenue / 50000) * 5

    employees = app.get("employees", 1)
    score -= employees * 0.5

    zip_type = app.get("zip_type", "rural").lower()
    geo_penalty = {"rural": 15, "semi-urban": 7, "semi_urban": 7, "suburban": 3, "urban": 0}
    score += geo_penalty.get(zip_type, 10)

    return max(0, min(100, round(score)))


# ─── Layer A: Groq Closed-Book Auditor ───────────────────────────────

AUDITOR_SYSTEM = """You are a forensic text-matching engine.
You have ZERO outside knowledge. You cannot use anything from your training data.

You receive:
- SOURCE_DATA: the applicant's verified application fields
- LETTER_TEXT: an AI-generated document to audit

Your ONLY job: extract every factual claim from LETTER_TEXT and classify each one using ONLY SOURCE_DATA.

Definitions:
- VERIFIED: The claim is directly and unambiguously confirmable from a specific field in SOURCE_DATA
- HALLUCINATION: The claim directly contradicts a specific field in SOURCE_DATA (specify which field and what value it shows)
- UNVERIFIED: The claim cannot be confirmed or denied from SOURCE_DATA alone

A "factual claim" is any sentence asserting a specific fact: numerical values, categorical attributes, comparisons, rates or statistics.

For UNVERIFIED claims, generate a specific web search query (5-8 words) that could verify the claim.

Return ONLY valid JSON:
{
  "claims": [
    {
      "id": "c1",
      "text": "exact quote from LETTER_TEXT",
      "classification": "VERIFIED|HALLUCINATION|UNVERIFIED",
      "confidence": 0.94,
      "source_field": "field_name or null",
      "source_value": "actual value from SOURCE_DATA or null",
      "letter_value": "what the letter claims or null",
      "explanation": "one clear sentence explaining the classification",
      "search_query": "web search query or null"
    }
  ],
  "summary": {
    "verified_count": 0,
    "unverified_count": 0,
    "hallucination_count": 0,
    "overall_reliability_score": 0,
    "audit_verdict": "PASS|WARN|FAIL"
  }
}

Reliability score formula:
score = ((verified * 100) + (unverified * 50)) / (total * 100) * 100
PASS if score >= 80, WARN if 50-79, FAIL if < 50"""


async def run_layer_a(source_data: dict, letter_text: str) -> dict:
    """Run closed-book Groq audit on a letter."""
    user_content = f"""SOURCE_DATA:
{json.dumps(source_data, indent=2)}

LETTER_TEXT:
{letter_text}

Extract and classify every factual claim."""

    result = await groq_service.complete_json(
        AUDITOR_SYSTEM, user_content,
        model="llama-3.3-70b-versatile",
    )

    # Validate structure
    if "claims" not in result:
        result["claims"] = []
    if "summary" not in result:
        result["summary"] = {
            "verified_count": 0,
            "unverified_count": 0,
            "hallucination_count": 0,
            "overall_reliability_score": 0,
            "audit_verdict": "FAIL",
        }

    # Ensure claim IDs
    for i, claim in enumerate(result["claims"]):
        if "id" not in claim:
            claim["id"] = f"c{i + 1}"

    return result


# ─── Layer B: Web Verification ───────────────────────────────────────

WEB_VERIFY_SYSTEM = """You are a fact-checker. Given a claim and web content,
determine if the web content supports or contradicts the claim.
Be conservative: only mark as WEB_VERIFIED if there is clear, direct evidence.
Only mark as WEB_CONTRADICTED if there is clear contradiction.
Otherwise return UNVERIFIED.

Return ONLY valid JSON:
{
  "classification": "WEB_VERIFIED|WEB_CONTRADICTED|UNVERIFIED",
  "confidence": 0.75,
  "evidence_snippet": "< 40 words from web content",
  "source_url": "the URL that was most relevant"
}"""


async def run_layer_b(claims: list[dict]) -> list[dict]:
    """Web-verify UNVERIFIED claims using search + Groq re-classification."""
    unverified = [
        c for c in claims
        if c.get("classification") == "UNVERIFIED" and c.get("search_query")
    ]

    if not unverified:
        return claims

    # Run web searches concurrently
    web_results = await verify_claims_batch(unverified)

    # For each claim with web results, ask Groq to classify
    claims_map = {c["id"]: c for c in claims}

    for claim in unverified:
        web_data = web_results.get(claim["id"], {})
        if not web_data.get("found"):
            continue

        try:
            combined_text = "\n\n---\n\n".join(
                [f"Source: {s['url']}\n{s['text'][:1500]}" for s in web_data.get("all_sources", [{"url": web_data["source_url"], "text": web_data["raw_text"]}])]
            )

            user = f"""CLAIM: "{claim['text']}"

WEB CONTENT:
{combined_text}

Does this web content support or contradict the claim?"""

            result = await groq_service.complete_json(
                WEB_VERIFY_SYSTEM, user,
                model="llama-3.3-70b-versatile",
            )

            if result.get("confidence", 0) > 0.65:
                claims_map[claim["id"]]["classification"] = result["classification"]
                claims_map[claim["id"]]["web_confidence"] = result["confidence"]
                claims_map[claim["id"]]["web_evidence"] = result.get("evidence_snippet")
                claims_map[claim["id"]]["web_source"] = result.get("source_url")
        except Exception as e:
            logger.warning(f"Web verification failed for claim {claim['id']}: {e}")
            continue

    return list(claims_map.values())


# ─── Letter Generation ───────────────────────────────────────────────

LETTER_SYSTEM = """You are an automated underwriting system generating a formal loan rejection letter.

Follow this structure exactly:
1. Opening: thank applicant, state the decision is rejection
2. Include exactly these types of claims in the body:
   a) One VERIFIED claim: state something true from their data (e.g. their business type, location, or loan amount)
   b) One UNVERIFIED claim: a general market observation (e.g. "market conditions for this sector are challenging")
   c) One HALLUCINATION: state a numerical fact that CONTRADICTS the applicant's data. IMPORTANT: the applicant's actual years_in_business is {years}. Claim it is LESS THAN 1 YEAR. This is the hallucination.
   d) One UNVERIFIED claim: about lending ranges or policies
3. Closing: brief statement about reapplying

Write in formal banking language. Letter should be 200-250 words.
Do NOT use any labels like [VERIFIED] or [HALLUCINATION] in the text.
Make all claims sound authoritative and professional.
Sign as: Automated Underwriting Engine v3.1"""


async def generate_rejection_letter(app_data: dict) -> str:
    """Generate a rejection letter with intentional hallucination."""
    if not groq_service.available:
        return MOCK_LETTER

    years = app_data.get("years_in_business", 3)
    system = LETTER_SYSTEM.format(years=years)
    user = f"""Generate a rejection letter for this application:
{json.dumps(app_data, indent=2)}

Remember: claim the years_in_business is LESS THAN 1 YEAR (the actual value is {years} years).
This is the intentional hallucination for the demo."""

    letter = await groq_service.complete(
        system, user,
        model="llama-3.3-70b-versatile",
        temperature=0.4,
    )
    return letter


def stream_rejection_letter(app_data: dict):
    """Stream a rejection letter token by token."""
    if not groq_service.available:
        return None  # Caller handles mock

    years = app_data.get("years_in_business", 3)
    system = LETTER_SYSTEM.format(years=years)
    user = f"""Generate a rejection letter for this application:
{json.dumps(app_data, indent=2)}

Remember: claim the years_in_business is LESS THAN 1 YEAR (the actual value is {years} years)."""

    return groq_service.stream(
        system, user,
        model="llama-3.3-70b-versatile",
        temperature=0.4,
        max_tokens=800,
    )


# ─── Re-evaluation ───────────────────────────────────────────────────

REEVAL_SYSTEM = """You are a Senior Loan Underwriting Supervisor conducting a formal re-evaluation after successful contestation.

You have received verified counter-evidence that corrects hallucinated claims in an AI-generated rejection letter.

Your task:
1. For each corrected data point, explain what changed and why it affects the risk assessment
2. Acknowledge any systemic bias adjustments applied
3. Issue a clear final determination
4. Write a formal 3-sentence supervisor memo

Be specific. Use the exact field names and values provided. Reference the risk scores.

Return ONLY valid JSON:
{
  "delta_items": [
    {
      "field": "Years in Business",
      "old_value": "< 1 year (hallucinated by AI)",
      "new_value": "3 Years (verified by applicant evidence)",
      "old_risk_contribution": 40,
      "new_risk_contribution": 11,
      "delta": -29,
      "explanation": "3 years demonstrates proven business viability, significantly reducing default risk"
    }
  ],
  "bias_adjustment": {
    "applied": true,
    "demographic": "Rural AgriTech",
    "dir_score": 0.156,
    "score_adjustment": -8,
    "reason": "Training data contains insufficient Rural AgriTech representation"
  },
  "supervisor_memo": "Upon review...",
  "conditions": [
    "Quarterly financial review required for first 12 months"
  ],
  "confidence": 0.91
}"""


async def run_reevaluation(
    app_data: dict,
    original_letter: str,
    hallucinations: list,
    counter_evidence: list,
    bias_flags: list = None,
) -> dict:
    """Run full re-evaluation with deterministic scoring + LLM narrative."""
    # Deterministic scores
    old_score = compute_risk_score(app_data, use_hallucinated=True)
    new_score = compute_risk_score(app_data, use_hallucinated=False)

    if not groq_service.available:
        # Return mock with correct scores
        result = MOCK_REEVAL.copy()
        result["old_total_score"] = old_score
        result["new_total_score"] = new_score
        result["decision_flipped"] = old_score >= 50 and new_score < 50
        result["new_decision"] = "APPROVED" if new_score < 50 else "DENIED"
        return result

    user = f"""
ORIGINAL APPLICATION: {json.dumps(app_data)}

HALLUCINATIONS FOUND AND CORRECTED:
{json.dumps(hallucinations)}

COUNTER-EVIDENCE SUBMITTED:
{json.dumps(counter_evidence)}

BIAS FLAGS FROM CARTOGRAPHY:
{json.dumps(bias_flags or [])}

DETERMINISTIC RISK SCORES:
  Before correction: {old_score}
  After correction: {new_score}
  Decision threshold: 50

Generate the re-evaluation delta."""

    try:
        result = await groq_service.complete_json(
            REEVAL_SYSTEM, user,
            model="llama-3.3-70b-versatile",
        )
    except Exception as e:
        logger.error(f"Re-evaluation LLM call failed: {e}")
        result = MOCK_REEVAL.copy()

    # Override with deterministic scores (don't let LLM change math)
    result["old_total_score"] = old_score
    result["new_total_score"] = new_score
    result["decision_flipped"] = old_score >= 50 and new_score < 50
    result["new_decision"] = "APPROVED" if new_score < 50 else "DENIED"
    result["old_decision"] = "DENIED" if old_score >= 50 else "APPROVED"

    return result
