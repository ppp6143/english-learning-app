/**
 * Document scanning pipeline v2 using OpenCV.js.
 * Provides manual four-corner crop with auto-detection fallback,
 * shadow removal, and image enhancement.
 */

import { loadOpenCV } from './opencv-loader';
import { Corner, ScanMode } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CV = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mat = any;

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
 * Convert a cv.Mat to a data URL via an intermediate canvas.
 */
function matToDataUrl(cv: CV, mat: Mat): string {
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, mat);
    return canvas.toDataURL('image/png');
}

/**
 * Order 4 points as [topLeft, topRight, bottomRight, bottomLeft].
 */
function orderCorners(points: { x: number; y: number }[]): { x: number; y: number }[] {
    const sorted = [...points];
    sorted.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    const topLeft = sorted[0];
    const bottomRight = sorted[3];
    const remaining = [sorted[1], sorted[2]];
    remaining.sort((a, b) => (a.y - a.x) - (b.y - b.x));
    const topRight = remaining[0];
    const bottomLeft = remaining[1];
    return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
 * Try to detect a document quadrilateral using a specific Canny threshold pair.
 * Returns the contour area and corners if found, null otherwise.
 */
function tryDetectWithThreshold(
    cv: CV,
    gray: Mat,
    low: number,
    high: number,
    imageArea: number,
): { area: number; corners: { x: number; y: number }[] } | null {
    const mats: Mat[] = [];
    try {
        const edges = new cv.Mat();
        mats.push(edges);
        cv.Canny(gray, edges, low, high);

        // Morphological closing to bridge edge gaps
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
        mats.push(kernel);
        cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);

        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        mats.push(contours, hierarchy);
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let bestCorners: { x: number; y: number }[] | null = null;
        let bestArea = 0;

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            if (area < imageArea * 0.25) continue;

            const peri = cv.arcLength(contour, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, 0.02 * peri, true);

            if (approx.rows === 4 && area > bestArea) {
                bestArea = area;
                bestCorners = [];
                for (let j = 0; j < 4; j++) {
                    bestCorners.push({
                        x: approx.data32S[j * 2],
                        y: approx.data32S[j * 2 + 1],
                    });
                }
            }
            approx.delete();
        }

        if (bestCorners) {
            return { area: bestArea, corners: orderCorners(bestCorners) };
        }
        return null;
    } finally {
        for (const m of mats) m.delete();
    }
}

/**
 * Detect document corners from an image URL.
 * Tries multiple Canny thresholds and picks the best quadrilateral.
 * Returns Corner[] (0-1 normalized) on success, null on failure.
 */
export async function detectDocumentCorners(imageUrl: string): Promise<Corner[] | null> {
    const cv = await loadOpenCV();
    const img = await loadImage(imageUrl);

    // Resize to max 1000px for detection (low-res is sufficient)
    const MAX_DIM = 1000;
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();

    try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

        const imageArea = w * h;
        const thresholds: [number, number][] = [[30, 100], [50, 150], [75, 200]];

        let best: { area: number; corners: { x: number; y: number }[] } | null = null;

        for (const [low, high] of thresholds) {
            const result = tryDetectWithThreshold(cv, blurred, low, high, imageArea);
            if (result && (!best || result.area > best.area)) {
                best = result;
            }
        }

        if (best) {
            // Convert pixel coords to 0-1 normalized
            return best.corners.map(c => ({
                x: c.x / w,
                y: c.y / h,
            }));
        }
        return null;
    } finally {
        src.delete();
        gray.delete();
        blurred.delete();
    }
}

/**
 * Crop and enhance an image given four corners and a scan mode.
 * Pipeline: perspective transform → shadow removal → CLAHE → median blur → optional B&W threshold.
 */
export async function cropAndEnhance(
    imageUrl: string,
    corners: Corner[],
    mode: ScanMode,
): Promise<{ dataUrl: string; width: number; height: number }> {
    const cv = await loadOpenCV();
    const img = await loadImage(imageUrl);

    // Resize to max 2000px
    const MAX_DIM = 2000;
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    const src = cv.imread(canvas);
    const mats: Mat[] = [src];

    try {
        // Convert normalized corners to pixel coordinates
        const [tl, tr, br, bl] = corners.map(c => ({
            x: c.x * w,
            y: c.y * h,
        }));

        // Compute output dimensions from corner distances
        const widthTop = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2);
        const widthBottom = Math.sqrt((br.x - bl.x) ** 2 + (br.y - bl.y) ** 2);
        const outW = Math.max(Math.round(Math.max(widthTop, widthBottom)), 200);

        const heightLeft = Math.sqrt((bl.x - tl.x) ** 2 + (bl.y - tl.y) ** 2);
        const heightRight = Math.sqrt((br.x - tr.x) ** 2 + (br.y - tr.y) ** 2);
        const outH = Math.max(Math.round(Math.max(heightLeft, heightRight)), 200);

        // Perspective transform
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y,
        ]);
        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0, outW, 0, outW, outH, 0, outH,
        ]);
        mats.push(srcPoints, dstPoints);

        const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
        mats.push(M);

        const warped = new cv.Mat();
        mats.push(warped);
        cv.warpPerspective(src, warped, M, new cv.Size(outW, outH),
            cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));

        // Convert to grayscale
        const gray = new cv.Mat();
        mats.push(gray);
        cv.cvtColor(warped, gray, cv.COLOR_RGBA2GRAY);

        // Shadow removal: divide by blurred background
        const bg = new cv.Mat();
        mats.push(bg);
        cv.GaussianBlur(gray, bg, new cv.Size(51, 51), 0);

        const norm = new cv.Mat();
        mats.push(norm);
        cv.divide(gray, bg, norm, 255);

        // CLAHE for local contrast enhancement
        const claheResult = new cv.Mat();
        mats.push(claheResult);
        const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
        clahe.apply(norm, claheResult);
        clahe.delete();

        // Median blur for noise reduction
        const denoised = new cv.Mat();
        mats.push(denoised);
        cv.medianBlur(claheResult, denoised, 3);

        let output: Mat;
        if (mode === 'bw') {
            // B&W: adaptive threshold
            const bw = new cv.Mat();
            mats.push(bw);
            cv.adaptiveThreshold(denoised, bw, 255,
                cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 10);
            output = bw;
        } else {
            output = denoised;
        }

        // Convert back to RGBA for display
        const rgba = new cv.Mat();
        mats.push(rgba);
        cv.cvtColor(output, rgba, cv.COLOR_GRAY2RGBA);

        const dataUrl = matToDataUrl(cv, rgba);
        return { dataUrl, width: outW, height: outH };
    } finally {
        for (const m of mats) m.delete();
    }
}
