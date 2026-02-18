'use client';

import { useCallback, useState } from 'react';
import { createWorker, Worker, PSM } from 'tesseract.js';
import { OcrWord } from '@/src/lib/types';
import { CEFRLevel, getWordLevelAsync, getRelativeDifficulty } from '@/src/lib/wordLevels';

interface UseOcrResult {
    analyze: (imageUrl: string, userLevel: CEFRLevel) => Promise<OcrWord[]>;
    isAnalyzing: boolean;
    progress: number;
    error: string | null;
}

export function useOcr(): UseOcrResult {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const analyze = useCallback(
        async (imageUrl: string, userLevel: CEFRLevel): Promise<OcrWord[]> => {
            setIsAnalyzing(true);
            setProgress(0);
            setError(null);

            let worker: Worker | null = null;

            try {
                worker = await createWorker('eng', 1, {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    },
                });

                // Enable Orientation and Script Detection (OSD) for slanted/rotated text
                await worker.setParameters({
                    tessedit_pageseg_mode: PSM.AUTO_OSD,
                });

                const result = await worker.recognize(imageUrl);

                // Pre-process raw OCR words
                const rawWords = result.data.words
                    .filter((w) => w.text.trim().length > 0)
                    .map((w) => {
                        const text = w.text
                            .replace(/^[^a-zA-Z]+/, '')
                            .replace(/[^a-zA-Z]+$/, '')
                            .replace(/[^a-zA-Z'-]/g, '');
                        return { text, bbox: w.bbox, confidence: w.confidence };
                    })
                    .filter((w) => w.text.length > 0);

                // Build context for each word (±3 surrounding words)
                const CONTEXT_WINDOW = 3;

                const words: OcrWord[] = await Promise.all(
                    rawWords.map(async (w, index) => {
                        const level = await getWordLevelAsync(w.text);
                        const difficulty = getRelativeDifficulty(w.text, userLevel);

                        // Build context string from surrounding words
                        const start = Math.max(0, index - CONTEXT_WINDOW);
                        const end = Math.min(rawWords.length - 1, index + CONTEXT_WINDOW);
                        const contextWords: string[] = [];
                        for (let i = start; i <= end; i++) {
                            contextWords.push(rawWords[i].text);
                        }
                        const context = contextWords.join(' ');

                        return {
                            text: w.text,
                            bbox: {
                                x0: w.bbox.x0,
                                y0: w.bbox.y0,
                                x1: w.bbox.x1,
                                y1: w.bbox.y1,
                            },
                            confidence: w.confidence,
                            level,
                            difficulty,
                            context,
                        };
                    })
                );

                setProgress(100);
                return words;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'OCR analysis failed';
                setError(msg);
                return [];
            } finally {
                if (worker) {
                    await worker.terminate();
                }
                setIsAnalyzing(false);
            }
        },
        []
    );

    return { analyze, isAnalyzing, progress, error };
}
