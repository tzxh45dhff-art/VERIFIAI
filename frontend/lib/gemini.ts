import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const modelName = "gemini-2.5-flash";
