import { describe, it, expect } from 'vitest';
import { extractReachability, extractAndParseJSON } from '../test-utils';

describe('AI Role Format Verification', () => {

    describe('Facilitator Role', () => {
        it('should correctly extract reachability marker from a sample response', () => {
            const sampleResponse = "おっしゃる通りですね。システムの遅延については現場からも不満が出ています。\n\n真因到達度：30%";
            const reachability = extractReachability(sampleResponse);
            expect(reachability).toBe(30);
        });
    });

    describe('Mentor Role', () => {
        it('should correctly parse the scenario and briefing JSON', () => {
            const sampleResponse = "```json\n{\n  \"briefing\": \"今日は共感にフォーカスしましょう。\",\n  \"scenario\": {\n    \"surface\": \"残業時間が減らない\",\n    \"hiddenRootCause\": \"評価制度への不信感\",\n    \"clientPersonality\": \"慎重派の課長\"\n  }\n}\n```";
            const data = extractAndParseJSON<{
                briefing: string;
                scenario: { surface: string; hiddenRootCause: string; clientPersonality: string };
            }>(sampleResponse);

            expect(data?.briefing).toContain("共感");
            expect(data?.scenario.surface).toBe("残業時間が減らない");
            expect(data?.scenario.hiddenRootCause).toBe("評価制度への不信感");
        });
    });

    describe('Reviewer Role', () => {
        it('should correctly parse the evaluation report JSON', () => {
            const sampleResponse = "```json\n{\n  \"scores\": { \"structure\": 85, \"empathy\": 60, \"hypothesis\": 70 },\n  \"summaryFeedback\": \"素晴らしい構造化でした。\",\n  \"clips\": [\n    {\n      \"original\": \"なぜ遅いのですか？\",\n      \"better\": \"遅延が発生している背景を伺えますか？\",\n      \"reason\": \"威圧感を減らすため\"\n    }\n  ],\n  \"thinkingHabits\": [\"結論から問う傾向\"]\n}\n```";
            const data = extractAndParseJSON<{
                scores: { structure: number; empathy: number; hypothesis: number };
                clips: Array<{ original: string; better: string; reason: string }>;
                thinkingHabits: string[];
            }>(sampleResponse);

            expect(data?.scores.structure).toBe(85);
            expect(data?.clips[0].better).toContain("背景");
            expect(data?.thinkingHabits).toContain("結論から問う傾向");
        });
    });

    describe('Helper Role', () => {
        it('should be valid Markdown (structural check only)', () => {
            const sampleResponse = "### 現状の整理\n対話が平行線です。\n### 停滞している理由\n信頼が足りません。\n### 上司のアドバイス\nまずは雑談から始めましょう。";
            expect(sampleResponse).toContain("### 現状の整理");
            expect(sampleResponse).toContain("### 上司のアドバイス");
        });
    });
});
