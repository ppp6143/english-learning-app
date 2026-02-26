// Translation cache service — local dictionary only

import DICT from './localDictionary';
import { getLemmatizedCandidates } from './lemmatizer';
import { lookupPhrasalVerb } from './phrasalVerbs';

type TranslationCache = Record<string, string[]>;

let cache: TranslationCache = {};

/**
 * Clear the cache.
 */
export function clearTranslationCache(): void {
    cache = {};
}

/**
 * Clean a raw dictionary entry array into concise Japanese translations.
 *
 * Processing steps:
 * 1. Skip =xxx reference entries
 * 2. Remove 《...》 annotations (usage markers)
 * 3. Extract content from 『...』 brackets (prioritized)
 * 4. Remove grammar patterns like (…の), (+of+名), etc.
 * 5. Remove (...) supplementary explanations
 * 6. Split by ;、, into individual translations
 * 7. Filter out English-only or empty entries
 * 8. Deduplicate, limit to 5, prioritize 『』-enclosed terms
 */
export function cleanDictionaryEntry(entries: string[]): string[] {
    const prioritized: string[] = [];
    const normal: string[] = [];

    for (const entry of entries) {
        // Skip reference entries like "=another_word"
        if (/^=/.test(entry.trim())) continue;

        let text = entry;

        // Extract 『...』 content as high-priority translations
        const bracketMatches = text.match(/『([^』]+)』/g);
        if (bracketMatches) {
            for (const m of bracketMatches) {
                const inner = m.replace(/[『』]/g, '').trim();
                if (inner && !/^[a-zA-Z\s]+$/.test(inner)) {
                    prioritized.push(inner);
                }
            }
        }

        // Remove 《...》 annotations
        text = text.replace(/《[^》]*》/g, '');

        // Remove 『...』 brackets but keep content
        text = text.replace(/[『』]/g, '');

        // Remove grammar patterns: (+of+名), (…の), etc.
        text = text.replace(/\([+\w…〈〉]+\)/g, '');

        // Remove (...) supplementary explanations
        text = text.replace(/\([^)]*\)/g, '');
        text = text.replace(/（[^）]*）/g, '');

        // Split by delimiters
        const parts = text.split(/[;；、,，]+/);

        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            // Skip if only English letters/spaces/punctuation
            if (/^[a-zA-Z\s\-'.:!?]+$/.test(trimmed)) continue;
            normal.push(trimmed);
        }
    }

    // Combine: prioritized first, then normal, deduplicated
    const seen = new Set<string>();
    const result: string[] = [];

    for (const item of [...prioritized, ...normal]) {
        if (!seen.has(item)) {
            seen.add(item);
            result.push(item);
        }
        if (result.length >= 5) break;
    }

    return result;
}

/** Convert "australia" → "Australia" */
function toTitleCase(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Look up a word in the local dictionary (tries lemmatized forms too).
 */
function lookupLocal(word: string): string[] | null {
    const w = word.toLowerCase().replace(/[^a-z'-]/g, '');
    if (!w) return null;

    // Direct lookup (lowercase)
    if (DICT[w]) return cleanDictionaryEntry(DICT[w]);

    // Try title case (e.g. "Australia", "Africa")
    const tc = toTitleCase(w);
    if (DICT[tc]) return cleanDictionaryEntry(DICT[tc]);

    // Try original form as-is
    const raw = word.replace(/[^a-zA-Z'-]/g, '');
    if (raw && raw !== w && raw !== tc && DICT[raw]) return cleanDictionaryEntry(DICT[raw]);

    // Try lemmatized candidates (lowercase + title case)
    const candidates = getLemmatizedCandidates(w);
    for (const c of candidates) {
        if (DICT[c]) return cleanDictionaryEntry(DICT[c]);
        const ctc = toTitleCase(c);
        if (DICT[ctc]) return cleanDictionaryEntry(DICT[ctc]);
    }

    return null;
}

/**
 * Get the flat cache for passing to components.
 * Format: { "primary:word": "訳", "alts:word": "訳2 / 訳3" }
 */
export function getTranslationCacheFlat(): Record<string, string> {
    const flat: Record<string, string> = {};
    for (const [key, translations] of Object.entries(cache)) {
        if (translations.length > 0) {
            flat[`primary:${key}`] = translations[0];
            if (translations.length > 1) {
                flat[`alts:${key}`] = translations.slice(1).join(' / ');
            }
        }
    }
    return flat;
}

/**
 * Pre-fetch translations for all OCR words from local dictionary.
 */
export function prefetchTranslations(
    words: { text: string }[],
): Record<string, string> {
    for (const w of words) {
        const key = w.text.toLowerCase().replace(/[^a-z'-]/g, '');
        if (!key || cache[key]) continue;

        const local = lookupLocal(key);
        if (local) {
            cache[key] = local;
        }
    }

    return getTranslationCacheFlat();
}

/**
 * Translate a single word from local dictionary (synchronous).
 */
export function translateSingleWord(
    word: string,
): { primary: string; alternatives?: string[] } | null {
    const key = word.toLowerCase().replace(/[^a-z'-]/g, '');

    // Check cache first
    if (cache[key] && cache[key].length > 0) {
        return { primary: cache[key][0], alternatives: cache[key].slice(1) };
    }

    // Try local dictionary
    const local = lookupLocal(key);
    if (local && local.length > 0) {
        cache[key] = local;
        return { primary: local[0], alternatives: local.slice(1) };
    }

    return null;
}

/**
 * Translate a phrase (multi-word input, e.g. phrasal verbs or compound terms).
 * Preserves spaces for lookup unlike translateSingleWord which strips them.
 *
 * Search order:
 *   1. Phrasal verb dictionary (only registered phrases)
 *   2. Local DICT (lowercase key with spaces)
 *   3. Local DICT (title case)
 *   4. Local DICT (first-letter uppercase)
 */
export function translatePhrase(
    phrase: string,
): { primary: string; alternatives?: string[]; source: 'phrasal' | 'dict' } | null {
    const normalized = phrase.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!normalized) return null;

    // 1. Phrasal verb dictionary
    const pv = lookupPhrasalVerb(normalized);
    if (pv) {
        return { primary: pv.translation, source: 'phrasal' };
    }

    // 2. DICT lookup — lowercase (preserving spaces/hyphens)
    const dictKey = normalized.replace(/[^a-z\s'-]/g, '');
    if (DICT[dictKey]) {
        const cleaned = cleanDictionaryEntry(DICT[dictKey]);
        if (cleaned.length > 0) {
            return { primary: cleaned[0], alternatives: cleaned.slice(1), source: 'dict' };
        }
    }

    // 3. DICT — title case (e.g. "Acid Rain")
    const titleCase = dictKey.replace(/\b\w/g, c => c.toUpperCase());
    if (DICT[titleCase]) {
        const cleaned = cleanDictionaryEntry(DICT[titleCase]);
        if (cleaned.length > 0) {
            return { primary: cleaned[0], alternatives: cleaned.slice(1), source: 'dict' };
        }
    }

    // 4. DICT — first letter uppercase only (e.g. "Acid rain")
    const firstUpper = dictKey.charAt(0).toUpperCase() + dictKey.slice(1);
    if (firstUpper !== titleCase && DICT[firstUpper]) {
        const cleaned = cleanDictionaryEntry(DICT[firstUpper]);
        if (cleaned.length > 0) {
            return { primary: cleaned[0], alternatives: cleaned.slice(1), source: 'dict' };
        }
    }

    return null;
}
