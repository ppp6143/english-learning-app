'use client';

import { useCallback, useState } from 'react';
import { createWorker, Worker, PSM } from 'tesseract.js';
import { OcrWord, OcrResult, OcrEngine } from '@/src/lib/types';
import { CEFRLevel, getWordLevelAsync, getRelativeDifficulty } from '@/src/lib/wordLevels';

interface UseOcrResult {
    analyze: (imageUrl: string, userLevel: CEFRLevel, engine?: OcrEngine) => Promise<OcrResult>;
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
 * Separable 2-pass box blur (horizontal then vertical), modifies src in-place.
 */
function boxBlur(src: Uint8Array, w: number, h: number, radius: number): void {
    const len = w * h;
    const tmp = new Uint8Array(len);
    const diam = radius * 2 + 1;

    // Horizontal pass -> tmp
    for (let y = 0; y < h; y++) {
        let sum = 0;
        const off = y * w;
        for (let x = -radius; x <= radius; x++) {
            sum += src[off + Math.max(0, Math.min(x, w - 1))];
        }
        tmp[off] = (sum / diam) | 0;
        for (let x = 1; x < w; x++) {
            sum += src[off + Math.min(x + radius, w - 1)] - src[off + Math.max(x - radius - 1, 0)];
            tmp[off + x] = (sum / diam) | 0;
        }
    }

    // Vertical pass -> src
    for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let y = -radius; y <= radius; y++) {
            sum += tmp[Math.max(0, Math.min(y, h - 1)) * w + x];
        }
        src[x] = (sum / diam) | 0;
        for (let y = 1; y < h; y++) {
            sum += tmp[Math.min(y + radius, h - 1) * w + x] - tmp[Math.max(y - radius - 1, 0) * w + x];
            src[y * w + x] = (sum / diam) | 0;
        }
    }
}

/**
 * Estimate background illumination via downsampled blur and divide it out.
 * Handles uneven lighting / shadows from phone photos.
 * Memory: ~2 * (w/16)*(h/16) bytes for downsampled buffers.
 */
function estimateAndRemoveBackground(gray: Uint8Array, w: number, h: number): void {
    const factor = 16;
    const sw = Math.max(1, (w / factor) | 0);
    const sh = Math.max(1, (h / factor) | 0);
    const small = new Uint8Array(sw * sh);

    // Nearest-neighbour downsample
    for (let sy = 0; sy < sh; sy++) {
        const srcY = Math.min(((sy * h) / sh) | 0, h - 1);
        for (let sx = 0; sx < sw; sx++) {
            const srcX = Math.min(((sx * w) / sw) | 0, w - 1);
            small[sy * sw + sx] = gray[srcY * w + srcX];
        }
    }

    // Heavy blur on the small image to get a smooth background
    const blurRadius = Math.max(2, Math.min(sw, sh) >> 2);
    boxBlur(small, sw, sh, blurRadius);

    // Divide original by bilinear-upsampled background
    for (let y = 0; y < h; y++) {
        const fy = (y * (sh - 1)) / Math.max(1, h - 1);
        const y0 = Math.min(fy | 0, sh - 2);
        const y1 = y0 + 1;
        const wy = fy - y0;

        for (let x = 0; x < w; x++) {
            const fx = (x * (sw - 1)) / Math.max(1, w - 1);
            const x0 = Math.min(fx | 0, sw - 2);
            const x1 = x0 + 1;
            const wx = fx - x0;

            // Bilinear interpolation of background
            const bg =
                small[y0 * sw + x0] * (1 - wx) * (1 - wy) +
                small[y0 * sw + x1] * wx * (1 - wy) +
                small[y1 * sw + x0] * (1 - wx) * wy +
                small[y1 * sw + x1] * wx * wy;

            const idx = y * w + x;
            const val = bg > 0 ? (gray[idx] / bg) * 200 : gray[idx];
            gray[idx] = val < 0 ? 0 : val > 255 ? 255 : val | 0;
        }
    }
}

/**
 * Contrast-Limited Adaptive Histogram Equalization (CLAHE).
 * Divides the image into tiles and applies clipped histogram equalization
 * with bilinear interpolation between tiles for smooth output.
 * Memory: ~tilesX*tilesY*256*4 bytes for CDF table.
 */
