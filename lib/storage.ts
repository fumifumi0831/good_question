
export interface GameSession {
    id: string;
    date: string;
    scenario: string;
    score: number;
    reachability: number;
    categoryScores?: {
        structure: number;
        empathy: number;
        hypothesis: number;
    };
    goodQuestions: string[];
    reflections: string;
}

export interface UserStats {
    totalXP: number;
    streak: number;
    lastPlayedDate: string | null;
    level: number;
    sessions: GameSession[];
    bookmarkedQuestions: string[];
}

const STORAGE_KEY = 'root_cause_training_stats';

export const initialStats: UserStats = {
    totalXP: 0,
    streak: 0,
    lastPlayedDate: null,
    level: 1,
    sessions: [],
    bookmarkedQuestions: [],
};

export const getStoredStats = (): UserStats => {
    if (typeof window === 'undefined') return initialStats;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialStats;
    try {
        return JSON.parse(stored);
    } catch (e) {
        return initialStats;
    }
};

export const saveStats = (stats: UserStats) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

export const calculateXP = (score: number, reachability: number): number => {
    // Simple XP formula: score * 1.5 + reachability * 0.5
    return Math.floor(score * 1.5 + reachability * 0.5);
};

export const updateStreak = (stats: UserStats): UserStats => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (stats.lastPlayedDate === today) {
        return stats; // Already played today
    }

    if (stats.lastPlayedDate === yesterday) {
        stats.streak += 1;
    } else {
        stats.streak = 1; // Streak broken or first time
    }

    stats.lastPlayedDate = today;
    return stats;
};

export const calculateLevel = (xp: number): number => {
    // Level = Math.floor(sqrt(xp / 100)) + 1 (Approximate progression)
    return Math.floor(Math.sqrt(xp / 50)) + 1;
};
