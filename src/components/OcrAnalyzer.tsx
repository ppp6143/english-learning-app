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
 * Load an image URL into an HTMLImageElement.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Convert image data to grayscale Uint8Array.
 */
function toGrayscale(data: Uint8ClampedArray, pixels: number): Uint8Array {
    const gray = new Uint8Array(pixels);
    for (let i = 0; i < pixels; i++) {
        gray[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
    }
    return gray;
}

/**
 * Apply histogram stretch (min-max normalization) in-place.
 */
function histogramStretch(gray: Uint8Array): void {
    let min = 255, max = 0;
    for (let i = 0; i < gray.length; i++) {
        if (gray[i] < min) min = gray[i];
        if (gray[i] > max) max = gray[i];
    }
    const range = max - min || 1;
    for (let i = 0; i < gray.length; i++) {
        gray[i] = Math.round(((gray[i] - min) / range) * 255);
    }
}

/**
 * Compute Otsu's threshold for a grayscale array.
 */
function otsuThreshold(gray: Uint8Array): number {
    const pixels = gray.length;
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < pixels; i++) histogram[gray[i]]++;

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
    return threshold;
}

/**
 * Detect skew angle using projection profile analysis.
 *
 * For each candidate angle, rotates the binary image and computes
 * the horizontal projection profile (sum of black pixels per row).
 * The angle that maximizes the variance of the profile is the one
 * where text lines are most horizontal.
 *
 * Uses a downsampled image for performance.
 */
function detectSkewAngle(gray: Uint8Array, width: number, height: number, threshold: number): number {
    // Downsample for speed — target max ~600px on longest side
    const MAX_DIM = 600;
    const scale = Math.min(1, MAX_DIM / Math.max(width, height));
    const sw = Math.round(width * scale);
    const sh = Math.round(height * scale);

    // Build downsampled binary image (1 = text/dark, 0 = background/light)
    const binary = new Uint8Array(sw * sh);
    for (let y = 0; y < sh; y++) {
        const srcY = Math.min(Math.round(y / scale), height - 1);
        for (let x = 0; x < sw; x++) {
            const srcX = Math.min(Math.round(x / scale), width - 1);
            binary[y * sw + x] = gray[srcY * width + srcX] <= threshold ? 1 : 0;
        }
    }

    const cx = sw / 2;
    const cy = sh / 2;

    // Scan angles from -15 to +15 degrees in 0.5° steps
    const ANGLE_MIN = -15;
    const ANGLE_MAX = 15;
    const ANGLE_STEP = 0.5;

    let bestAngle = 0;
    let bestVariance = -1;

    // Projection buffer reused across iterations
    const projSize = Math.ceil(Math.sqrt(sw * sw + sh * sh));
    const projection = new Float64Array(projSize);

    for (let angleDeg = ANGLE_MIN; angleDeg <= ANGLE_MAX; angleDeg += ANGLE_STEP) {
        const rad = (angleDeg * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        // Clear projection
        projection.fill(0);
        let minRow = projSize, maxRow = 0;

        // Rotate each text pixel and accumulate into horizontal projection
        for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
                if (binary[y * sw + x] === 0) continue;
                // Rotated y-coordinate determines the row in the projection
                const ry = Math.round(-sinA * (x - cx) + cosA * (y - cy) + cy);
                if (ry >= 0 && ry < projSize) {
                    projection[ry]++;
                    if (ry < minRow) minRow = ry;
                    if (ry > maxRow) maxRow = ry;
                }
            }
        }

        // Compute variance of the projection profile
        const count = maxRow - minRow + 1;
        if (count < 2) continue;

        let sum = 0;
        for (let r = minRow; r <= maxRow; r++) sum += projection[r];
        const mean = sum / count;

        let variance = 0;
        for (let r = minRow; r <= maxRow; r++) {
            const d = projection[r] - mean;
            variance += d * d;
        }
        variance /= count;

        if (variance > bestVariance) {
            bestVariance = variance;
            bestAngle = angleDeg;
        }
    }

    // Refine with finer steps around the best angle (±1° in 0.1° steps)
    const refineMin = bestAngle - 1;
    const refineMax = bestAngle + 1;
    for (let angleDeg = refineMin; angleDeg <= refineMax; angleDeg += 0.1) {
        const rad = (angleDeg * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        projection.fill(0);
        let minRow = projSize, maxRow = 0;

        for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
                if (binary[y * sw + x] === 0) continue;
                const ry = Math.round(-sinA * (x - cx) + cosA * (y - cy) + cy);
                if (ry >= 0 && ry < projSize) {
                    projection[ry]++;
                    if (ry < minRow) minRow = ry;
                    if (ry > maxRow) maxRow = ry;
                }
            }
        }

        const count = maxRow - minRow + 1;
        if (count < 2) continue;

        let sum = 0;
        for (let r = minRow; r <= maxRow; r++) sum += projection[r];
        const mean = sum / count;

        let variance = 0;
        for (let r = minRow; r <= maxRow; r++) {
            const d = projection[r] - mean;
            variance += d * d;
        }
        variance /= count;

        if (variance > bestVariance) {
            bestVariance = variance;
            bestAngle = angleDeg;
        }
    }

    return bestAngle;
}