function applyCLAHE(
    gray: Uint8Array,
    w: number,
    h: number,
    tilesX = 8,
    tilesY = 8,
    clipLimit = 2.0,
): void {
    const bins = 256;
    const cdfs = new Float32Array(tilesY * tilesX * bins);
    const tileW = w / tilesX;
    const tileH = h / tilesY;

    for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
            const x0 = Math.round(tx * tileW);
            const y0 = Math.round(ty * tileH);
            const x1 = Math.round((tx + 1) * tileW);
            const y1 = Math.round((ty + 1) * tileH);
            const tilePixels = (x1 - x0) * (y1 - y0);
            if (tilePixels === 0) continue;

            // Build histogram
            const hist = new Uint32Array(bins);
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    hist[gray[y * w + x]]++;
                }
            }

            // Clip histogram
            const clip = Math.max(1, (clipLimit * tilePixels) / bins) | 0;
            let excess = 0;
            for (let i = 0; i < bins; i++) {
                if (hist[i] > clip) {
                    excess += hist[i] - clip;
                    hist[i] = clip;
                }
            }

            // Redistribute excess evenly
            const bonus = (excess / bins) | 0;
            const remainder = excess - bonus * bins;
            for (let i = 0; i < bins; i++) {
                hist[i] += bonus + (i < remainder ? 1 : 0);
            }

            // Build CDF normalized to 0..255
            const cdfOff = (ty * tilesX + tx) * bins;
            let cumSum = 0;
            for (let i = 0; i < bins; i++) {
                cumSum += hist[i];
                cdfs[cdfOff + i] = (cumSum / tilePixels) * 255;
            }
        }
    }

    // Map each pixel using bilinear interpolation of surrounding tile CDFs
    for (let y = 0; y < h; y++) {
        const fy = (y / tileH) - 0.5;
        const ty0 = Math.max(0, Math.min(fy | 0, tilesY - 2));
        const ty1 = ty0 + 1;
        const wy = Math.max(0, Math.min(fy - ty0, 1));

        for (let x = 0; x < w; x++) {
            const fx = (x / tileW) - 0.5;
            const tx0 = Math.max(0, Math.min(fx | 0, tilesX - 2));
            const tx1 = tx0 + 1;
            const wx = Math.max(0, Math.min(fx - tx0, 1));

            const idx = y * w + x;
            const val = gray[idx];

            const c00 = cdfs[(ty0 * tilesX + tx0) * bins + val];
            const c10 = cdfs[(ty0 * tilesX + tx1) * bins + val];
            const c01 = cdfs[(ty1 * tilesX + tx0) * bins + val];
            const c11 = cdfs[(ty1 * tilesX + tx1) * bins + val];

            const top = c00 * (1 - wx) + c10 * wx;
            const bot = c01 * (1 - wx) + c11 * wx;
            const result = top * (1 - wy) + bot * wy;

            gray[idx] = result < 0 ? 0 : result > 255 ? 255 : result | 0;
        }
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
    processedWidth: number;   // downsampled original dimensions (for inverse rotation)
    processedHeight: number;
    deskewedWidth: number;    // deskewed image dimensions (= processed if no skew)
    deskewedHeight: number;
    wasDeskewed: boolean;
    coordScale: number;       // multiply bboxes by this to get full-res coords (1 if no downsampling)
}

/**
 * Preprocess an image for better OCR accuracy:
 * 1. Grayscale conversion + contrast enhancement
 * 2. Shadow removal via background estimation
 * 3. CLAHE for local contrast enhancement
 * 4. Skew detection via projection profile analysis
 * 5. Deskew rotation (if skew > 0.5°)
 * 6. Second-pass shadow removal + CLAHE on deskewed image
 *
 * Returns both the enhanced OCR image and the deskewed display image.
 */
