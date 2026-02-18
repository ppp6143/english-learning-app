// Translation cache service
// LOCAL DICTIONARY FIRST → Gemini API fallback
// Instant translations for words in the local dictionary

import DICT from './localDictionary';
import { getLemmatizedCandidates } from './lemmatizer';

type TranslationCache = Record<string, string[]>;

let cache: TranslationCache = {};

/**
 * Clear the cache.
 */
export function clearTranslationCache(): void {
    cache = {};
}

/**
 * Look up a word in the local dictionary (tries lemmatized forms too).
 */
function lookupLocal(word: string): string[] | null {
    const w = word.toLowerCase().replace(/[^a-z'-]/g, '');
    if (!w) return null;

    // Direct lookup
    if (DICT[w]) return DICT[w];

    // Try lemmatized candidates
    const candidates = getLemmatizedCandidates(w);
    for (const c of candidates) {
        if (DICT[c]) return DICT[c];
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
 * Pre-fetch translations for all OCR words.
 * Step 1: Instantly resolve from local dictionary
 * Step 2: Batch remaining words to Gemini API (with error handling)
 */
export async function prefetchTranslations(
    words: { text: string; context?: string }[],
    onProgress?: (cache: Record<string, string>) => void
): Promise<Record<string, string>> {
    const remaining: { word: string; context: string }[] = [];

    // Step 1: Local dictionary — instant
    for (const w of words) {
        const key = w.text.toLowerCase().replace(/[^a-z'-]/g, '');
        if (!key || cache[key]) continue;

        const local = lookupLocal(key);
        if (local) {
            cache[key] = local;
        } else {
            remaining.push({ word: w.text, context: "" });
        }
    }

    // Report local results immediately
    if (onProgress) {
        onProgress(getTranslationCacheFlat());
    }

    // Step 2: Gemini API for remaining words (with full error handling)
    if (remaining.length > 0) {
        // Deduplicate
        const unique = new Map<string, { word: string; context: string }>();
        for (const w of remaining) {
            const k = w.word.toLowerCase().replace(/[^a-z'-]/g, '');
            if (!unique.has(k)) unique.set(k, w);
        }

        const allWords = Array.from(unique.values());
        const BATCH_SIZE = 15;

        for (let i = 0; i < allWords.length; i += BATCH_SIZE) {
            const batch = allWords.slice(i, i + BATCH_SIZE);

            try {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ words: batch }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data.translations)) {
                        for (const entry of data.translations) {
                            if (entry.word && Array.isArray(entry.ja) && entry.ja.length > 0) {
                                cache[entry.word.toLowerCase()] = entry.ja;
                            }
                        }
                    }
                } else {
                    console.warn(`Translate API batch failed (${res.status}), using local only`);
                }
            } catch (err) {
                console.warn('Translate API unavailable, using local dictionary only:', err);
                // Don't break — continue with remaining batches
            }

            if (onProgress) {
                onProgress(getTranslationCacheFlat());
            }

            // Rate limit delay
            if (i + BATCH_SIZE < allWords.length) {
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    return getTranslationCacheFlat();
}

/**
 * Translate a single word on-demand (local first, then API fallback).
 */
export async function translateSingleWord(
    word: string,
    context: string
): Promise<{ primary: string; alternatives?: string[] } | null> {
    const key = word.toLowerCase().replace(/[^a-z'-]/g, '');

    // Check cache first
    if (cache[key] && cache[key].length > 0) {
        return { primary: cache[key][0], alternatives: cache[key].slice(1) };
    }

    // Try local dictionary
    const local = lookupLocal(key);
    if (local) {
        cache[key] = local;
        return { primary: local[0], alternatives: local.slice(1) };
    }

    // Fallback to Gemini API (with error handling)
    try {
        const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: [{ word, context: "" }] }),
        });

        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.translations) && data.translations.length > 0) {
                const entry = data.translations[0];
                if (entry.ja && entry.ja.length > 0) {
                    cache[key] = entry.ja;
                    return { primary: entry.ja[0], alternatives: entry.ja.slice(1) };
                }
            }
        }
    } catch {
        // Silently fail — no translation available
    }

    return null;
}

// Legacy exports (no longer used but kept for safety)
export function getCachedDefinition(): string | null { return null; }
export async function translateDefinition(): Promise<string | null> { return null; }
