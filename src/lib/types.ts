// OCR word result type shared across components
import { CEFRLevel, RelativeDifficulty } from './wordLevels';

export type OcrEngine = 'tesseract' | 'paddleocr';
export type ScanMode = 'enhanced' | 'bw' | 'off';

/** A corner point in normalized 0-1 coordinates (fraction of image width/height) */
export interface Corner {
    x: number;
    y: number;
}

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
}