async function preprocessImage(imageUrl: string): Promise<PreprocessResult> {
    const origImg = await loadImage(imageUrl);
    const fullW = origImg.naturalWidth;
    const fullH = origImg.naturalHeight;

    // Downsample large images to avoid mobile canvas memory limits
    // Phone photos (4032×3024+) easily exceed mobile GPU memory budgets
    const MAX_OCR_DIM = 2000;
    const dsRatio = Math.min(1, MAX_OCR_DIM / Math.max(fullW, fullH));
    const w = Math.round(fullW * dsRatio);
    const h = Math.round(fullH * dsRatio);
    const coordScale = 1 / dsRatio; // to scale bboxes back to full resolution

    // --- Analyze grayscale to detect skew ---
    const analysisCanvas = document.createElement('canvas');
    analysisCanvas.width = w;
    analysisCanvas.height = h;
    const aCtx = analysisCanvas.getContext('2d')!;
    aCtx.drawImage(origImg, 0, 0, w, h);

    const aData = aCtx.getImageData(0, 0, w, h);
    const pixels = w * h;
    const gray = toGrayscale(aData.data, pixels);
    histogramStretch(gray);
    estimateAndRemoveBackground(gray, w, h);
    applyCLAHE(gray, w, h);
    const threshold = otsuThreshold(gray);

    // --- Detect and correct skew ---
    const skewAngle = detectSkewAngle(gray, w, h, threshold);
    let wasDeskewed = false;
    // For deskew rotation, use the downsampled canvas (not full-res image)
    let deskewSource: HTMLImageElement;
    if (Math.abs(skewAngle) > 0.5) {
        const dsImg = await loadImage(analysisCanvas.toDataURL('image/jpeg', 0.85));
        const rotatedUrl = rotateByAngle(dsImg, -skewAngle);
        deskewSource = await loadImage(rotatedUrl);
        wasDeskewed = true;
    } else {
        deskewSource = await loadImage(analysisCanvas.toDataURL('image/jpeg', 0.85));
    }

    // --- Enhance the (possibly deskewed) image ---
    const finalImg = deskewSource;
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
    estimateAndRemoveBackground(finalGray, finalW, finalH);
    applyCLAHE(finalGray, finalW, finalH);

    // Write contrast-enhanced grayscale directly — skip binarization.
    // Tesseract LSTM does its own internal preprocessing; explicit binarization
    // can destroy shadow-area text and the large integral-image buffer (~24 MB)
    // exceeds mobile browser memory limits.
    const data = imageData.data;
    for (let i = 0; i < finalPixels; i++) {
        data[i * 4] = finalGray[i];
        data[i * 4 + 1] = finalGray[i];
        data[i * 4 + 2] = finalGray[i];
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
        processedWidth: w,
        processedHeight: h,
        deskewedWidth: finalW,
        deskewedHeight: finalH,
        wasDeskewed,
        coordScale,
    };
}

/**
 * Shared post-processing: merge fragments, inverse rotation, coord scaling,
 * text cleaning, and word-level classification.
 */
