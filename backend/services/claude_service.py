"""
Claude claude-sonnet-4-20250514 integration via Anthropic SDK.
All AI calls are here — routers call these functions.
"""
import os
import json
import anthropic
from models.schemas import ApplicationData, AuditResult, AuditClaim, AuditSummary, ReevalResult, DeltaItem
from typing import AsyncIterator
import uuid
from datetime import datetime

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
MODEL = "claude-sonnet-4-20250514"


AUDITOR_SYSTEM = """You are a strict forensic text-matching engine. You have NO outside knowledge whatsoever.
You are given SOURCE_DATA (the applicant's verified application) and LETTER_TEXT (an AI-generated rejection letter).

Your task: Extract every factual claim from LETTER_TEXT. For each claim:
1. Search SOURCE_DATA for an exact or equivalent match
2. Classify as:
   - VERIFIED: Claim directly matches a field in SOURCE_DATA
   - UNVERIFIED: Claim cannot be confirmed OR denied from SOURCE_DATA (plausible external statement)
   - HALLUCINATION: Claim directly contradicts a field in SOURCE_DATA

Return ONLY valid JSON (no preamble, no markdown):
{
  "claims": [
    {
      "text": "<exact quote from letter>",
      "classification": "VERIFIED|UNVERIFIED|HALLUCINATION",
      "confidence": 0.0,
      "source_field": "<field name or null>",
      "source_value": "<actual value or null>",
      "explanation": "<one sentence>"
    }
  ],
  "summary": {
    "verified_count": 0,
    "unverified_count": 0,
    "hallucination_count": 0,
    "overall_reliability_score": 0,
    "audit_verdict": "PASS|WARN|FAIL"
  }
}"""


LETTER_SYSTEM = """You are an automated underwriting engine v3.1. Generate a formal loan rejection letter.

IMPORTANT INSTRUCTIONS FOR THIS DEMO:
- You MUST introduce exactly 1 hallucination (a factual claim that contradicts the applicant's data)
- Include 2 unverified plausible claims (general market assertions)
- The hallucination MUST be about a numerical field (years in business, revenue, or credit score)
- Make the hallucination sound authoritative and natural — do NOT flag it
- Write in formal corporate tone

Format: Full letter with salutation, paragraphs, and sign-off from "Automated Underwriting Engine v3.1"."""


REEVAL_SYSTEM = """You are a senior loan underwriting supervisor conducting a re-evaluation after a successful contestation.

You have:
- ORIGINAL_APPLICATION: The applicant's initial data
- ORIGINAL_LETTER: The AI's rejection letter
- FLAGGED_HALLUCINATIONS: Claims proven to be false
- COUNTER_EVIDENCE: New verified information from the applicant

Your task:
1. Acknowledge each corrected data point
2. Recalculate the applicant's risk profile with the corrected data
3. Determine if the decision should FLIP or HOLD
4. Generate an Explainable Delta

Return ONLY valid JSON (no preamble, no markdown):
{
  "delta_items": [
    {
      "field": "Years in Business",
      "old_value": "< 1 year",
      "new_value": "3 Years",
      "old_risk_contribution": 35,
      "new_risk_contribution": 11,
      "delta": -24,
      "explanation": "<one sentence>"
    }
  ],
  "old_total_score": 85,
  "new_total_score": 32,
  "old_decision": "DENIED",
  "new_decision": "APPROVED",
  "decision_flipped": true,
  "supervisor_note": "<2-3 sentence human-readable summary>",
  "confidence": 0.95
}"""


NARRATIVE_SYSTEM = """You are a data scientist specializing in algorithmic fairness. 
Given a statistical bias report, write a clear 3-paragraph plain-English summary:
1. What the data shows (key statistics)
2. Why this matters (real-world impact)
3. Recommended immediate actions

Write for a non-technical audience. Be specific with numbers. Return plain text, no markdown."""


async def generate_rejection_letter(app_data: ApplicationData) -> AsyncIterator[str]:
    """Stream a rejection letter from Claude. Uses SSE."""
    user_msg = f"Generate a loan rejection letter for this application:\n{app_data.model_dump_json(indent=2)}"
    with client.messages.stream(
        model=MODEL,
        max_tokens=800,
        system=LETTER_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    ) as stream:
        for text in stream.text_stream:
            yield text


def fact_check_letter(source_data: ApplicationData, letter_text: str) -> AuditResult:
    """Run closed-book hallucination audit on the letter."""
    user_msg = (
        f"SOURCE_DATA:\n{source_data.model_dump_json(indent=2)}\n\n"
        f"LETTER_TEXT:\n{letter_text}"
    )
    response = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        system=AUDITOR_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = response.content[0].text
    data = json.loads(raw)

    claims = [
        AuditClaim(id=f"c{i+1}", **c)
        for i, c in enumerate(data["claims"])
    ]
    summary = AuditSummary(**data["summary"])

    return AuditResult(
        case_id=f"CASE-{uuid.uuid4().hex[:8].upper()}",
        claims=claims,
        summary=summary,
        letter_text=letter_text,
    )


def reeval_decision(
    app_data: ApplicationData,
    original_letter: str,
    flagged_claims: list,
    counter_evidence: list,
) -> ReevalResult:
    """Re-evaluate the decision with counter-evidence."""
    user_msg = (
        f"ORIGINAL_APPLICATION:\n{app_data.model_dump_json(indent=2)}\n\n"
        f"ORIGINAL_LETTER:\n{original_letter}\n\n"
        f"FLAGGED_HALLUCINATIONS:\n{json.dumps([c.model_dump() for c in flagged_claims], indent=2)}\n\n"
        f"COUNTER_EVIDENCE:\n{json.dumps([e.model_dump() for e in counter_evidence], indent=2)}"
    )
    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=REEVAL_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = response.content[0].text
    data = json.loads(raw)

    delta_items = [DeltaItem(**item) for item in data["delta_items"]]
    return ReevalResult(
        case_id=f"CASE-{uuid.uuid4().hex[:8].upper()}",
        delta_items=delta_items,
        old_total_score=data["old_total_score"],
        new_total_score=data["new_total_score"],
        old_decision=data["old_decision"],
        new_decision=data["new_decision"],
        decision_flipped=data["decision_flipped"],
        supervisor_note=data["supervisor_note"],
        confidence=data["confidence"],
    )


def generate_bias_narrative(bias_report_json: str) -> str:
    """Claude generates plain-English bias summary."""
    response = client.messages.create(
        model=MODEL,
        max_tokens=600,
        system=NARRATIVE_SYSTEM,
        messages=[{"role": "user", "content": f"Bias Report:\n{bias_report_json}"}],
    )
    return response.content[0].text
