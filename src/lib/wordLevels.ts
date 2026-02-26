// CEFR word level types and utilities
// Designed to be independent so color logic can adapt to user's current level

import { A1_WORDS } from './wordListA1';
import { A2_WORDS } from './wordListA2';
import { B1_WORDS } from './wordListB1';
import { B2_WORDS } from './wordListB2';
import { C1_WORDS } from './wordListC1';
import { C2_WORDS } from './wordListC2';
import { getLemmatizedCandidates, getLemmatizedCandidatesAsync } from './lemmatizer';
import DICT from './localDictionary';
import { FREQ_LEVELS } from './generatedWordLevels';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Numeric ordering for comparison
const LEVEL_ORDER: Record<CEFRLevel, number> = {
    A1: 1,
    A2: 2,
    B1: 3,
    B2: 4,
    C1: 5,
    C2: 6,
};

// Build the word-level map from external word lists
function buildWordLevelMap(): Record<string, CEFRLevel> {
    const map: Record<string, CEFRLevel> = {};

    const levels: [string[], CEFRLevel][] = [
        [A1_WORDS, 'A1'],
        [A2_WORDS, 'A2'],
        [B1_WORDS, 'B1'],
        [B2_WORDS, 'B2'],
        [C1_WORDS, 'C1'],
        [C2_WORDS, 'C2'],
    ];

    for (const [words, level] of levels) {
        for (const word of words) {
            const key = word.toLowerCase();
            // Don't overwrite — first definition wins (lower levels take priority)
            if (!(key in map)) {
                map[key] = level;
            }
        }
    }

    return map;
}

const WORD_LEVEL_MAP = buildWordLevelMap();

/**
 * Normalize a raw word for lookup:
 * - convert to lowercase
 * - strip leading/trailing punctuation (commas, periods, quotes, etc.)
 * - remove non-alphabetic characters except hyphens and apostrophes
 */
function normalizeWord(word: string): string {
    return word
        .toLowerCase()
        .replace(/^[^a-z]+/, '')   // strip leading non-alpha
        .replace(/[^a-z]+$/, '')   // strip trailing non-alpha
        .replace(/[^a-z'-]/g, ''); // keep only letters, hyphens, apostrophes
}

/**
 * Look up the CEFR level of a word.
 * Uses lemmatization to find the base form if the surface form isn't in the dictionary.
 * Returns the level if known, or null if unknown (treated as basic/A1).
 */
export function getWordLevel(word: string): CEFRLevel | null {
    const normalized = normalizeWord(word);
    if (!normalized) return null;

    // Direct lookup first
    if (normalized in WORD_LEVEL_MAP) {
        return WORD_LEVEL_MAP[normalized];
    }

    // Try lemmatized candidates
    const candidates = getLemmatizedCandidates(normalized);
    for (const candidate of candidates) {
        if (candidate in WORD_LEVEL_MAP) {
            return WORD_LEVEL_MAP[candidate];
        }
    }

    // Check frequency-based levels (covers top 10,000 words commonly used)
    if (normalized in FREQ_LEVELS) {
        return FREQ_LEVELS[normalized as keyof typeof FREQ_LEVELS] as CEFRLevel;
    }

    // If not in standard lists or freq list, check if it's a valid word in our dictionary
    // If it is, treat it as a very high-level word (C2) so it gets highlighted for learners
    if (normalized in DICT) {
        return 'C2';
    }

    // Try title case for proper nouns (e.g. "Australia", "Africa")
    const titleCased = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    if (titleCased !== normalized && titleCased in DICT) {
        return 'C2';
    }

    return null;
}

/**
 * Async version with extended lemmatization.
 * Use this in the OCR analysis flow for best accuracy.
 */
export async function getWordLevelAsync(word: string): Promise<CEFRLevel | null> {
    // First try sync lookup (fast path)
    const syncResult = getWordLevel(word);
    if (syncResult) return syncResult;

    // Then try async lemmatization
    const normalized = normalizeWord(word);
    if (!normalized) return null;

    const candidates = await getLemmatizedCandidatesAsync(normalized);
    for (const candidate of candidates) {
        if (candidate in WORD_LEVEL_MAP) {
            return WORD_LEVEL_MAP[candidate];
        }
    }

    return null;
}


/**
 * Compare two CEFR levels numerically.
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareLevels(a: CEFRLevel, b: CEFRLevel): number {
    return LEVEL_ORDER[a] - LEVEL_ORDER[b];
}

/**
 * Determine the relative difficulty of a word compared to user's current level.
 * Returns:
 *   'above'  — word is above user's level (should be highlighted most)
 *   'at'     — word is at user's level (highlighted, learning these now)
 *   'below'  — word is one level below (lightly highlighted, recently learned)
 *   'known'  — word is well below user's level (no highlight)
 *   'unknown' — word not in dictionary
 */
export type RelativeDifficulty = 'above' | 'at' | 'below' | 'known' | 'unknown';

export function getRelativeDifficulty(
    word: string,
    userLevel: CEFRLevel
): RelativeDifficulty {
    const wordLevel = getWordLevel(word);
    if (!wordLevel) return 'unknown';

    const diff = compareLevels(wordLevel, userLevel);

    if (diff > 0) return 'above';   // harder than user's level
    if (diff === 0) return 'at';    // at user's level
    if (diff === -1) return 'below'; // just below — recently learned
    return 'known';                 // well below — mastered
}

/**
 * Highlight color configuration based on relative difficulty.
 * Returns Tailwind-compatible CSS classes and a human label.
 */
export interface HighlightStyle {
    bgColor: string;      // CSS background color
    borderColor: string;  // CSS border color
    label: string;        // Display label (e.g. "Above your level")
    shouldHighlight: boolean;
}

export function getHighlightStyle(difficulty: RelativeDifficulty): HighlightStyle {
    switch (difficulty) {
        case 'above':
            return {
                bgColor: 'rgba(249, 115, 22, 0.45)',   // orange
                borderColor: 'rgba(249, 115, 22, 0.7)',
                label: 'Above your level',
                shouldHighlight: true,
            };
        case 'at':
            return {
                bgColor: 'rgba(234, 179, 8, 0.45)',    // yellow
                borderColor: 'rgba(234, 179, 8, 0.7)',
                label: 'At your level',
                shouldHighlight: true,
            };
        case 'below':
            return {
                bgColor: 'rgba(96, 165, 250, 0.3)',    // light blue
                borderColor: 'rgba(96, 165, 250, 0.5)',
                label: 'Recently learned',
                shouldHighlight: true,
            };
        case 'known':
        case 'unknown':
        default:
            return {
                bgColor: 'transparent',
                borderColor: 'transparent',
                label: '',
                shouldHighlight: false,
            };
    }
}

/**
 * All available CEFR levels for UI selectors
 */
export const ALL_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Get a human-readable description for a CEFR level
 */
export function getLevelDescription(level: CEFRLevel): string {
    const descriptions: Record<CEFRLevel, string> = {
        A1: 'Beginner',
        A2: 'Elementary',
        B1: 'Intermediate',
        B2: 'Upper Intermediate',
        C1: 'Advanced',
        C2: 'Mastery',
    };
    return descriptions[level];
}
