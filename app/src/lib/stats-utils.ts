import { db, type GameSession, type UserStats } from "./storage";

/**
 * 過去のセッションデータから統計情報を算出する
 */
export async function getUserStats(): Promise<UserStats> {
    try {
        // Supabase の toArray() を使用（orderBy, reverse は不要）
        const allSessions = await db.gameSessions.toArray();
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

        // timestamp でソート（降順）
        const sortedSessions = completedSessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // スコア推移（最大50件）
        const scoreTrend = sortedSessions
            .slice(0, 50)
            .reverse()
            .map(s => ({
                date: new Date(s.timestamp || Date.now()).toLocaleDateString(),
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
    } catch (error) {
        // 認証されていない場合やデータ取得に失敗した場合はデフォルト値を返す
        console.warn("Failed to load user stats, returning default values:", error);
        return {
            key: 'singleton',
            totalSessions: 0,
            averageScore: 0,
            weakPoints: [],
            scoreTrend: [],
            lastUpdated: Date.now()
        };
    }
}

/**
 * テスト用に過去のダミーデータを挿入する（開発用）
 * 注意: Supabase に移行したため、この関数は使用されません
 */
export async function seedDummyData() {
    // Supabase では count() メソッドがないため、toArray() で取得
    const sessions = await db.gameSessions.toArray();
    if (sessions.length > 5) return; // 既にデータがあればスキップ

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
