import { GoogleGenerativeAI } from "@google/generative-ai";

// Read API Key inside functions or ensure it's evaluated correctly
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables.");
  }
  return new GoogleGenerativeAI(apiKey);
};

export async function getChatResponse(systemPrompt: string, history: any[], message: string) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }]
    })),
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  return response.text();
}

export async function getGameFacilitator(systemPrompt: string) {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: systemPrompt,
  });
}
