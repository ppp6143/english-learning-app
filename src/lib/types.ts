// OCR word result type shared across components
import { CEFRLevel, RelativeDifficulty } from './wordLevels';

export type OcrEngine = 'tesseract' | 'paddleocr';
export type ScanMode = 'clean' | 'natural' | 'off';

export interface OcrWord {
    text: string;
    bbox: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
    };
    confidence: number;
    level: CEFRLevel | null;
    difficulty: RelativeDifficulty;
    context?: string; // surrounding words for contextual meaning
}

export interface OcrResult {
    words: OcrWord[];
    /** Detected skew angle for tilting highlights (degrees, positive = clockwise tilt) */
    skewAngle: number;
    /** Data URL of the scanned/preprocessed image (if document scanner was used) */
    scannedUrl?: string;
    /** Whether a document contour was successfully detected */
    documentDetected?: boolean;
}

