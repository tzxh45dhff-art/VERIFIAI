"""
VerifAI — Chatbot router.
Context-aware SSE-streaming chatbot using Groq llama-3.1-8b-instant.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services.groq_service import groq_service
from models.database import record_usage, check_usage_limit
from loguru import logger
import json

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


CHATBOT_SYSTEM = """You are VerifAI Assistant — a helpful AI companion embedded in the VerifAI accountability platform.

VerifAI is a tool that:
- Audits AI-generated documents (like loan rejection letters) for hallucinations
- Detects statistical bias in datasets using disparate impact ratios and chi-square tests
- Enables applicants to contest AI decisions with counter-evidence
- Generates compliance passports (audit trail PDFs)

You help users:
1. Understand their audit results (what claims are verified/hallucinated/unverified)
2. Navigate the bias analysis findings
3. Understand the contestation process
4. Explain regulatory concepts (EU AI Act, GDPR Art 22, ECOA, FCRA)
5. Guide them through the platform features

Rules:
- Be concise (2-3 paragraphs max per response)
- If they ask about a specific case, reference any context provided
- Never make up case data — only reference what's in the context
- Use warm, professional tone
- Always refer to the platform as "VerifAI" (not VerifiAI)
- If asked about pricing, mention the free plan has limited monthly usage and Pro removes all limits

Current page context: {page}
{case_context}"""


MOCK_RESPONSES = {
    "default": (
        "Hello! I'm your VerifAI Assistant. I can help you understand your audit results, "
        "explain bias flags, walk you through the contestation process, or answer questions "
        "about AI accountability regulations.\n\n"
        "What would you like to know about?"
    ),
    "audit": (
        "Your audit results show claims extracted from the AI-generated letter. Each claim "
        "is classified as VERIFIED (confirmed by source data), UNVERIFIED (can't be confirmed "
        "or denied), or HALLUCINATION (contradicts the source data).\n\n"
        "Hallucinations are the most critical — they represent factual errors that may have "
        "influenced the decision. You can contest these in the Contestation step."
    ),
    "bias": (
        "The bias analysis uses statistical methods like disparate impact ratios and chi-square "
        "tests to identify systematic unfairness. A ratio below 0.8 (the 4/5ths rule) indicates "
        "potential discrimination under EEOC guidelines.\n\n"
        "High-risk flags mean certain groups are being disproportionately denied."
    ),
}


@router.post("/message")
async def chat_message(request: ChatRequest):
    """Send a message and get a streaming response."""
    # Usage check
    allowed, used, limit = check_usage_limit(request.user_id, "free", "chat")
    if not allowed:
        raise HTTPException(status_code=403, detail={
            "error": "daily_limit_reached",
            "message": f"Daily chat limit reached ({used}/{limit}). Upgrade to Pro.",
            "used": used,
            "limit": limit,
            "upgrade_required": True,
        })

    # Build context
    case_context = ""
    if request.context.case_id:
        case_context += f"\nActive Case: {request.context.case_id}"
    if request.context.applicant_name:
        case_context += f"\nApplicant: {request.context.applicant_name}"
    if request.context.audit_result:
        case_context += f"\nAudit Result Summary: {json.dumps(request.context.audit_result)}"
    if request.context.bias_flags:
        case_context += f"\nBias Flags: {json.dumps(request.context.bias_flags)}"

    system = CHATBOT_SYSTEM.format(
        page=request.context.current_page,
        case_context=case_context,
    )

    if not groq_service.available:
        # Return mock
        page = request.context.current_page.lower()
        if "audit" in page:
            text = MOCK_RESPONSES["audit"]
        elif "bias" in page:
            text = MOCK_RESPONSES["bias"]
        else:
            text = MOCK_RESPONSES["default"]

        record_usage(request.user_id, "chat")

        async def mock_stream():
            for word in text.split(" "):
                yield f"data: {json.dumps({'token': word + ' '})}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(mock_stream(), media_type="text/event-stream")

    # Build message history
    messages = [{"role": "system", "content": system}]
    for msg in request.conversation_history[-6:]:  # Keep last 6 messages
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": request.message})

    record_usage(request.user_id, "chat")

    async def generate():
        try:
            for token in groq_service.stream_messages(
                messages,
                model="llama-3.1-8b-instant",
                temperature=0.4,
                max_tokens=512,
            ):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Chat stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
