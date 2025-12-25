import { db, type UserStats } from './storage';

/**
 * ユーザー統計情報を取得する（未存在時は初期値を返す）
 */
export async function getUserStats(): Promise<UserStats> {
    const stats = await db.userStats.get('singleton');
    if (stats) return stats;

    const initialStats: UserStats = {
        key: 'singleton',
        totalSessions: 0,
        avgScores: {
            structure: 0,
            empathy: 0,
            hypothesis: 0,
        },
        knowledgeNotes: [],
        weakPoints: [],
        lastUpdated: Date.now(),
    };

    await db.userStats.put(initialStats);
    return initialStats;
}

/**
 * プロンプトに注入するための弱点文字列を生成する
 */
export function formatWeakPointsForPrompt(weakPoints: string[]): string {
    if (weakPoints.length === 0) {
        return "特になし（全体的なスキル向上を目指してください）";
    }
    return weakPoints.map(point => `- ${point}`).join('\n');
}
