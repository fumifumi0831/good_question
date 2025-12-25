import Dexie, { type Table } from 'dexie';

export interface ChatMessage {
    id?: number;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface GameSession {
    id: string; // sessionId
    scenario: any;
    finalEvaluation?: any;
    timestamp: number;
}

export class AppDatabase extends Dexie {
    chatMessages!: Table<ChatMessage>;
    gameSessions!: Table<GameSession>;

    constructor() {
        super('GoodQuestionDB');
        this.version(1).stores({
            chatMessages: '++id, sessionId, role, timestamp',
            gameSessions: 'id, timestamp'
        });
    }
}

export const db = new AppDatabase();