async function postProcessWords(
    rawWords: RawWord[],
    preprocess: PreprocessResult,
    userLevel: CEFRLevel,
): Promise<OcrResult> {
    // Merge word fragments split by OCR
    const mergedWords = mergeFragmentedWords(rawWords);

    // Transform bboxes from deskewed space back to original image space
    let finalWords: RawWord[] = mergedWords;
    if (preprocess.wasDeskewed) {
        const s = preprocess.skewAngle * Math.PI / 180;
        const cosS = Math.cos(s);
        const sinS = Math.sin(s);
        const dCx = preprocess.deskewedWidth / 2;
        const dCy = preprocess.deskewedHeight / 2;
        const oCx = preprocess.processedWidth / 2;
        const oCy = preprocess.processedHeight / 2;

        finalWords = mergedWords.map((w) => {
            const bCx = (w.bbox.x0 + w.bbox.x1) / 2;
            const bCy = (w.bbox.y0 + w.bbox.y1) / 2;
            const bW = w.bbox.x1 - w.bbox.x0;
            const bH = w.bbox.y1 - w.bbox.y0;

            // Inverse rotation: deskewed center -> processed-original center
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

    // Scale bboxes from processed coords to full-resolution original
    const cs = preprocess.coordScale;
    if (cs !== 1) {
        finalWords = finalWords.map((w) => ({
            ...w,
            bbox: {
                x0: w.bbox.x0 * cs,
                y0: w.bbox.y0 * cs,
                x1: w.bbox.x1 * cs,
                y1: w.bbox.y1 * cs,
            },
        }));
    }

    // Clean text
    const cleanedWords = finalWords
        .map((w) => {
            const text = w.text
                .replace(/^[^a-zA-Z]+/, '')
                .replace(/[^a-zA-Z]+$/, '')
                .replace(/[^a-zA-Z'-]/g, '');
            return { text, bbox: w.bbox, confidence: w.confidence };
        })
        .filter((w) => w.text.length > 0);

    // Build context and classify words
    const CONTEXT_WINDOW = 3;
    const words: OcrWord[] = await Promise.all(
        cleanedWords.map(async (w, index) => {
            const level = await getWordLevelAsync(w.text);
            const difficulty = getRelativeDifficulty(w.text, userLevel);

            const start = Math.max(0, index - CONTEXT_WINDOW);
            const end = Math.min(cleanedWords.length - 1, index + CONTEXT_WINDOW);
            const contextWords: string[] = [];
            for (let i = start; i <= end; i++) {
                contextWords.push(cleanedWords[i].text);
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

    return {
        words,
        skewAngle: preprocess.wasDeskewed ? preprocess.skewAngle : 0,
    };
}

/**
 * Run PaddleOCR engine. Returns line-level detections split into word-level bboxes.
 * Falls back to null on failure so the caller can retry with Tesseract.
 */
async function runPaddleOcr(
    preprocess: PreprocessResult,
    userLevel: CEFRLevel,
    setProgress: (p: number) => void,
): Promise<OcrResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paddleOcr = await import('@paddle-js-models/ocr') as any;

    if (paddleOcr.init) {
        await paddleOcr.init();
    } else if (paddleOcr.default?.init) {
        await paddleOcr.default.init();
    }
    setProgress(30);

    const img = await loadImage(preprocess.ocrUrl);

    const recognize = paddleOcr.recognize ?? paddleOcr.default?.recognize;
    const result = await recognize(img);
    setProgress(70);

    const pad = preprocess.padding;

    // PaddleOCR returns line-level detections; split into word-level bboxes
    const rawWords: RawWord[] = [];
    const lines = Array.isArray(result) ? result : (result?.text ?? result?.data ?? []);

    for (const line of lines) {
        const text: string = typeof line === 'string' ? line : (line.text ?? '');
        const wordTokens = text.split(/\s+/).filter((t: string) => t.length > 0);
        if (wordTokens.length === 0) continue;

        // Get line bbox from corner points
        const points: number[][] = line.points ?? line.box ?? [];
        if (points.length < 4) continue;

        const xs = points.map((p: number[]) => p[0]);
        const ys = points.map((p: number[]) => p[1]);
        const lx0 = Math.min(...xs) - pad;
        const ly0 = Math.min(...ys) - pad;
        const lx1 = Math.max(...xs) - pad;
        const ly1 = Math.max(...ys) - pad;

        const lineWidth = lx1 - lx0;
        const totalChars = wordTokens.reduce((sum: number, t: string) => sum + t.length, 0);
        const conf = typeof (line.confidence ?? line.score) === 'number'
            ? (line.confidence ?? line.score)
            : 80;

        let currentX = lx0;
        for (const token of wordTokens) {
            const wordWidth = (token.length / totalChars) * lineWidth;
            rawWords.push({
                text: token,
                bbox: { x0: currentX, y0: ly0, x1: currentX + wordWidth, y1: ly1 },
                confidence: conf,
            });
            currentX += wordWidth;
        }
    }

    return postProcessWords(rawWords, preprocess, userLevel);
}

export function useOcr(): UseOcrResult {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const analyze = useCallback(
        async (imageUrl: string, userLevel: CEFRLevel, engine: OcrEngine = 'tesseract'): Promise<OcrResult> => {
            setIsAnalyzing(true);
            setProgress(0);
            setError(null);

            let worker: Worker | null = null;

            try {
                // Preprocess image for better OCR accuracy
                const preprocess = await preprocessImage(imageUrl);

                // PaddleOCR path — fall back to Tesseract on failure
                if (engine === 'paddleocr') {
                    try {
                        const result = await runPaddleOcr(preprocess, userLevel, setProgress);
                        setProgress(100);
                        return result;
                    } catch (e) {
                        console.warn('PaddleOCR failed, falling back to Tesseract:', e);
                    }
                }

                // Tesseract path
                worker = await createWorker('eng', 1, {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    },
                });

                await worker.setParameters({
                    tessedit_pageseg_mode: PSM.AUTO_OSD,
                });

                const result = await worker.recognize(preprocess.ocrUrl);
                const pad = preprocess.padding;

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

                const ocrResult = await postProcessWords(ocrWords, preprocess, userLevel);
                setProgress(100);
                return ocrResult;
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
