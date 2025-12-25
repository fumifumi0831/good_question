import { describe, it, expect, beforeEach } from 'vitest';
import { db } from "../storage";
import { getUserStats } from "../stats-utils";

describe('stats-utils: getUserStats', () => {
    beforeEach(async () => {
        // 毎回クリーンな状態でテスト
        if (db.isOpen()) {
            await db.close();
        }
        await db.open();
        await db.gameSessions.clear();
    });

    it('should return empty stats when no sessions exist', async () => {
        const stats = await getUserStats();
        expect(stats.totalSessions).toBe(0);
        expect(stats.scoreTrend).toHaveLength(0);
    });

    it('should correctly calculate average score and trend', async () => {
        await db.gameSessions.bulkAdd([
            { totalScore: 60, status: 'completed', timestamp: 1000, industry: 'IT', theme: 'T1', difficulty: 'Hard', helpCount: 0 },
            { totalScore: 80, status: 'completed', timestamp: 2000, industry: 'IT', theme: 'T2', difficulty: 'Hard', helpCount: 0 },
            { totalScore: 70, status: 'active', timestamp: 3000, industry: 'IT', theme: 'T3', difficulty: 'Hard', helpCount: 0 },
        ]);

        const stats = await getUserStats();
        expect(stats.totalSessions).toBe(2);
        expect(stats.averageScore).toBe(70); // (60 + 80) / 2
        expect(stats.scoreTrend).toHaveLength(2);
        expect(stats.scoreTrend[0].score).toBe(60);
    });
});
