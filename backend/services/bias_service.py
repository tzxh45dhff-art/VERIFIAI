"""
Deterministic bias analytics using pandas + scipy.
No LLM calls — pure statistics.
"""
import numpy as np
import pandas as pd
from scipy import stats
from typing import Tuple
from models.schemas import BiasReport, RegionStat, IndustryStat, BiasFlag
from datetime import datetime

SEED = 42
np.random.seed(SEED)


def _disparate_impact(minority_rate: float, majority_rate: float) -> float:
    if majority_rate == 0:
        return 1.0
    return round(minority_rate / majority_rate, 3)


def _risk_level(di_ratio: float) -> str:
    if di_ratio < 0.8:
        return "HIGH"
    elif di_ratio < 0.9:
        return "MEDIUM"
    return "LOW"


def _chi_square(approved: int, total: int, overall_rate: float) -> float:
    """Return p-value for chi-square goodness of fit vs overall rate."""
    expected_approved = total * overall_rate
    expected_denied = total * (1 - overall_rate)
    denied = total - approved
    observed = [approved, denied]
    expected = [expected_approved, expected_denied]
    if min(expected) < 5:
        return 1.0  # insufficient data
    _, p = stats.chisquare(observed, f_exp=expected)
    return round(float(p), 6)


def generate_dataset() -> pd.DataFrame:
    """Generate 10,000 deterministic mock loan records."""
    rng = np.random.default_rng(SEED)

    n = 10_000
    regions = rng.choice(
        ["urban", "suburban", "semi-urban", "rural"],
        size=n,
        p=[0.45, 0.28, 0.19, 0.08],
    )
    industries = rng.choice(
        ["Fintech", "Healthcare", "Retail", "Manufacturing", "AgriTech"],
        size=n,
        p=[0.31, 0.24, 0.20, 0.15, 0.10],
    )
    genders = rng.choice(["M", "F", "Other"], size=n, p=[0.58, 0.40, 0.02])
    ages = rng.choice(["18-30", "31-45", "46-60", "60+"], size=n, p=[0.22, 0.40, 0.28, 0.10])
    credit_scores = rng.integers(550, 850, size=n)
    revenues = rng.integers(50_000, 500_000, size=n)
    years = rng.integers(1, 15, size=n)

    # Approval rates per region
    region_rates = {
        "urban": 0.72, "suburban": 0.68,
        "semi-urban": 0.52, "rural": 0.113
    }
    # Approval rates per industry (rural industry gets extra penalty)
    industry_rates = {
        "Fintech": 0.74, "Healthcare": 0.70, "Retail": 0.65,
        "Manufacturing": 0.60, "AgriTech": 0.41
    }

    approved = np.array([
        rng.binomial(1, region_rates[r] * 0.5 + industry_rates[ind] * 0.5)
        for r, ind in zip(regions, industries)
    ])

    df = pd.DataFrame({
        "id": range(1, n + 1),
        "zip_type": regions,
        "industry": industries,
        "gender": genders,
        "age_group": ages,
        "credit_score": credit_scores,
        "annual_revenue": revenues,
        "years_in_business": years,
        "approved": approved,
    })
    return df


def compute_bias_report() -> BiasReport:
    df = generate_dataset()
    total = len(df)
    overall_rate = df["approved"].mean()

    # ── Region stats ──
    region_stats = []
    urban_rate = df[df["zip_type"] == "urban"]["approved"].mean()
    for region in ["urban", "suburban", "semi-urban", "rural"]:
        sub = df[df["zip_type"] == region]
        n_sub = len(sub)
        n_approved = int(sub["approved"].sum())
        rate = sub["approved"].mean()
        di = _disparate_impact(rate, urban_rate)
        region_stats.append(RegionStat(
            region=region.title(),
            applications=n_sub,
            approved=n_approved,
            approval_rate=round(rate * 100, 1),
            disparate_impact=di,
            risk_level=_risk_level(di),
        ))

    # ── Industry stats ──
    industry_stats = []
    fintech_rate = df[df["industry"] == "Fintech"]["approved"].mean()
    for ind in ["Fintech", "Healthcare", "Retail", "Manufacturing", "AgriTech"]:
        sub = df[df["industry"] == ind]
        n_sub = len(sub)
        n_approved = int(sub["approved"].sum())
        rate = sub["approved"].mean()
        di = _disparate_impact(rate, fintech_rate)
        industry_stats.append(IndustryStat(
            industry=ind,
            applications=n_sub,
            approved=n_approved,
            approval_rate=round(rate * 100, 1),
            risk_level=_risk_level(di),
        ))

    # ── Bias flags ──
    flags: list[BiasFlag] = []

    # Rural
    rural = df[df["zip_type"] == "rural"]
    rural_rate = rural["approved"].mean()
    rural_di = _disparate_impact(rural_rate, urban_rate)
    rural_p = _chi_square(int(rural["approved"].sum()), len(rural), overall_rate)
    if rural_di < 0.9:
        flags.append(BiasFlag(
            id="bf-rural",
            category="Geographic",
            slice_name="Rural Zip Codes",
            stat=f"Only {rural_rate*100:.1f}% of rural applicants approved vs {overall_rate*100:.1f}% overall",
            severity=_risk_level(rural_di),
            disparate_impact_ratio=rural_di,
            chi_square_p_value=rural_p,
            explanation=(
                "Rural applicants face a severe structural disadvantage. "
                "The disparate impact ratio falls far below the 4/5ths (0.8) EEOC threshold, "
                "indicating the model systematically under-approves this demographic. "
                "This may violate fair lending regulations."
            ),
        ))

    # AgriTech
    agri = df[df["industry"] == "AgriTech"]
    agri_rate = agri["approved"].mean()
    agri_di = _disparate_impact(agri_rate, fintech_rate)
    agri_p = _chi_square(int(agri["approved"].sum()), len(agri), overall_rate)
    if agri_di < 0.9:
        flags.append(BiasFlag(
            id="bf-agri",
            category="Industry",
            slice_name="AgriTech / Rural Tech",
            stat=f"AgriTech approval rate {agri_rate*100:.1f}% vs Fintech {fintech_rate*100:.1f}%",
            severity=_risk_level(agri_di),
            disparate_impact_ratio=agri_di,
            chi_square_p_value=agri_p,
            explanation=(
                "AgriTech businesses are significantly under-approved relative to Fintech peers. "
                "Industry type appears to function as a proxy variable for rural geography, "
                "compounding the geographic bias."
            ),
        ))

    return BiasReport(
        total_records=total,
        overall_approval_rate=round(overall_rate * 100, 1),
        region_stats=region_stats,
        industry_stats=industry_stats,
        bias_flags=flags,
        generated_at=datetime.utcnow(),
    )
