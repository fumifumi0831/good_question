import { db, type GameSession, type UserStats } from "./storage";

/**
 * 過去のセッションデータから統計情報を算出する
 */
export async function getUserStats(): Promise<UserStats> {
    const allSessions = await db.gameSessions.orderBy("timestamp").reverse().toArray();
    const completedSessions = allSessions.filter(s => s.status === "completed");

    if (completedSessions.length === 0) {
        return {
            key: 'singleton',
            totalSessions: 0,
            averageScore: 0,
            weakPoints: [],
            scoreTrend: [],
            lastUpdated: Date.now()
        };
    }

    // スコア推移（最大50件）
    const scoreTrend = completedSessions
        .slice(0, 50)
        .reverse()
        .map(s => ({
            date: new Date(s.timestamp).toLocaleDateString(),
            score: s.totalScore
        }));

    const totalScore = completedSessions.reduce((acc, s) => acc + s.totalScore, 0);
    const averageScore = totalScore / completedSessions.length;

    // 弱点分析 (スコアが80点未満のカテゴリを抽出 - 本来は詳細カテゴリが必要だが、簡易的に全セッションから判定)
    // ここではダミー的なロジックだが、実際には各セッションのスキル別スコアをDB保存する必要がある
    // 現状の storage.ts では totalScore しかないため、上位から改善が必要なタグを出す
    const weakPoints = averageScore < 70 ? ["構造化力", "仮説の深さ"] : ["共感の継続"];

    return {
        key: 'singleton',
        totalSessions: completedSessions.length,
        averageScore: Math.round(averageScore),
        weakPoints,
        scoreTrend,
        lastUpdated: Date.now()
    };
}

/**
 * テスト用に過去のダミーデータを挿入する（開発用）
 */
export async function seedDummyData() {
    const count = await db.gameSessions.count();
    if (count > 5) return; // 既にデータがあればスキップ

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 10; i >= 0; i--) {
        const timestamp = now - i * dayMs;
        const score = 50 + Math.random() * 40;
        await db.gameSessions.add({
            industry: "IT",
            theme: `Dummy Session ${11 - i}`,
            difficulty: "Hard",
            totalScore: score,
            status: "completed",
            helpCount: Math.floor(Math.random() * 3),
            timestamp
        });
    }
}
