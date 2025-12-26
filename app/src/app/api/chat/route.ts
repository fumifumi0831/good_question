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
        const body = await req.json();
        const { messages, mode, userStats } = body;
        console.log(`[API Chat] Mode: ${mode}, Messages Count: ${messages?.length}`);

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
            console.log(`[API Chat] Injected Weak Points: ${weakPointsStr}`);
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: systemPrompt,
        });

        // Calculate history (messages except the last one)
        let history = (messages && messages.length > 1)
            ? messages.slice(0, -1).map((m: any) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }))
            : [];

        // Gemini requires history to start with 'user', not 'model'
        if (history.length > 0 && history[0].role === "model") {
            history = history.slice(1);
        }

        const lastMessage = messages[messages.length - 1].content;

        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ content: text });
    } catch (error: any) {
        console.error("Critical API Error Details:", error);
        console.error("Stack Trace:", error.stack);

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
