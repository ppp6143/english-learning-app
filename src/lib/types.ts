// OCR word result type shared across components
import { CEFRLevel, RelativeDifficulty } from './wordLevels';

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
    angle?: number; // text angle in degrees from baseline detection
}

export interface OcrResult {
    words: OcrWord[];
    rotateRadians: number | null;
}

