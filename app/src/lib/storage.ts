import Dexie, { type Table } from 'dexie';

export interface GameSession {
    id?: number;
    industry: string;
    theme: string;
    difficulty: string;
    totalScore: number;
    status: 'active' | 'completed' | 'archived';
    helpCount: number;
    timestamp: number;
}

export interface ChatMessage {
    id?: number;
    sessionId: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    helpUsed: boolean;
    helpContent?: string;
    reachability: number;
    timestamp: number;
}

export interface UserStats {
    key: 'singleton';
    totalSessions: number;
    avgScores: {
        structure: number;
        empathy: number;
        hypothesis: number;
    };
    knowledgeNotes: string[];
    weakPoints: string[];
    lastUpdated: number;
}

export class GoodQuestionDatabase extends Dexie {
    gameSessions!: Table<GameSession>;
    chatMessages!: Table<ChatMessage>;
    userStats!: Table<UserStats>;

    constructor() {
        super('GoodQuestionDB_v2');
        this.version(1).stores({
            gameSessions: '++id, status, timestamp',
            chatMessages: '++id, sessionId, timestamp',
            userStats: 'key'
        });
    }
}

export const db = new GoodQuestionDatabase();
