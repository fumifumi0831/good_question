import { createClient } from './supabase/server'

// ========================================
// 型定義
// ========================================

export interface GameSession {
    id?: number
    user_id?: string
    industry: string
    theme: string
    difficulty: string
    totalScore: number
    status: 'active' | 'completed' | 'archived'
    helpCount: number
    timestamp?: number
    created_at?: string
    updated_at?: string
}

export interface ChatMessage {
    id?: number
    sessionId: number
    role: 'user' | 'assistant' | 'system'
    content: string
    helpUsed: boolean
    helpContent?: string
    reachability: number
    timestamp?: number
    created_at?: string
}

export interface UserStats {
    key?: 'singleton'
    id?: number
    user_id?: string
    totalSessions: number
    averageScore: number
    avgScores?: {
        structure: number
        empathy: number
        hypothesis: number
    }
    knowledgeNotes?: string[]
    weakPoints: string[]
    scoreTrend: { date: string; score: number }[]
    lastUpdated: number
    last_updated?: string
}

// ========================================
// Supabase CRUD 操作
// ========================================

export const db = {
    // Game Sessions
    gameSessions: {
        async add(session: GameSession): Promise<number> {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('User not authenticated')

            const { data, error } = await supabase
                .from('game_sessions')
                .insert({
                    user_id: user.id,
                    industry: session.industry,
                    theme: session.theme,
                    difficulty: session.difficulty,
                    total_score: session.totalScore,
                    status: session.status,
                    help_count: session.helpCount,
                })
                .select('id')
                .single()

            if (error) throw error
            return data.id
        },

        async update(id: number, updates: Partial<GameSession>): Promise<void> {
            const supabase = await createClient()

            const { error } = await supabase
                .from('game_sessions')
                .update({
                    total_score: updates.totalScore,
                    status: updates.status,
                    help_count: updates.helpCount,
                })
                .eq('id', id)

            if (error) throw error
        },

        async toArray(): Promise<GameSession[]> {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return []

            const { data, error } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            return (data || []).map(session => ({
                id: session.id,
                industry: session.industry,
                theme: session.theme,
                difficulty: session.difficulty,
                totalScore: session.total_score,
                status: session.status,
                helpCount: session.help_count,
                timestamp: new Date(session.created_at).getTime(),
            }))
        },
    },

    // Chat Messages
    chatMessages: {
        async add(message: ChatMessage): Promise<number> {
            const supabase = await createClient()

            const { data, error } = await supabase
                .from('chat_messages')
                .insert({
                    session_id: message.sessionId,
                    role: message.role,
                    content: message.content,
                    help_used: message.helpUsed,
                    help_content: message.helpContent,
                    reachability: message.reachability,
                })
                .select('id')
                .single()

            if (error) throw error
            return data.id
        },

        where(field: string) {
            return {
                async equals(value: any): Promise<ChatMessage[]> {
                    const supabase = await createClient()

                    const { data, error } = await supabase
                        .from('chat_messages')
                        .select('*')
                        .eq(field === 'sessionId' ? 'session_id' : field, value)
                        .order('created_at', { ascending: true })

                    if (error) throw error

                    return (data || []).map(msg => ({
                        id: msg.id,
                        sessionId: msg.session_id,
                        role: msg.role,
                        content: msg.content,
                        helpUsed: msg.help_used,
                        helpContent: msg.help_content,
                        reachability: msg.reachability,
                        timestamp: new Date(msg.created_at).getTime(),
                    }))
                },
            }
        },
    },

    // User Stats
    userStats: {
        async get(key: 'singleton'): Promise<UserStats | undefined> {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return undefined

            const { data, error } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error) {
                if (error.code === 'PGRST116') return undefined // Not found
                throw error
            }

            return {
                key: 'singleton',
                totalSessions: data.total_sessions,
                averageScore: data.average_score,
                weakPoints: data.weak_points || [],
                scoreTrend: data.score_trend || [],
                lastUpdated: new Date(data.last_updated).getTime(),
            }
        },

        async put(stats: UserStats): Promise<void> {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase
                .from('user_stats')
                .upsert({
                    user_id: user.id,
                    total_sessions: stats.totalSessions,
                    average_score: stats.averageScore,
                    weak_points: stats.weakPoints,
                    score_trend: stats.scoreTrend,
                    last_updated: new Date(stats.lastUpdated).toISOString(),
                })

            if (error) throw error
        },
    },
}