/**
 * Rotate an image by a given angle (degrees) around its center.
 * Returns a new canvas data URL.
 */
function rotateByAngle(img: HTMLImageElement, angleDeg: number): string {
    const rad = (angleDeg * Math.PI) / 180;
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    // Compute new bounding box after rotation
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const newW = Math.ceil(w * cos + h * sin);
    const newH = Math.ceil(w * sin + h * cos);

    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newW, newH);

    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -w / 2, -h / 2);

    return canvas.toDataURL('image/png');
}

interface RawWord {
    text: string;
    bbox: { x0: number; y0: number; x1: number; y1: number };
    confidence: number;
}

/**
 * Merge word fragments that were incorrectly split by OCR.
 * If two adjacent words on the same line have a very small horizontal gap,
 * they are likely parts of one word and should be merged.
 */
function mergeFragmentedWords(words: RawWord[]): RawWord[] {
    if (words.length < 2) return words;

    // Sort by vertical midpoint (line), then horizontal position
    const sorted = [...words].sort((a, b) => {
        const aMidY = (a.bbox.y0 + a.bbox.y1) / 2;
        const bMidY = (b.bbox.y0 + b.bbox.y1) / 2;
        const minH = Math.min(a.bbox.y1 - a.bbox.y0, b.bbox.y1 - b.bbox.y0);
        if (Math.abs(aMidY - bMidY) > minH * 0.5) return aMidY - bMidY;
        return a.bbox.x0 - b.bbox.x0;
    });

    const merged: RawWord[] = [];
    let current = { ...sorted[0], bbox: { ...sorted[0].bbox } };

    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];

        // Check if on the same line
        const curMidY = (current.bbox.y0 + current.bbox.y1) / 2;
        const nextMidY = (next.bbox.y0 + next.bbox.y1) / 2;
        const minH = Math.min(
            current.bbox.y1 - current.bbox.y0,
            next.bbox.y1 - next.bbox.y0,
        );
        const sameLine = Math.abs(curMidY - nextMidY) < minH * 0.5;

        if (sameLine) {
            const gap = next.bbox.x0 - current.bbox.x1;
            // Average character width from both words
            const curCharW =
                (current.bbox.x1 - current.bbox.x0) / Math.max(1, current.text.length);
            const nextCharW =
                (next.bbox.x1 - next.bbox.x0) / Math.max(1, next.text.length);
            const avgCharW = (curCharW + nextCharW) / 2;

            // Merge only if gap is negligible (< 12% of character width) — true OCR splits
            if (gap < avgCharW * 0.12) {
                current = {
                    text: current.text + next.text,
                    bbox: {
                        x0: Math.min(current.bbox.x0, next.bbox.x0),
                        y0: Math.min(current.bbox.y0, next.bbox.y0),
                        x1: Math.max(current.bbox.x1, next.bbox.x1),
                        y1: Math.max(current.bbox.y1, next.bbox.y1),
                    },
                    confidence: Math.min(current.confidence, next.confidence),
                };
                continue;
            }
        }

        merged.push(current);
        current = { ...next, bbox: { ...next.bbox } };
    }
    merged.push(current);

    return merged;
}

interface PreprocessResult {
    ocrUrl: string;           // binarized image for OCR (with padding)
    padding: number;          // padding added around OCR image
    skewAngle: number;        // detected skew angle in degrees
    originalWidth: number;    // original image dimensions
    originalHeight: number;
    deskewedWidth: number;    // deskewed image dimensions (= original if no skew)
    deskewedHeight: number;
    wasDeskewed: boolean;
}

/**
 * Preprocess an image for better OCR accuracy:
 * 1. Grayscale conversion + contrast enhancement
 * 2. Skew detection via projection profile analysis
 * 3. Deskew rotation (if skew > 0.5°)
 * 4. Otsu binarization on the deskewed image
 *
 * Returns both the binarized OCR image and the deskewed display image.
 */
