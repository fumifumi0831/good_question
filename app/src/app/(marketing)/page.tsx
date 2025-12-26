"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, BarChart2, Target, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-main)]">
            {/* Header */}
            <header className="border-b border-[var(--border)] bg-[var(--bg-deep)]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-2xl font-bold text-[var(--primary)]">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]" />
                        <span className="font-['Outfit']">good_question</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/signin" className="px-4 py-2 rounded-xl hover:bg-[var(--bg-accent)] transition-all">
                            ログイン
                        </Link>
                        <Link href="/auth/signup" className="px-6 py-2 rounded-xl bg-[var(--primary)] text-white font-bold hover:scale-105 transition-all">
                            無料で始める
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-6">
                        <Sparkles size={16} className="text-[var(--primary)]" />
                        <span className="text-sm font-bold text-[var(--primary)]">AI 駆動のコンサルタント育成</span>
                    </div>
                    <h1 className="text-6xl font-bold font-['Outfit'] mb-6 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                        質問力を、<br />科学する。
                    </h1>
                    <p className="text-xl text-[var(--text-dim)] mb-10 max-w-2xl mx-auto leading-relaxed">
                        AI がクライアント役を演じ、あなたの質問力を徹底的に鍛えます。<br />
                        外科手術型添削で、真因に到達する質問スキルを習得。
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/auth/signup" className="px-8 py-4 rounded-2xl bg-[var(--primary)] text-white font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-2">
                            今すぐ無料で始める
                            <ArrowRight size={20} />
                        </Link>
                        <Link href="#features" className="px-8 py-4 rounded-2xl bg-[var(--bg-accent)] border border-[var(--border)] font-bold text-lg hover:bg-[var(--bg-surface)] transition-all">
                            機能を見る
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="max-w-7xl mx-auto px-6 py-20">
                <h2 className="text-4xl font-bold text-center mb-16 font-['Outfit']">3つの核心機能</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel p-8 rounded-[32px] hover:scale-105 transition-all"
                    >
                        <MessageSquare size={40} className="text-[var(--primary)] mb-4" />
                        <h3 className="text-2xl font-bold mb-4">AI インタビュー</h3>
                        <p className="text-[var(--text-dim)] leading-relaxed">
                            AI がリアルなクライアント役を演じ、あなたの質問に応答。真因到達度をリアルタイムで可視化します。
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-8 rounded-[32px] hover:scale-105 transition-all"
                    >
                        <Target size={40} className="text-[var(--secondary)] mb-4" />
                        <h3 className="text-2xl font-bold mb-4">外科手術型添削</h3>
                        <p className="text-[var(--text-dim)] leading-relaxed">
                            あなたの質問を AI が分析し、より良い質問例を提示。構造化力・共感力・仮説検証力を評価します。
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-8 rounded-[32px] hover:scale-105 transition-all"
                    >
                        <BarChart2 size={40} className="text-[var(--success)] mb-4" />
                        <h3 className="text-2xl font-bold mb-4">成長可視化</h3>
                        <p className="text-[var(--text-dim)] leading-relaxed">
                            過去のセッションを分析し、スコアトレンドと弱点を可視化。あなたの成長を数値で実感できます。
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <h2 className="text-4xl font-bold text-center mb-16 font-['Outfit']">シンプルな料金プラン</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="glass-panel p-8 rounded-[32px] border-2 border-[var(--border)]">
                        <h3 className="text-2xl font-bold mb-2">Free</h3>
                        <p className="text-[var(--text-dim)] mb-6">まずは試してみる</p>
                        <div className="text-4xl font-bold mb-6">¥0<span className="text-lg text-[var(--text-dim)]">/月</span></div>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
                                </div>
                                <span>1日1回まで無料</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
                                </div>
                                <span>全機能利用可能</span>
                            </li>
                        </ul>
                        <Link href="/auth/signup" className="block w-full px-6 py-3 rounded-xl bg-[var(--bg-accent)] border border-[var(--border)] font-bold text-center hover:bg-[var(--bg-surface)] transition-all">
                            無料で始める
                        </Link>
                    </div>
                    <div className="glass-panel p-8 rounded-[32px] border-2 border-[var(--primary)] relative overflow-hidden">
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                            人気
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Pro</h3>
                        <p className="text-[var(--text-dim)] mb-6">本格的にスキルアップ</p>
                        <div className="text-4xl font-bold mb-6">¥980<span className="text-lg text-[var(--text-dim)]">/月</span></div>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                                </div>
                                <span className="font-bold">無制限利用</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                                </div>
                                <span>全機能利用可能</span>
                            </li>
                        </ul>
                        <Link href="/auth/signup" className="block w-full px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-bold text-center hover:scale-105 transition-all shadow-lg shadow-indigo-500/30">
                            Pro で始める
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[var(--border)] py-8">
                <div className="max-w-7xl mx-auto px-6 text-center text-[var(--text-dim)] text-sm">
                    <p>© 2025 good_question. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
