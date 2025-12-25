import { db, type ChatMessage, type GameSession as FullGameSession } from './db';

export interface UserStats {
    totalSessions: number;
    totalXP: number;
    level: number;
    bestScore: number;
    currentStreak: number;
    lastPlayedDate: string | null;
    skills: {
        structure: number;
        empathy: number;
        hypothesis: number;
    };
    history: {
        id: string;
        date: string;
        score: number;
        scenarioTitle: string;
    }[];
    knowledgeNotes: {
        id: string;
        originalQuestion: string;
        goodQuestion: string;
        thinkingHabit: string;
        date: string;
    }[];
}

const STORAGE_KEY = 'good_question_user_stats';

export const getInitialStats = (): UserStats => {
    if (typeof window === 'undefined') return emptyStats;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse stats', e);
        }
    }
    return emptyStats;
};

const emptyStats: UserStats = {
    totalSessions: 0,
    totalXP: 0,
    level: 1,
    bestScore: 0,
    currentStreak: 0,
    lastPlayedDate: null,
    skills: {
        structure: 0,
        empathy: 0,
        hypothesis: 0,
    },
    history: [],
    knowledgeNotes: [],
};

export const saveStats = (stats: UserStats) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

// DEXIE (IndexedDB) Helpers
export const saveChatMessage = async (msg: ChatMessage) => {
    return await db.chatMessages.add(msg);
};

export const getChatHistory = async (sessionId: string) => {
    return await db.chatMessages.where('sessionId').equals(sessionId).sortBy('timestamp');
};

export const saveGameSessionFull = async (session: FullGameSession) => {
    return await db.gameSessions.put(session);
};

export const getGameSessionFull = async (sessionId: string) => {
    return await db.gameSessions.get(sessionId);
};

export const updateStatsAfterSession = (
    prevStats: UserStats,
    score: number,
    skillScores: { structure: number; empathy: number; hypothesis: number },
    scenarioTitle: string,
    sessionId: string,
    knowledgeNote?: { originalQuestion: string; goodQuestion: string; thinkingHabit: string }
): UserStats => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // XP Calculation
    const xpGained = score;
    const newTotalXP = prevStats.totalXP + xpGained;
    const newLevel = Math.floor(newTotalXP / 500) + 1;

    // Streak Calculation
    let newStreak = prevStats.currentStreak;
    if (prevStats.lastPlayedDate === null) {
        newStreak = 1;
    } else {
        const lastDate = new Date(prevStats.lastPlayedDate);
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            newStreak += 1;
        } else if (diffDays > 1) {
            newStreak = 1;
        }
    }

    const newHistory = [
        {
            id: sessionId,
            date: today,
            score,
            scenarioTitle,
        },
        ...prevStats.history,
    ].slice(0, 50);

    const newKnowledgeNotes = [...prevStats.knowledgeNotes];
    if (knowledgeNote) {
        newKnowledgeNotes.unshift({
            id: `${sessionId}_note`,
            ...knowledgeNote,
            date: today
        });
    }

    const newStats: UserStats = {
        ...prevStats,
        totalSessions: prevStats.totalSessions + 1,
        totalXP: newTotalXP,
        level: newLevel,
        bestScore: Math.max(prevStats.bestScore, score),
        currentStreak: newStreak,
        lastPlayedDate: today,
        skills: {
            structure: Math.round((prevStats.skills.structure * prevStats.totalSessions + skillScores.structure) / (prevStats.totalSessions + 1)),
            empathy: Math.round((prevStats.skills.empathy * prevStats.totalSessions + skillScores.empathy) / (prevStats.totalSessions + 1)),
            hypothesis: Math.round((prevStats.skills.hypothesis * prevStats.totalSessions + skillScores.hypothesis) / (prevStats.totalSessions + 1)),
        },
        history: newHistory,
        knowledgeNotes: newKnowledgeNotes.slice(0, 50),
    };

    saveStats(newStats);
    return newStats;
};
