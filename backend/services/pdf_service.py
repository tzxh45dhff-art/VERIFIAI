"""
VerifAI — PDF Compliance Passport generator.
Uses ReportLab to produce a professional, styled multi-page PDF.
"""
from io import BytesIO
from datetime import datetime
from loguru import logger

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, PageBreak,
    )
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.warning("reportlab not installed — PDF generation disabled")

# ─── Brand colors ────────────────────────────────────────────────────
COLOR_GOLD = HexColor("#C8A97E") if REPORTLAB_AVAILABLE else None
COLOR_DARK = HexColor("#0E0C0A") if REPORTLAB_AVAILABLE else None
COLOR_SURFACE = HexColor("#161310") if REPORTLAB_AVAILABLE else None
COLOR_CREAM = HexColor("#F5F1E8") if REPORTLAB_AVAILABLE else None
COLOR_GREEN = HexColor("#7E9E87") if REPORTLAB_AVAILABLE else None
COLOR_RED = HexColor("#A86060") if REPORTLAB_AVAILABLE else None
COLOR_AMBER = HexColor("#B89060") if REPORTLAB_AVAILABLE else None
COLOR_MUTED = HexColor("#5C5045") if REPORTLAB_AVAILABLE else None
COLOR_BLUE = HexColor("#9FAFCA") if REPORTLAB_AVAILABLE else None
COLOR_BORDER = HexColor("#2E2922") if REPORTLAB_AVAILABLE else None
COLOR_BROWN = HexColor("#837562") if REPORTLAB_AVAILABLE else None


