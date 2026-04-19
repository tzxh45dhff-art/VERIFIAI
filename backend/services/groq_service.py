"""
VerifAI — Groq LLM integration service.
Singleton pattern. All AI calls route through here.
"""
import json
import re
from loguru import logger
from config import settings

try:
    from groq import Groq
except ImportError:
    Groq = None
    logger.warning("groq package not installed — AI features disabled")


class GroqService:
    def __init__(self):
        self.client = None
        if Groq and settings.GROQ_API_KEY:
            self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.audit_model = "llama-3.3-70b-versatile"
        self.chat_model = "llama-3.1-8b-instant"

    @property
    def available(self) -> bool:
        return self.client is not None

    async def complete(
        self,
        system: str,
        user: str,
        model: str = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> str:
        """Standard completion. Returns text."""
        if not self.client:
            raise RuntimeError("Groq client not configured — set GROQ_API_KEY")

        try:
            response = self.client.chat.completions.create(
                model=model or self.audit_model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq completion error: {e}")
            raise

    async def complete_json(
        self,
        system: str,
        user: str,
        model: str = None,
    ) -> dict:
        """Returns parsed JSON. Handles LLM output cleanup."""
        json_system = (
            system
            + "\n\nCRITICAL: Return ONLY valid JSON. No markdown fences. "
            "No text before or after the JSON object. "
            "No comments inside the JSON. "
            "Start your response with { and end with }"
        )

        text = await self.complete(json_system, user, model, temperature=0.05)
        return self._parse_json(text)

    def _parse_json(self, text: str) -> dict:
        """Clean and parse JSON from LLM output."""
        text = text.strip()

        # Strip markdown fences
        if text.startswith("```"):
            parts = text.split("```")
            if len(parts) >= 2:
                text = parts[1]
                if text.startswith("json"):
                    text = text[4:]
            text = text.strip()

        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Regex fallback — extract outermost JSON object
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        logger.error(f"Could not parse JSON from LLM output: {text[:200]}...")
        raise ValueError(f"Could not parse JSON from LLM response")

    def stream(
        self,
        system: str,
        user: str,
        model: str = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ):
        """Synchronous generator for SSE streaming."""
        if not self.client:
            raise RuntimeError("Groq client not configured — set GROQ_API_KEY")

        stream = self.client.chat.completions.create(
            model=model or self.chat_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            stream=True,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def stream_messages(
        self,
        messages: list,
        model: str = None,
        temperature: float = 0.4,
        max_tokens: int = 512,
    ):
        """Stream with full message history (for chatbot)."""
        if not self.client:
            raise RuntimeError("Groq client not configured — set GROQ_API_KEY")

        stream = self.client.chat.completions.create(
            model=model or self.chat_model,
            messages=messages,
            stream=True,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


# Singleton
groq_service = GroqService()
