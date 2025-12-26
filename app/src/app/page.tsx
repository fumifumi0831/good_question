"use client";

import { useState, useEffect, useRef } from "react";
import { db, type GameSession, type ChatMessage, type UserStats } from "@/lib/storage";
import { getUserStats, seedDummyData } from "@/lib/stats-utils";
import { Send, HelpCircle, ChevronRight, BarChart2, MessageSquare, Trophy, Target, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function TrainingPage() {
  const [view, setView] = useState<"training" | "dashboard">("training");
  const [session, setSession] = useState<GameSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [botReachability, setBotReachability] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stats = await getUserStats();
        setUserStats(stats);
      } catch (err) {
        console.error("Failed to load user stats", err);
      }
    };
    init();
  }, [view]);

  // 評価後に最新の統計を反映
  useEffect(() => {
    if (evaluationResult) {
      getUserStats().then(setUserStats).catch(console.error);
    }
  }, [evaluationResult]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const resetSession = () => {
    setSession(null);
    setMessages([]);
    setEvaluationResult(null);
    setBotReachability(0);
    setView("training");
  };

  const startNewSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mentor",
          messages: [{ role: "user", content: "トレーニングを開始してください。" }],
          userStats: userStats ? {
            weakPoints: userStats.weakPoints || [],
            averageScore: userStats.averageScore || 0
          } : null,
        }),
      });

      const data = await res.json();
      if (data.content) {
        const jsonMatch = data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          const newSession: GameSession = {
            industry: "IT / Consulting",
            theme: result.scenario.surface,
            difficulty: "Hard",
            totalScore: 0,
            status: "active",
            helpCount: 0,
            timestamp: Date.now(),
          };
          const id = await db.gameSessions.add(newSession);
          const activeSession = { ...newSession, id };
          setSession(activeSession);

          const firstMsg: ChatMessage = {
            sessionId: id as number,
            role: "assistant",
            content: `【上司のブリーフィング】\n${result.briefing}\n\n【クライアント】\n「${result.scenario.surface}」`,
            helpUsed: false,
            reachability: 0,
            timestamp: Date.now(),
          };
          const msgId = await db.chatMessages.add(firstMsg);
          setMessages([{ ...firstMsg, id: msgId as number }]);
        }
      }
    } catch (e) {
      console.error("Failed to start session", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenHelp = async () => {
    setIsHelpModalOpen(true);
    if (!session || messages.length < 2) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "helper",
          messages: messages,
        }),
      });

      const data = await res.json();
      const content = data.content || "上司は現在考え込んでいます...";
      const newSession = { ...session, helpCount: session.helpCount + 1 };
      setSession(newSession);
      db.gameSessions.update(session.id!, { helpCount: newSession.helpCount });

      const lastMsg = messages[messages.length - 1];
      if (lastMsg) {
        lastMsg.helpContent = content;
        setMessages([...messages]);
      }
    } catch (e) {
      console.error("Helper API error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishSession = async () => {
    if (!session || messages.length < 3 || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reviewer",
          messages: messages,
        }),
      });

      const data = await res.json();
      const jsonMatch = data.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setEvaluationResult(result);

        await db.gameSessions.update(session.id!, {
          status: "completed",
          totalScore: (result.scores.structure + result.scores.empathy + result.scores.hypothesis) / 3
        });
      }
    } catch (e) {
      console.error("Evaluation error", e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !session || isLoading) return;

    const userMsg: ChatMessage = {
      sessionId: session.id!,
      role: "user",
      content: input,
      helpUsed: false,
      reachability: 0,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const msgId = await db.chatMessages.add(userMsg);
      const userMsgWithId = { ...userMsg, id: msgId as number };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "facilitator",
          messages: [...messages, userMsg],
        }),
      });

      const data = await res.json();
      if (!data.content) {
        const errorMsg = data.details ? `${data.error} (${data.details})` : (data.error || "AIからの応答が空でした。");
        throw new Error(errorMsg);
      }
      const reachabilityMatch = data.content.match(/真因到達度：(\d+)%/);
      const reachability = reachabilityMatch ? parseInt(reachabilityMatch[1], 10) : botReachability;
      if (reachabilityMatch) setBotReachability(reachability);

      const botMsg: ChatMessage = {
        sessionId: session.id!,
        role: "assistant",
        content: data.content,
        helpUsed: false,
        reachability: reachability,
        timestamp: Date.now(),
      };
      const botMsgId = await db.chatMessages.add(botMsg);
      const botMsgWithId = { ...botMsg, id: botMsgId as number };

      setMessages((prev) => {
        const updated = prev.map(m => m.timestamp === userMsg.timestamp ? userMsgWithId : m);
        return [...updated, botMsgWithId];
      });
    } catch (e) {
      console.error("Send message error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const isHelpActive = messages.length >= 4;

  // --- RENDERING: DASHBOARD ---
  if (view === "dashboard") {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)] p-10 flex flex-col items-center overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-6xl space-y-10 pb-20">
          <header className="flex justify-between items-center">
            <button onClick={() => setView("training")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-accent)] hover:bg-[var(--border)] transition-all">
              <ArrowLeft size={20} />
              <span>トレーニングに戻る</span>
            </button>
            <h1 className="text-3xl font-bold font-['Outfit']">My Performance</h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-8 rounded-[32px] flex flex-col items-center justify-center space-y-2">
              <Trophy size={40} className="text-yellow-500 mb-2" />
              <p className="text-[var(--text-dim)] text-xs uppercase font-bold tracking-widest">Completed Sessions</p>
              <p className="text-5xl font-['Outfit'] font-bold">{userStats?.totalSessions || 0}</p>
            </div>
            <div className="glass-panel p-8 rounded-[32px] flex flex-col items-center justify-center space-y-2">
              <BarChart2 size={40} className="text-[var(--primary)] mb-2" />
              <p className="text-[var(--text-dim)] text-xs uppercase font-bold tracking-widest">Average Score</p>
              <p className="text-5xl font-['Outfit'] font-bold">{userStats?.averageScore || 0}</p>
            </div>
            <div className="glass-panel p-8 rounded-[32px] flex flex-col items-center justify-center space-y-2">
              <Target size={40} className="text-[var(--secondary)] mb-2" />
              <p className="text-[var(--text-dim)] text-xs uppercase font-bold tracking-widest">Core Weak Points</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {userStats?.weakPoints.map(w => (
                  <span key={w} className="px-3 py-1 rounded-full bg-[var(--secondary)]/10 text-[var(--secondary)] text-xs font-bold border border-[var(--secondary)]/20">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[40px] space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ChevronRight className="text-[var(--primary)]" />
              Growth Trend
            </h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userStats?.scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--primary)' }} activeDot={{ r: 8, stroke: 'white' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- RENDERING: EVALUATION REPORT ---
  if (evaluationResult) {
    const chartData = [
      { subject: '構造化力', A: evaluationResult.scores.structure, fullMark: 100 },
      { subject: '共感・傾聴力', A: evaluationResult.scores.empathy, fullMark: 100 },
      { subject: '仮説検証力', A: evaluationResult.scores.hypothesis, fullMark: 100 },
    ];

    return (
      <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)] p-10 flex flex-col items-center overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl space-y-10 pb-20">
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-bold font-['Outfit'] bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Evaluation Report</h1>
            <p className="text-[var(--text-dim)]">今回のインタビューの振り返りとアドバイスです。</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-8 rounded-[32px] flex flex-col items-center">
              <h3 className="text-lg font-bold mb-6">Skill Balance</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-dim)', fontSize: 12 }} />
                    <Radar name="Score" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-[var(--secondary)]">
                <h4 className="font-bold mb-2 flex items-center gap-2"><span>👏</span> 総評</h4>
                <p className="text-sm leading-relaxed">{evaluationResult.summaryFeedback}</p>
              </div>
              <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-[var(--primary)] text-sm">
                <h4 className="font-bold mb-2 flex items-center gap-2"><span>🧠</span> 次へのヒント</h4>
                <ul className="space-y-1 opacity-80">
                  {evaluationResult.thinkingHabits.map((h: string, i: number) => <li key={i}>・{h}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold font-['Outfit'] flex items-center gap-3">外科手術型添削 (Better Versions)</h2>
            {evaluationResult.clips.map((clip: any, i: number) => (
              <div key={i} className="glass-panel p-8 rounded-[32px] space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[var(--danger)] uppercase">Original (ID: {clip.messageId})</p>
                    <p className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-sm italic">"{clip.original}"</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[var(--success)] uppercase">Better Version</p>
                    <p className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 text-sm font-bold border-l-4 border-l-[var(--success)]">"{clip.better}"</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-dim)] pt-4 border-t border-[var(--border)]"><span className="text-[var(--text-main)] font-bold">解説：</span>{clip.reason}</p>
              </div>
            ))}
          </section>

          <footer className="flex justify-center pt-10 gap-4">
            <button onClick={() => setView("dashboard")} className="px-8 py-4 rounded-2xl bg-[var(--bg-accent)] text-[var(--text-main)] font-bold border border-[var(--border)] hover:bg-[var(--bg-surface)] transition-all">
              全履歴を見る
            </button>
            <button onClick={resetSession} className="px-10 py-4 rounded-2xl bg-[var(--primary)] text-white font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-indigo-500/30">
              もう一度トレーニング
            </button>
          </footer>
        </motion.div>
      </div>
    );
  }

  // --- RENDERING: TRAINING ---
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-deep)] text-[var(--text-main)]">
      <aside className={`w-80 border-r border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col transition-all ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 text-2xl font-bold text-[var(--primary)]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]" />
              <span className="font-['Outfit']">good_question</span>
            </div>
            <p className="text-xs text-[var(--text-dim)]">Consultant Training Kit</p>
          </div>
        </div>

        <nav className="space-y-2 mb-10">
          <button onClick={() => setView("training")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === "training" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold" : "hover:bg-[var(--bg-accent)]"}`}>
            <MessageSquare size={18} />
            <span>Interview</span>
          </button>
          <button onClick={() => setView("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${(view as string) === "dashboard" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold" : "hover:bg-[var(--bg-accent)]"}`}>
            <BarChart2 size={18} />
            <span>Performance</span>
          </button>
        </nav>

        {!session ? (
          <div className="flex-1 flex flex-col justify-center">
            <button onClick={startNewSession} disabled={isLoading} className="px-6 py-4 rounded-xl bg-[var(--primary)] text-white font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
              {isLoading ? "ガチャを回しています..." : "トレーニングを開始"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-['Outfit'] text-lg">Session Info</h3>
            <div className="p-4 rounded-xl bg-[var(--bg-accent)] border border-[var(--border)] text-sm">
              <p className="text-[10px] text-[var(--text-dim)] uppercase">Industry</p>
              <p className="font-semibold">{session.industry}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-accent)] border border-[var(--border)] text-sm">
              <p className="text-[10px] text-[var(--text-dim)] uppercase">Theme</p>
              <p className="font-semibold line-clamp-2">{session.theme}</p>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="px-10 py-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-deep)]/50 backdrop-blur-md z-10">
          <h2 className="text-xl font-['Outfit']">Interview</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-[var(--text-dim)]">真因到達度</span>
              <div className="w-48 h-2 bg-[var(--bg-accent)] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${botReachability}%` }} className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" />
              </div>
            </div>
            {session?.status === "active" && messages.length >= 3 && (
              <button onClick={handleFinishSession} disabled={isEvaluating} className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${botReachability >= 80 ? "bg-[var(--success)] text-white" : "bg-[var(--bg-accent)] border border-[var(--border)]"}`}>
                {isEvaluating ? "分析中..." : "インタビュー終了"}
              </button>
            )}
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col max-w-[80%] ${m.role === "user" ? "ml-auto items-end" : "mr-auto"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">{m.role === "user" ? "You" : "Client"}</span>
                {m.id && <span className="text-[8px] text-[var(--text-dim)] opacity-30">#{m.id}</span>}
              </div>
              <div className={`p-5 rounded-2xl text-[15px] leading-relaxed ${m.role === "user" ? "bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white rounded-br-none" : "bg-[var(--bg-surface)] border border-[var(--border)] rounded-bl-none"}`}>
                {m.content}
              </div>
            </motion.div>
          ))}
          {isLoading && session && <div className="flex items-center gap-2 text-[var(--text-dim)] animate-pulse ml-4"><div className="w-2 h-2 rounded-full bg-current" /><div className="w-2 h-2 rounded-full bg-current delay-75" /><div className="w-2 h-2 rounded-full bg-current delay-150" /></div>}
        </div>

        {session && (
          <motion.button onClick={handleOpenHelp} className="absolute bottom-32 right-12 w-20 h-20 rounded-full bg-gradient-to-br from-[var(--secondary)] to-pink-500 flex items-center justify-center shadow-2xl z-50">
            {isHelpActive && <div className="absolute inset-0 rounded-full bg-[var(--secondary)] animate-ping opacity-40" />}
            <HelpCircle size={40} className="text-white relative z-10" />
            {isHelpActive && <span className="absolute -top-2 -right-2 bg-white text-[var(--secondary)] text-[10px] font-bold px-2 py-1 rounded-full shadow-md animate-bounce">ADVICE!</span>}
          </motion.button>
        )}

        <div className="p-10 bg-[var(--bg-deep)] border-t border-[var(--border)]">
          <div className={`relative flex items-end bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl focus-within:border-[var(--primary)] transition-all ${(!session || isEvaluating) && "opacity-30 pointer-events-none"}`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                  e.preventDefault();
                  if (input.trim()) {
                    handleSendMessage();
                  }
                }
              }}
              placeholder="質問を入力してください... (Shift+Enterで改行)"
              className="flex-1 bg-transparent border-none p-6 outline-none text-lg resize-none min-h-[60px] max-h-[200px]"
              rows={1}
            />
            <button onClick={handleSendMessage} disabled={isLoading} className="p-4 m-2 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 h-fit">
              <Send size={24} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isHelpModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHelpModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-[32px] p-10 overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" />
                <h3 className="text-2xl font-bold mb-8">上司の助け舟</h3>
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  {isLoading ? (
                    <p className="text-[var(--text-dim)] animate-pulse">考え中...</p>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                        li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-[var(--primary)]" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-[var(--bg-accent)] px-2 py-1 rounded text-sm" {...props} />,
                      }}
                    >
                      {messages[messages.length - 1]?.helpContent || "アドバイスはありません。"}
                    </ReactMarkdown>
                  )}
                </div>
                <div className="mt-10 flex justify-end"><button onClick={() => setIsHelpModalOpen(false)} className="px-8 py-3 rounded-xl bg-[var(--bg-accent)] font-bold border border-[var(--border)] hover:bg-[var(--bg-surface)] transition-all">了解</button></div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
