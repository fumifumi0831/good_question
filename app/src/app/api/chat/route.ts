import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPrompt, type PromptMode } from "@/lib/prompts";
import { NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
    if (!genAI) {
        return NextResponse.json(
            { error: "API Key not configured. Please set GOOGLE_AI_API_KEY." },
            { status: 500 }
        );
    }

    try {
        const { messages, mode, userStats } = await req.json();

        let systemPrompt = await getPrompt(mode as PromptMode);
        if (!systemPrompt) {
            return NextResponse.json({ error: "System prompt not found." }, { status: 404 });
        }

        if (mode === "mentor") {
            const stats = userStats || {};
            const weakPointsStr = (stats.weakPoints && Array.isArray(stats.weakPoints) && stats.weakPoints.length > 0)
                ? stats.weakPoints.join(", ")
                : "明確な弱点はまだ特定されていません。";
            systemPrompt = systemPrompt.replace("${WEAK_POINTS}", weakPointsStr);
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: systemPrompt,
        });

        // For simplicity, we convert messages to Gemini format
        // Gemini roles: 'user', 'model' (assistant)
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const lastMessage = messages[messages.length - 1].content;

        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ content: text });
    } catch (error: any) {
        console.error("API Error:", error);

        // Check for 429
        if (error?.status === 429 || error?.message?.includes('429')) {
            return NextResponse.json(
                { content: "上司が会議中（制限中）です。数分後に再度お声がけください。" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
