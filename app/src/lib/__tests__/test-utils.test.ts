import { describe, it, expect } from 'vitest';
import { extractReachability, extractAndParseJSON } from '../test-utils';

describe('AI Response Utilities', () => {
    describe('extractReachability', () => {
        it('should extract reachability percentage from text', () => {
            const text = "対話ありがとうございます。真因到達度：45%";
            expect(extractReachability(text)).toBe(45);
        });

        it('should return null if no reachability marker is found', () => {
            const text = "まだ途中です。";
            expect(extractReachability(text)).toBeNull();
        });
    });

    describe('extractAndParseJSON', () => {
        it('should extract and parse JSON from a code block', () => {
            const text = "ここに結果を出します。\n```json\n{\"scores\": {\"structure\": 80}}\n```";
            const result = extractAndParseJSON<{ scores: { structure: number } }>(text);
            expect(result?.scores.structure).toBe(80);
        });

        it('should parse raw JSON without code blocks', () => {
            const text = "{\"key\": \"value\"}";
            const result = extractAndParseJSON<{ key: string }>(text);
            expect(result?.key).toBe("value");
        });

        it('should return null for invalid JSON', () => {
            const text = "これはJSONではありません。";
            expect(extractAndParseJSON(text)).toBeNull();
        });
    });
});
