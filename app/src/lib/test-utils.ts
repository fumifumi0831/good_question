/**
 * AIの応答から特定のフォーマットを抽出・検証するためのユーティリティ
 */

/**
 * Facilitatorの応答末尾に含まれる「真因到達度：XX%」を抽出する
 */
export function extractReachability(text: string): number | null {
    const match = text.match(/真因到達度：(\d+)%/);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return null;
}

/**
 * AIの応答からJSONブロックを抽出してパースする
 */
export function extractAndParseJSON<T>(text: string): T | null {
    try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            return JSON.parse(jsonStr) as T;
        }
    } catch (e) {
        console.error("Failed to parse JSON from AI response", e);
    }
    return null;
}