async function preprocessImage(imageUrl: string): Promise<PreprocessResult> {
    const img = await loadImage(imageUrl);
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    // --- Analyze grayscale to detect skew ---
    const analysisCanvas = document.createElement('canvas');
    analysisCanvas.width = w;
    analysisCanvas.height = h;
    const aCtx = analysisCanvas.getContext('2d')!;
    aCtx.drawImage(img, 0, 0);

    const aData = aCtx.getImageData(0, 0, w, h);
    const pixels = w * h;
    const gray = toGrayscale(aData.data, pixels);
    histogramStretch(gray);
    const threshold = otsuThreshold(gray);

    // --- Detect and correct skew ---
    const skewAngle = detectSkewAngle(gray, w, h, threshold);
    let sourceUrl = imageUrl;
    let wasDeskewed = false;
    if (Math.abs(skewAngle) > 0.5) {
        sourceUrl = rotateByAngle(img, -skewAngle);
        wasDeskewed = true;
    }

    // --- Binarize the (possibly deskewed) image ---
    const finalImg = await loadImage(sourceUrl);
    const finalW = finalImg.naturalWidth;
    const finalH = finalImg.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = finalW;
    canvas.height = finalH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(finalImg, 0, 0);

    const imageData = ctx.getImageData(0, 0, finalW, finalH);
    const finalPixels = finalW * finalH;
    const finalGray = toGrayscale(imageData.data, finalPixels);
    histogramStretch(finalGray);
    const finalThreshold = otsuThreshold(finalGray);

    const data = imageData.data;
    for (let i = 0; i < finalPixels; i++) {
        const val = finalGray[i] > finalThreshold ? 255 : 0;
        data[i * 4] = val;
        data[i * 4 + 1] = val;
        data[i * 4 + 2] = val;
    }

    ctx.putImageData(imageData, 0, 0);

    // Add white padding around OCR image for better edge character recognition
    const PADDING = 30;
    const paddedCanvas = document.createElement('canvas');
    paddedCanvas.width = finalW + PADDING * 2;
    paddedCanvas.height = finalH + PADDING * 2;
    const pCtx = paddedCanvas.getContext('2d')!;
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
    pCtx.drawImage(canvas, PADDING, PADDING);

    return {
        ocrUrl: paddedCanvas.toDataURL('image/png'),
        padding: PADDING,
        skewAngle,
        originalWidth: w,
        originalHeight: h,
        deskewedWidth: finalW,
        deskewedHeight: finalH,
        wasDeskewed,
    };
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
                const preprocess = await preprocessImage(imageUrl);

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

                const result = await worker.recognize(preprocess.ocrUrl);
                const pad = preprocess.padding;

                // Step 1: Extract words and adjust bboxes for padding offset
                const ocrWords: RawWord[] = result.data.words
                    .filter((w) => w.text.trim().length > 0)
                    .filter((w) => w.confidence >= 40)
                    .map((w) => ({
                        text: w.text.trim(),
                        bbox: {
                            x0: w.bbox.x0 - pad,
                            y0: w.bbox.y0 - pad,
                            x1: w.bbox.x1 - pad,
                            y1: w.bbox.y1 - pad,
                        },
                        confidence: w.confidence,
                    }));

                // Step 2: Merge word fragments split by OCR
                const mergedWords = mergeFragmentedWords(ocrWords);

                // Step 3: Transform bboxes from deskewed space back to original image space
                let finalWords: RawWord[] = mergedWords;
                if (preprocess.wasDeskewed) {
                    const s = preprocess.skewAngle * Math.PI / 180;
                    const cosS = Math.cos(s);
                    const sinS = Math.sin(s);
                    const dCx = preprocess.deskewedWidth / 2;
                    const dCy = preprocess.deskewedHeight / 2;
                    const oCx = preprocess.originalWidth / 2;
                    const oCy = preprocess.originalHeight / 2;

                    finalWords = mergedWords.map((w) => {
                        const bCx = (w.bbox.x0 + w.bbox.x1) / 2;
                        const bCy = (w.bbox.y0 + w.bbox.y1) / 2;
                        const bW = w.bbox.x1 - w.bbox.x0;
                        const bH = w.bbox.y1 - w.bbox.y0;

                        // Inverse rotation: deskewed center → original center
                        const dx = bCx - dCx;
                        const dy = bCy - dCy;
                        const origCx = cosS * dx - sinS * dy + oCx;
                        const origCy = sinS * dx + cosS * dy + oCy;

                        return {
                            ...w,
                            bbox: {
                                x0: origCx - bW / 2,
                                y0: origCy - bH / 2,
                                x1: origCx + bW / 2,
                                y1: origCy + bH / 2,
                            },
                        };
                    });
                }

                // Step 4: Clean text
                const rawWords = finalWords
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
                return {
                    words,
                    skewAngle: preprocess.wasDeskewed ? preprocess.skewAngle : 0,
                };
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'OCR analysis failed';
                setError(msg);
                return { words: [], skewAngle: 0 };
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
