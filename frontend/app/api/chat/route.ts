import { NextRequest, NextResponse } from "next/server";
import { chatWithGroq, type GroqMessage } from "@/lib/groq";

const SYSTEM_PROMPT = `You are VerifAI Assistant, an AI accountability expert embedded in the VerifAI platform.

Your expertise covers:
- AI hallucination detection and fact-checking
- Dataset bias analysis (disparate impact ratios, chi-square tests)
- EU AI Act compliance (Articles 9, 10, 14)
- GDPR Article 22 (rights against automated decisions)
- Equal Credit Opportunity Act (ECOA)
- Algorithmic auditing methodology
- Risk score interpretation and contestation

Rules:
- Be concise but precise. Use data-driven language.
- Reference specific regulations when relevant.
- If asked about VerifAI features, explain the 4-step workflow: Bias Cartography → Hallucination Audit → Decision Contestation → Verdict & Compliance.
- Use "VerifAI" (not "VerifiAI") everywhere.
- Format responses with markdown when helpful.
- Stay professional and authoritative.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const groqMessages: GroqMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const reply = await chatWithGroq(groqMessages);
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Chat failed";
    console.error("Chat API error:", message);

    // Fallback response when API is unavailable
    if (message.includes("GROQ_API_KEY")) {
      return NextResponse.json({
        reply: "I'm VerifAI Assistant. To enable AI responses, please add your `GROQ_API_KEY` to `.env.local`. In the meantime, here's how I can help:\n\n- **Bias Cartography**: Upload datasets to detect statistical discrimination\n- **Hallucination Audit**: AI-generated documents are fact-checked claim by claim\n- **Decision Contestation**: Submit counter-evidence under GDPR Article 22\n- **Compliance Passport**: Generate EU AI Act audit trails\n\nAsk me anything about AI accountability!",
      });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
