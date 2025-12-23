"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  RefreshCw,
  ChevronRight,
  Brain,
  Target,
  User as UserIcon,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Trophy,
  History,
  Info
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Message = {
  role: "user" | "model" | "system";
  content: string;
};

type GameState = "welcome" | "training" | "evaluation" | "result";

import {
  Flame,
  Star,
  LineChart,
  BookOpen,
  ArrowLeft
} from "lucide-react";
import {
  getStoredStats,
  saveStats,
  updateStreak,
  calculateXP,
  calculateLevel,
  initialStats,
  type UserStats,
  type GameSession
} from "@/lib/storage";

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [view, setView] = useState<"game" | "dashboard" | "notes">("game");
  const [difficulty, setDifficulty] = useState("Medium");
  const [industry, setIndustry] = useState("製造業");
  const [theme, setTheme] = useState("在庫管理システム");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [reachability, setReachability] = useState(0);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [detailedEval, setDetailedEval] = useState<any>(null);

  // Initialize stats on mount
  useEffect(() => {
    setStats(getStoredStats());
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startGame = async () => {
    setIsLoading(true);
    setGameState("training");
    setQuestionCount(0);
    setReachability(0);

    const startMessage = `ゲームを開始してください。\n難易度：${difficulty}\n業界：${industry}\nテーマ：${theme}`;

    const initialMessages: Message[] = [
      { role: "user", content: startMessage }
    ];
    setMessages(initialMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: initialMessages }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages([...initialMessages, { role: "model", content: data.content }]);
    } catch (error) {
      console.error(error);
      setMessages([...initialMessages, { role: "system", content: "エラーが発生しました。リロードしてください。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setQuestionCount(prev => prev + 1);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Extract Reachability if present in response
      const reachabilityMatch = data.content.match(/真因到達度：(\d+)%/);
      if (reachabilityMatch) {
        setReachability(parseInt(reachabilityMatch[1]));
      }

      setMessages([...newMessages, { role: "model", content: data.content }]);

      // If question count reaches 10, move to evaluation
      if (questionCount >= 9) {
        // This will be handled after the model returns the 10th response
      }
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: "system", content: "エラーが発生しました。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const goToEvaluation = () => {
    setGameState("evaluation");
  };

  const submitEvaluation = async (evaluationData: any) => {
    setIsLoading(true);
    const evalMessage = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n真因の特定\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n真因：${evaluationData.rootCause}\n\n理由：${evaluationData.reason}\n\n推奨アプローチ：${evaluationData.approach}`;

    const newMessages: Message[] = [...messages, { role: "user", content: evalMessage }];
    setMessages(newMessages);

    try {
      // 1. Get General Evaluation
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      const finalMessages = [...newMessages, { role: "model", content: data.content }];
      setMessages(finalMessages);

      // 2. Trigger Detailed Skill Evaluation (Parallel/Background)
      const detailedResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...finalMessages, { role: "user", content: "上記の内容をもとに、詳細なスキル評価を行ってください。" }]
        }),
      });
      const detailedData = await detailedResponse.json();

      // Parse detailed scores
      const structureScore = parseInt(detailedData.content.match(/\[STRUCTURE_SCORE: (\d+)\]/)?.[1] || "70");
      const empathyScore = parseInt(detailedData.content.match(/\[EMPATHY_SCORE: (\d+)\]/)?.[1] || "70");
      const hypothesisScore = parseInt(detailedData.content.match(/\[HYPOTHESIS_SCORE: (\d+)\]/)?.[1] || "70");
      const score = parseInt(data.content.match(/到達度：(\d+)/)?.[1] || "0");

      setDetailedEval({
        structure: structureScore,
        empathy: empathyScore,
        hypothesis: hypothesisScore
      });

      // 3. Update Persistence
      const newSession: GameSession = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        scenario: `${industry} / ${theme}`,
        score: score,
        reachability: reachability,
        categoryScores: {
          structure: structureScore,
          empathy: empathyScore,
          hypothesis: hypothesisScore
        },
        goodQuestions: detailedData.content.split("[GOOD_QUESTIONS]")[1]?.split("[HABITS]")[0]?.split("\n").filter((l: string) => l.startsWith("-")).map((l: string) => l.replace("-", "").trim()) || [],
        reflections: detailedData.content.split("[HABITS]")[1]?.trim() || ""
      };

      const updatedStats = { ...stats };
      updatedStats.sessions.unshift(newSession);
      const xpEarned = calculateXP(score, reachability);
      updatedStats.totalXP += xpEarned;
      const statsWithStreak = updateStreak(updatedStats);
      statsWithStreak.level = calculateLevel(statsWithStreak.totalXP);

      setStats(statsWithStreak);
      saveStats(statsWithStreak);

      setGameState("result");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl flex-1 flex flex-col">

        {/* Header */}
        <header className="mb-8 flex justify-between items-center bg-surface/30 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden md:block">真因特定トレーニング</h1>
            </div>

            <nav className="flex items-center gap-1 bg-background/50 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setView("game")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                  view === "game" ? "bg-primary text-white shadow-lg" : "text-muted hover:text-foreground"
                )}
              >
                <Target className="w-4 h-4" />
                トレーニング
              </button>
              <button
                onClick={() => setView("dashboard")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                  view === "dashboard" ? "bg-primary text-white shadow-lg" : "text-muted hover:text-foreground"
                )}
              >
                <UserIcon className="w-4 h-4" />
                マイページ
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-full border border-orange-500/20">
              <Flame className="w-4 h-4 fill-current" />
              <span className="text-sm font-black">{stats.streak}</span>
            </div>
            {gameState !== "welcome" && (
              <button
                onClick={() => window.location.reload()}
                className="text-muted hover:text-foreground p-2 transition-colors"
                title="リセット"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Star className="w-6 h-6 text-primary fill-primary/20" />
                  </div>
                  <div className="text-2xl font-black">{stats.level}</div>
                  <div className="text-xs text-muted uppercase tracking-widest">Level</div>
                </div>
                <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-3">
                    <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
                  </div>
                  <div className="text-2xl font-black">{stats.streak} 日</div>
                  <div className="text-xs text-muted uppercase tracking-widest">Streak</div>
                </div>
                <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-3">
                    <Trophy className="w-6 h-6 text-indigo-500 fill-indigo-500/20" />
                  </div>
                  <div className="text-2xl font-black">{stats.totalXP}</div>
                  <div className="text-xs text-muted uppercase tracking-widest">Total XP</div>
                </div>
              </div>

              {/* Growth Curve Placeholder / Skill Balance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-8 rounded-2xl space-y-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-primary" />
                    スキルバランス
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: "構造化力", key: "structure", color: "bg-blue-500" },
                      { label: "共感・傾聴力", key: "empathy", color: "bg-green-500" },
                      { label: "仮説検証力", key: "hypothesis", color: "bg-purple-500" },
                    ].map((s) => {
                      const avg = stats.sessions.length > 0
                        ? Math.round(stats.sessions.reduce((acc, curr) => acc + (curr.categoryScores?.[s.key as keyof typeof curr.categoryScores] || 0), 0) / stats.sessions.length)
                        : 0;
                      return (
                        <div key={s.key} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold px-1">
                            <span>{s.label}</span>
                            <span>{avg}</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${avg}%` }}
                              className={cn("h-full", s.color)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass p-8 rounded-2xl space-y-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    インタビュー攻略ノート概要
                  </h3>
                  <div className="space-y-4 text-sm text-muted">
                    <p>保存された「良い質問」: {stats.sessions.reduce((acc, s) => acc + (s.goodQuestions?.length || 0), 0)}件</p>
                    <p>克服すべき思考の癖: {stats.sessions.filter(s => s.reflections).length}件の分析</p>
                    <button
                      onClick={() => setView("notes")}
                      className="w-full py-3 bg-surface border border-slate-800 rounded-xl hover:bg-slate-800 transition-all font-bold text-foreground flex items-center justify-center gap-2"
                    >
                      詳細を見る
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="p-4 bg-surface/50 border-b border-slate-800 font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-muted" />
                  最近のトレーニング履歴
                </div>
                <div className="divide-y divide-slate-800">
                  {stats.sessions.length > 0 ? (
                    stats.sessions.slice(0, 5).map((s) => (
                      <div key={s.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div>
                          <div className="font-bold text-sm">{s.scenario}</div>
                          <div className="text-[10px] text-muted">{new Date(s.date).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-black text-primary">{s.score}点</div>
                            <div className="text-[10px] text-muted leading-none">到達度</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-700" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-muted text-sm">トレーニング履歴がまだありません</div>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {view === "notes" && (
            <motion.section
              key="notes"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("dashboard")}
                  className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">インタビュー攻略ノート</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-success flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    あなたの「必殺質問」集
                  </h3>
                  <div className="space-y-3">
                    {stats.sessions.flatMap(s => s.goodQuestions).length > 0 ? (
                      stats.sessions.flatMap(s => s.goodQuestions).slice(0, 10).map((q, i) => (
                        <div key={i} className="glass p-4 rounded-xl text-sm border-l-2 border-success">
                          {q}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted p-4">まだ記録された質問がありません。</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-warning flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    克服すべき思考の癖
                  </h3>
                  <div className="space-y-3">
                    {stats.sessions.filter(s => s.reflections).length > 0 ? (
                      stats.sessions.filter(s => s.reflections).slice(0, 5).map((s, i) => (
                        <div key={i} className="glass p-4 rounded-xl text-sm border-l-2 border-warning whitespace-pre-wrap">
                          <div className="text-[10px] uppercase font-bold text-muted mb-1">{s.scenario}</div>
                          {s.reflections}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted p-4">まだ分析された癖がありません。</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {view === "game" && (
            <div className="flex-1 flex flex-col min-h-0">
              {gameState === "welcome" && (
                <motion.section
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass p-8 rounded-2xl space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold">あなたの質問力を、実戦形式で。</h2>
                    <p className="text-muted">ITコンサルタント向けの真因特定トレーニングゲームです。クライアントの本質的な課題を見つけ出してください。</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-muted">難易度</label>
                      <div className="flex gap-2">
                        {["Easy", "Medium", "Hard"].map((d) => (
                          <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            className={cn(
                              "flex-1 py-2 px-4 rounded-lg border transition-all",
                              difficulty === d
                                ? "bg-primary border-primary text-white"
                                : "border-slate-800 hover:border-slate-700 text-muted"
                            )}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-muted">業界 / テーマ</label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-surface border border-slate-800 rounded-lg p-2.5 outline-none focus:border-primary transition-colors"
                      >
                        <option>製造業</option>
                        <option>小売業</option>
                        <option>医療・ヘルスケア</option>
                        <option>金融・保険</option>
                        <option>物流・運輸</option>
                        <option>サービス業（BtoB）</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={startGame}
                    disabled={isLoading}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                    トレーニングを開始する
                  </button>
                </motion.section>
              )}

              {gameState === "training" && (
                <motion.section
                  key="training"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Progress Bar Area */}
                  <div className="flex items-center gap-4 mb-4 bg-surface/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted">
                        <span>質問回数: {questionCount}/10</span>
                        <span>到達度: {reachability}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${(questionCount / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    {questionCount >= 10 && !isLoading && (
                      <button
                        onClick={goToEvaluation}
                        className="bg-success text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse hover:scale-105 transition-transform"
                      >
                        真因特定へ進む
                      </button>
                    )}
                  </div>

                  {/* Chat Log */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-6 pb-6 pr-2 scroll-smooth"
                  >
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                        {m.role !== "system" && (
                          <div className="flex items-center gap-2 mb-1 px-1">
                            {m.role === "user" ? (
                              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">You</span>
                            ) : (
                              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Facilitator / Client</span>
                            )}
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                          m.role === "user"
                            ? "bg-primary/20 border border-primary/20 text-indigo-50 rounded-tr-none"
                            : m.role === "system"
                              ? "bg-danger/10 border border-danger/20 text-danger w-full text-center italic"
                              : "bg-surface border border-slate-800 text-slate-200 rounded-tl-none"
                        )}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Facilitator</span>
                        </div>
                        <div className="bg-surface border border-slate-800 p-4 rounded-2xl rounded-tl-none">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="mt-4 relative group">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                          handleSend();
                        }
                      }}
                      placeholder={questionCount < 10 ? "クライアントへの質問を入力してください..." : "これ以上質問はできません。結果を確認してください。"}
                      disabled={isLoading || questionCount >= 10}
                      className="w-full bg-slate-900 border border-slate-800 rounded-full py-4 pl-6 pr-16 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-sm group-hover:border-slate-700"
                    />
                    <button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim() || questionCount >= 10}
                      className="absolute right-2 top-1.5 p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:bg-slate-800 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </motion.section>
              )}

              {gameState === "evaluation" && (
                <motion.section
                  key="evaluation"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-8 rounded-2xl space-y-8"
                >
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-success/10 rounded-full mb-2">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold">質問フェーズ完了！</h2>
                    <p className="text-muted">収集した情報をもとに、あなたの分析をまとめてください。</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-muted">特定した「真因」と「推奨アクション」</label>
                        <button
                          onClick={async () => {
                            setIsLoading(true);
                            const draftPrompt = "これまでの会話を踏まえて、私が特定すべき真因と推奨アクションの下書きを、箇条書きで短く作成してください。";
                            const response = await fetch("/api/chat", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ messages: [...messages, { role: "user", content: draftPrompt }] }),
                            });
                            const data = await response.json();
                            (document.getElementById("rootCause") as HTMLTextAreaElement).value = data.content;
                            setIsLoading(false);
                          }}
                          className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30 transition-colors flex items-center gap-1"
                        >
                          <Brain className="w-3 h-3" />
                          AIに下書きを依頼する
                        </button>
                      </div>
                      <textarea
                        id="rootCause"
                        rows={8}
                        className="w-full bg-surface border border-slate-800 rounded-lg p-4 outline-none focus:border-primary text-sm leading-relaxed"
                        placeholder="例：現場の属人化による標準プロセスの欠如。そのため、まずはプロセスの可視化と標準化が必要です。"
                      />
                      <p className="text-[10px] text-muted italic">※「真因」「理由」「アプローチ」を含めて自由に記述してください。</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const content = (document.getElementById("rootCause") as HTMLTextAreaElement).value;
                      submitEvaluation({
                        rootCause: content,
                        reason: "上記に含む",
                        approach: "上記に含む"
                      });
                    }}
                    disabled={isLoading}
                    className="w-full py-4 bg-success hover:bg-success/90 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
                  >
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                    最終分析を提出して評価を見る
                  </button>
                </motion.section>
              )}

              {gameState === "result" && (
                <motion.section
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col min-h-0 space-y-6 pb-12"
                >
                  <div className="text-center space-y-4 mb-4">
                    <div className="inline-flex relative">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12 }}
                        className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20"
                      >
                        <div className="text-center">
                          <span className="block text-3xl font-black text-primary">
                            {messages[messages.length - 1].content.match(/到達度：(\d+)/)?.[1] || "???"}
                          </span>
                          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Score</span>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        delay={0.5}
                        className="absolute -right-4 -top-2 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg shadow-amber-500/20"
                      >
                        <Trophy className="w-3 h-3" />
                        {parseInt(messages[messages.length - 1].content.match(/到達度：(\d+)/)?.[1] || "0") >= 80 ? "EXCELLENT" : "FINISHED"}
                      </motion.div>
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold tracking-tight">トレーニング総評</h2>
                      {detailedEval && (
                        <div className="flex justify-center gap-4 text-[10px] font-bold text-muted uppercase tracking-widest">
                          <span>構造: {detailedEval.structure}</span>
                          <span>共感: {detailedEval.empathy}</span>
                          <span>仮説: {detailedEval.hypothesis}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strength Card */}
                    <div className="glass p-6 rounded-2xl border-l-4 border-l-success">
                      <div className="flex items-center gap-2 mb-3 text-success">
                        <CheckCircle2 className="w-5 h-5" />
                        <h3 className="font-bold">あなたの強み</h3>
                      </div>
                      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {messages[messages.length - 1].content.split("あなたの強み")[1]?.split("改善ポイント")[0]?.replace(/━+/g, "").trim() || "分析中..."}
                      </div>
                    </div>

                    {/* Improvement Card */}
                    <div className="glass p-6 rounded-2xl border-l-4 border-l-warning">
                      <div className="flex items-center gap-2 mb-3 text-warning">
                        <AlertCircle className="w-5 h-5" />
                        <h3 className="font-bold">改善ポイント</h3>
                      </div>
                      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {messages[messages.length - 1].content.split("改善ポイント")[1]?.split("模範解答例")[0]?.replace(/━+/g, "").trim() || "分析中..."}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <button
                      onClick={() => window.location.reload()}
                      className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      新しいシナリオで開始
                    </button>
                    <button
                      onClick={() => setView("dashboard")}
                      className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <History className="w-5 h-5" />
                      履歴・成長を確認
                    </button>
                  </div>
                </motion.section>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
