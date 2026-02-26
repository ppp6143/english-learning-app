'use client';

import { useCallback, useState } from 'react';
import { createWorker, Worker, PSM } from 'tesseract.js';
import { OcrWord, OcrResult } from '@/src/lib/types';
import { CEFRLevel, getWordLevelAsync, getRelativeDifficulty } from '@/src/lib/wordLevels';

interface UseOcrResult {
    analyze: (imageUrl: string, userLevel: CEFRLevel) => Promise<OcrResult>;
    isAnalyzing: boolean;
    progress: number;
    error: string | null;
}

/**
 * Preprocess an image for better OCR accuracy:
 * 1. Grayscale conversion
 * 2. Contrast enhancement via histogram stretch (min-max normalization)
 * 3. Otsu's method binarization
 */
function preprocessImage(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const pixels = canvas.width * canvas.height;

            // Step 1: Convert to grayscale
            const gray = new Uint8Array(pixels);
            for (let i = 0; i < pixels; i++) {
                const r = data[i * 4];
                const g = data[i * 4 + 1];
                const b = data[i * 4 + 2];
                gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            }

            // Step 2: Histogram stretch (min-max normalization)
            let min = 255, max = 0;
            for (let i = 0; i < pixels; i++) {
                if (gray[i] < min) min = gray[i];
                if (gray[i] > max) max = gray[i];
            }
            const range = max - min || 1;
            for (let i = 0; i < pixels; i++) {
                gray[i] = Math.round(((gray[i] - min) / range) * 255);
            }

            // Step 3: Otsu's threshold
            const histogram = new Array(256).fill(0);
            for (let i = 0; i < pixels; i++) {
                histogram[gray[i]]++;
            }

            let sum = 0;
            for (let i = 0; i < 256; i++) sum += i * histogram[i];

            let sumB = 0, wB = 0, wF = 0;
            let maxVariance = 0, threshold = 128;

            for (let t = 0; t < 256; t++) {
                wB += histogram[t];
                if (wB === 0) continue;
                wF = pixels - wB;
                if (wF === 0) break;

                sumB += t * histogram[t];
                const mB = sumB / wB;
                const mF = (sum - sumB) / wF;
                const variance = wB * wF * (mB - mF) * (mB - mF);

                if (variance > maxVariance) {
                    maxVariance = variance;
                    threshold = t;
                }
            }

            // Apply binarization and write back
            for (let i = 0; i < pixels; i++) {
                const val = gray[i] > threshold ? 255 : 0;
                data[i * 4] = val;
                data[i * 4 + 1] = val;
                data[i * 4 + 2] = val;
                // alpha stays unchanged
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}

export function useOcr(): UseOcrResult {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const analyze = useCallback(
        async (imageUrl: string, userLevel: CEFRLevel): Promise<OcrResult> => {
            setIsAnalyzing(true);
            setProgress(0);
            setError(null);

            let worker: Worker | null = null;

            try {
                // Preprocess image for better OCR accuracy
                const preprocessedUrl = await preprocessImage(imageUrl);

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

                const result = await worker.recognize(preprocessedUrl);

                const rawWords = result.data.words
                    .filter((w) => w.text.trim().length > 0)
                    .filter((w) => w.confidence >= 40) // Filter low-confidence words
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
                return { words };
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'OCR analysis failed';
                setError(msg);
                return { words: [] };
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
