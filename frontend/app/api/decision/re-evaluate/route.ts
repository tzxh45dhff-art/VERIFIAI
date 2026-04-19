import { NextResponse } from "next/server";
import { deltaResult, PROMPT_DELTA, applicantProfile } from "@/lib/mockData";
import { genAI, modelName } from "@/lib/gemini";

export async function POST(req: Request) {
  const body = await req.json();

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });

      const userPrompt = `Original Applicant Data:\n${JSON.stringify(applicantProfile, null, 2)}\n\nContested Data Point:\nField: ${body.field}\nOriginal (Hallucinated) Value: ${body.originalValue}\nNew Verified Value: ${body.newValue}\n\nRespond with JSON containing: correctedField, originalValue, newValue, oldScore (number 0-100 where 100=highest risk), newScore, threshold (50), oldDecision, newDecision, explanation.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: PROMPT_DELTA,
      });

      const delta = JSON.parse(result.response.text());
      return NextResponse.json({ ...delta, source: "gemini" });
    } catch (e) {
      console.error("Gemini delta error, falling back to mock:", e);
    }
  }

  // Deterministic fallback
  return NextResponse.json({ ...deltaResult, source: "mock" });
}
