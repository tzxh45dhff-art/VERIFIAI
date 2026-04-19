import { NextResponse } from "next/server";
import { applicantProfile, rejectionLetter, auditClaims, PROMPT_AUDITOR } from "@/lib/mockData";
import { genAI, modelName } from "@/lib/gemini";

export async function GET() {
  // If Gemini key is available, call the real LLM for the audit
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });

      const userPrompt = `Source A (User Data):\n${JSON.stringify(applicantProfile, null, 2)}\n\nSource B (AI Decision Letter):\n${rejectionLetter}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: PROMPT_AUDITOR,
      });

      const claims = JSON.parse(result.response.text());
      return NextResponse.json({
        applicant: applicantProfile,
        letter: rejectionLetter,
        claims,
        source: "gemini",
      });
    } catch (e) {
      console.error("Gemini audit error, falling back to mock:", e);
    }
  }

  // Fallback: deterministic mock
  return NextResponse.json({
    applicant: applicantProfile,
    letter: rejectionLetter,
    claims: auditClaims,
    source: "mock",
  });
}
