import { NextRequest, NextResponse } from "next/server";
import { getGameFacilitator } from "@/lib/gemini";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const { messages, difficulty, industry, theme } = await req.json();

        // Read system prompt from file
        const systemPromptPath = path.join(process.cwd(), "systemprompt.md");
        const systemPrompt = fs.readFileSync(systemPromptPath, "utf-8");

        // Debug: Check if API key is present (without logging the key itself)
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.error("DEBUG: GOOGLE_GENERATIVE_AI_API_KEY is MISSING in process.env");
        } else {
            console.log("DEBUG: GOOGLE_GENERATIVE_AI_API_KEY is present (length: " + process.env.GOOGLE_GENERATIVE_AI_API_KEY.length + ")");
        }

        const facilitator = await getGameFacilitator(systemPrompt);

        // Prepare history
        // Note: Facilitator uses systemInstruction, so we only pass user/model messages
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
        }));

        const chat = facilitator.startChat({ history });

        const lastMessage = messages[messages.length - 1];

        // Detailed evaluation mode
        if (lastMessage.content.includes("詳細なスキル評価を行ってください")) {
            const evaluationPrompt = `
あなたは超一流の戦略コンサルタント兼コーチです。これまでの会話履歴を分析し、以下の形式で厳格に評価してください。
出力は「指定された形式のみ」とし、前置きや「次のステップ」「模範解答」などの追加情報は一切含めないでください。

## 評価指標（各100点満点）
1. 構造化力 (Structure)
2. 共感・傾聴力 (Empathy)
3. 仮説検証力 (Hypothesis)

## 抽出
- 良い質問 (Good Questions): 今回のセッションで特に鋭かった質問を2-3個（箇条書き）
- 思考の癖 (Habits): 今回のセッションで特に改善すべき、または意識すべき思考のパターン（150文字程度）

## 出力形式（厳守）
[STRUCTURE_SCORE: 数値]
[EMPATHY_SCORE: 数値]
[HYPOTHESIS_SCORE: 数値]
[GOOD_QUESTIONS]
- 質問内容
[HABITS]
(ここに思考の癖の内容を記述)
            `;
            const evalResult = await chat.sendMessage(evaluationPrompt);
            const evalText = (await evalResult.response).text();
            return NextResponse.json({ content: evalText });
        }

        // Guidance for evaluation phase to ensure parsing works
        let contentToSend = lastMessage.content;
        if (contentToSend.includes("真因の特定")) {
            contentToSend += "\n\n評価の際は、必ず以下の見出しを含めて詳細に回答してください：\n- 到達度：[0-100]%\n- あなたの強み\n- 改善ポイント\n- 真因の詳細解説\n- 適切なアプローチ\n- 模範解答例（真因到達の最短ルート）";
        }

        // If it's the very first message, it might be the "Start Game" command
        // but the systemprompt.md handles patterns like "ゲームを開始してください"

        const result = await chat.sendMessage(contentToSend);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ content: text });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