def build_styles():
    """Build custom paragraph styles for the PDF."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        "VTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        textColor=COLOR_CREAM,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "VSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        textColor=COLOR_GOLD,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "VHeading",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=COLOR_CREAM,
        spaceBefore=16,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "VSubHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        textColor=COLOR_GOLD,
        spaceBefore=10,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "VBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=COLOR_CREAM,
        leading=14,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "VMuted",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=COLOR_MUTED,
        leading=12,
    ))
    styles.add(ParagraphStyle(
        "VLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        textColor=COLOR_BROWN,
        spaceAfter=2,
    ))

    return styles


def _hr():
    return HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER, spaceAfter=10, spaceBefore=10)


def _status_color(status: str):
    s = status.upper()
    if s in ("VERIFIED", "APPROVED", "PASS", "FLIPPED", "LOW"):
        return COLOR_GREEN
    elif s in ("HALLUCINATION", "DENIED", "FAIL", "HIGH", "SEVERE"):
        return COLOR_RED
    elif s in ("UNVERIFIED", "WARN", "MEDIUM", "PENDING"):
        return COLOR_AMBER
    return COLOR_CREAM


def generate_compliance_passport(case_data: dict) -> bytes:
    """Generate a multi-page styled compliance passport PDF."""
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("reportlab not installed")

    buffer = BytesIO()
    case_id = case_data.get("case_id", "CASE-UNKNOWN")

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=f"VerifAI Compliance Passport — {case_id}",
        author="VerifAI Accountability Engine v1.0",
        subject="AI Decision Accountability Report",
    )

    styles = build_styles()
    story = []

    # ── PAGE 1: COVER ──
    story.append(Spacer(1, 60))
    story.append(Paragraph("VERIFAI", styles["VTitle"]))
    story.append(Paragraph("COMPLIANCE PASSPORT", styles["VSubtitle"]))
    story.append(Spacer(1, 20))
    story.append(_hr())
    story.append(Spacer(1, 10))

    cover_data = [
        ["Case ID:", case_id],
        ["Applicant:", case_data.get("applicant_name", "N/A")],
        ["Business:", case_data.get("business", "N/A")],
        ["Generated:", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
        ["Engine:", "VerifAI Accountability Engine v1.0"],
    ]
    cover_table = Table(cover_data, colWidths=[120, 350])
    cover_table.setStyle(TableStyle([
        ("TEXTCOLOR", (0, 0), (0, -1), COLOR_BROWN),
        ("TEXTCOLOR", (1, 0), (1, -1), COLOR_CREAM),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 30))

    # Classification
    verdict = case_data.get("verdict", "FAIL")
    score = case_data.get("reliability_score", 0)
    decision = case_data.get("final_decision", "DENIED")

    story.append(Paragraph(
        f'<font color="{_status_color(verdict).hexval()}">Audit Verdict: {verdict}</font>',
        styles["VSubHeading"],
    ))
    story.append(Paragraph(
        f"Reliability Score: {score}/100 | Final Decision: {decision}",
        styles["VBody"],
    ))

    story.append(PageBreak())

    # ── PAGE 2: EXECUTIVE SUMMARY ──
    story.append(Paragraph("EXECUTIVE SUMMARY", styles["VHeading"]))
    story.append(_hr())

    hallucinations = case_data.get("hallucination_count", 0)
    bias_flags = case_data.get("bias_flags_count", 0)
    flipped = case_data.get("flipped", False)

    summary_text = (
        f"This report documents the accountability audit of AI-generated decision "
        f"Case {case_id}. The audit identified {hallucinations} hallucination(s) "
        f"and {bias_flags} bias flag(s). "
    )
    if flipped:
        summary_text += (
            f"Following contestation and re-evaluation, the original decision was "
            f"reversed from DENIED to APPROVED."
        )
    else:
        summary_text += "The original decision was upheld after review."

    story.append(Paragraph(summary_text, styles["VBody"]))
    story.append(Spacer(1, 10))

    # Key metrics table
    metrics = [
        ["METRIC", "VALUE", "STATUS"],
        ["Hallucinations Found", str(hallucinations), "HIGH" if hallucinations > 0 else "LOW"],
        ["Reliability Score", f"{score}/100", verdict],
        ["Bias Flags", str(bias_flags), "HIGH" if bias_flags >= 2 else "LOW"],
        ["Decision Flipped", "Yes" if flipped else "No", "FLIPPED" if flipped else "HELD"],
    ]
    metrics_table = Table(metrics, colWidths=[200, 120, 120])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_BORDER),
        ("TEXTCOLOR", (0, 0), (-1, 0), COLOR_GOLD),
        ("TEXTCOLOR", (0, 1), (-1, -1), COLOR_CREAM),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(metrics_table)

    story.append(PageBreak())

    # ── PAGE 3: CLAIMS AUDIT ──
    story.append(Paragraph("HALLUCINATION AUDIT", styles["VHeading"]))
    story.append(_hr())

    claims = case_data.get("claims", [])
    if claims:
        for claim in claims:
            cls = claim.get("classification", "UNVERIFIED")
            color = _status_color(cls)
            story.append(Paragraph(
                f'<font color="{color.hexval()}">[{cls}]</font> '
                f'<font color="{COLOR_CREAM.hexval()}">{claim.get("text", "")}</font>',
                styles["VBody"],
            ))
            if claim.get("explanation"):
                story.append(Paragraph(
                    f'  → {claim["explanation"]}',
                    styles["VMuted"],
                ))
            story.append(Spacer(1, 4))
    else:
        story.append(Paragraph("No claims data available.", styles["VMuted"]))

    story.append(PageBreak())

    # ── PAGE 4: REGULATORY COMPLIANCE ──
    story.append(Paragraph("REGULATORY COMPLIANCE", styles["VHeading"]))
    story.append(_hr())

    regulations = [
        ("EU AI Act Article 10", "Data governance requirements for high-risk AI systems"),
        ("GDPR Article 22", "Right to not be subject to solely automated decision-making"),
        ("ECOA", "Equal Credit Opportunity Act — prohibits discrimination in lending"),
        ("FCRA", "Fair Credit Reporting Act — accuracy requirements for consumer reports"),
    ]
    for reg, desc in regulations:
        story.append(Paragraph(f"<b>{reg}</b>", styles["VSubHeading"]))
        story.append(Paragraph(desc, styles["VBody"]))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 20))
    story.append(_hr())
    story.append(Paragraph(
        f"Generated by VerifAI Accountability Engine v1.0 · {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        styles["VMuted"],
    ))

    # Build PDF
    def add_page_footer(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(COLOR_DARK)
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        # Footer
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(COLOR_MUTED)
        canvas.drawString(20 * mm, 8 * mm, f"VerifAI Compliance Passport — {case_id}")
        canvas.drawRightString(A4[0] - 20 * mm, 8 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_page_footer, onLaterPages=add_page_footer)
    return buffer.getvalue()
