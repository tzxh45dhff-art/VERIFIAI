// Groq API configuration — uses raw fetch (no SDK dependency needed)

export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatWithGroq(messages: GroqMessage[]): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
