/**
 * Document scanning pipeline using OpenCV.js.
 * Detects document edges, applies perspective correction,
 * and enhances the image for OCR.
 */

import { loadOpenCV } from './opencv-loader';
import { ScanMode } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CV = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mat = any;

export interface ScanResult {
    scannedUrl: string;
    documentDetected: boolean;
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
 * Convert a cv.Mat to a data URL via an intermediate canvas.
 */
function matToDataUrl(cv: CV, mat: Mat): string {
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, mat);
    return canvas.toDataURL('image/png');
}

/**
 * Order 4 points as [topLeft, topRight, bottomRight, bottomLeft].
 * Uses sum (x+y) for TL/BR and difference (y-x) for TR/BL.
 */
function orderCorners(points: { x: number; y: number }[]): { x: number; y: number }[] {
    const sorted = [...points];

    // topLeft has smallest sum, bottomRight has largest sum
    sorted.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    const topLeft = sorted[0];
    const bottomRight = sorted[3];

    // topRight has smallest difference (y - x), bottomLeft has largest
    const remaining = [sorted[1], sorted[2]];
    remaining.sort((a, b) => (a.y - a.x) - (b.y - b.x));
    const topRight = remaining[0];
    const bottomLeft = remaining[1];

    return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
 * Detect the largest quadrilateral contour in the image.
 * Returns 4 ordered corner points, or null if no suitable contour found
 * (less than 25% of image area).
 */
function detectDocumentContour(cv: CV, src: Mat): { x: number; y: number }[] | null {
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
        // Grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // Gaussian blur to reduce noise
        const ksize = new cv.Size(5, 5);
        cv.GaussianBlur(gray, blurred, ksize, 0);

        // Canny edge detection
        cv.Canny(blurred, edges, 50, 150);

        // Dilate edges to close gaps
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        cv.dilate(edges, edges, kernel);
        kernel.delete();

        // Find contours
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        const imageArea = src.rows * src.cols;
        let bestContour: { x: number; y: number }[] | null = null;
        let bestArea = 0;

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);

            // Must be at least 25% of image area
            if (area < imageArea * 0.25) continue;

            // Approximate the contour to a polygon
            const peri = cv.arcLength(contour, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, 0.02 * peri, true);

            // We want a quadrilateral
            if (approx.rows === 4 && area > bestArea) {
                bestArea = area;
                bestContour = [];
                for (let j = 0; j < 4; j++) {
                    bestContour.push({
                        x: approx.data32S[j * 2],
                        y: approx.data32S[j * 2 + 1],
                    });
                }
            }
            approx.delete();
        }

        if (bestContour) {
            return orderCorners(bestContour);
        }
        return null;
    } finally {
        gray.delete();
        blurred.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
    }
}

/**
 * Apply perspective transform to warp the detected quadrilateral
 * into a rectangular front-facing view with A4 aspect ratio (1:sqrt(2)).
 */
function perspectiveTransform(
    cv: CV,
    src: Mat,
    corners: { x: number; y: number }[],
): Mat {
    const [tl, tr, br, bl] = corners;

    // Compute width from max of top and bottom edge lengths
    const widthTop = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2);
    const widthBottom = Math.sqrt((br.x - bl.x) ** 2 + (br.y - bl.y) ** 2);
    const maxWidth = Math.round(Math.max(widthTop, widthBottom));

    // Compute height from max of left and right edge lengths
    const heightLeft = Math.sqrt((bl.x - tl.x) ** 2 + (bl.y - tl.y) ** 2);
    const heightRight = Math.sqrt((br.x - tr.x) ** 2 + (br.y - tr.y) ** 2);
    const maxHeight = Math.round(Math.max(heightLeft, heightRight));

    // Determine output dimensions - keep detected aspect ratio
    // but enforce minimum reasonable size
    const outW = Math.max(maxWidth, 200);
    const outH = Math.max(maxHeight, 200);

    // Source points (detected corners)
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        tl.x, tl.y,
        tr.x, tr.y,
        br.x, br.y,
        bl.x, bl.y,
    ]);

    // Destination points (rectangular)
    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        outW, 0,
        outW, outH,
        0, outH,
    ]);

    const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
    const dst = new cv.Mat();
    const dsize = new cv.Size(outW, outH);
    cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));

    srcPoints.delete();
    dstPoints.delete();
    M.delete();

    return dst;
}

/**
 * Clean mode: adaptive threshold for high-contrast B&W output.
 */
function applyAdaptiveThreshold(cv: CV, src: Mat): Mat {
    const gray = new cv.Mat();
    const dst = new cv.Mat();

    try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.adaptiveThreshold(
            gray, dst, 255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY,
            21,  // blockSize
            10,  // C
        );

        // Convert back to RGBA for consistency
        const result = new cv.Mat();
        cv.cvtColor(dst, result, cv.COLOR_GRAY2RGBA);
        return result;
    } finally {
        gray.delete();
        dst.delete();
    }
}

/**
 * Natural mode: CLAHE for local contrast enhancement while preserving appearance.
 */
function applyCLAHENatural(cv: CV, src: Mat): Mat {
    const gray = new cv.Mat();
    const dst = new cv.Mat();

    try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
        clahe.apply(gray, dst);
        clahe.delete();

        const result = new cv.Mat();
        cv.cvtColor(dst, result, cv.COLOR_GRAY2RGBA);
        return result;
    } finally {
        gray.delete();
        dst.delete();
    }
}

/**
 * Remove noise via morphological opening + median filter.
 */
function removeNoise(cv: CV, src: Mat): Mat {
    const dst = new cv.Mat();

    try {
        // Morphological opening to remove small noise
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        cv.morphologyEx(src, dst, cv.MORPH_OPEN, kernel);
        kernel.delete();

        // Median filter for salt-and-pepper noise
        const result = new cv.Mat();
        cv.medianBlur(dst, result, 3);
        return result;
    } finally {
        dst.delete();
    }
}

/**
 * Main entry point: scan a document image.
 *
 * Pipeline:
 * 1. Load image and resize to max 2000px
 * 2. Detect document contour (quadrilateral)
 * 3. If found, apply perspective transform
 * 4. Apply image enhancement based on mode (clean/natural)
 * 5. Remove noise
 * 6. Return processed data URL
 */
export async function scanDocument(
    imageUrl: string,
    mode: ScanMode,
): Promise<ScanResult> {
    if (mode === 'off') {
        return { scannedUrl: imageUrl, documentDetected: false };
    }

    const cv = await loadOpenCV();
    const img = await loadImage(imageUrl);

    // Draw to canvas, resizing if needed
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
    let processed: Mat | null = null;
    let documentDetected = false;

    try {
        // Step 1: Detect document contour
        const corners = detectDocumentContour(cv, src);

        let working: Mat;
        if (corners) {
            // Step 2: Perspective transform
            working = perspectiveTransform(cv, src, corners);
            documentDetected = true;
        } else {
            // No document detected — use the full image
            working = src.clone();
        }

        // Step 3: Image enhancement based on mode
        let enhanced: Mat;
        if (mode === 'clean') {
            enhanced = applyAdaptiveThreshold(cv, working);
        } else {
            // natural mode
            enhanced = applyCLAHENatural(cv, working);
        }
        working.delete();

        // Step 4: Noise removal
        processed = removeNoise(cv, enhanced);
        enhanced.delete();

        const resultUrl = matToDataUrl(cv, processed);
        return { scannedUrl: resultUrl, documentDetected };
    } finally {
        src.delete();
        if (processed) processed.delete();
    }
}
