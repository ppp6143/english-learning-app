/**
 * Morpheme analyzer — decomposes unknown words into prefix + root + suffix.
 * Only operates on words NOT found in the local dictionary.
 */

import DICT from './localDictionary';
import { getLemmatizedCandidates } from './lemmatizer';

export interface Morpheme {
    text: string;
    type: 'prefix' | 'root' | 'suffix';
    meaning: string;
}

export interface MorphemeDecomposition {
    original: string;
    morphemes: Morpheme[];
    rootTranslation?: string;
}

interface AffixEntry {
    affix: string;
    meaning: string;
}

const PREFIXES: AffixEntry[] = [
    { affix: 'un', meaning: '否定・反対 (not)' },
    { affix: 're', meaning: '再び (again)' },
    { affix: 'dis', meaning: '否定・反対 (not/opposite)' },
    { affix: 'pre', meaning: '前に (before)' },
    { affix: 'post', meaning: '後に (after)' },
    { affix: 'over', meaning: '過度に (excessive)' },
    { affix: 'under', meaning: '不足・下 (below/insufficient)' },
    { affix: 'mis', meaning: '誤り (wrong)' },
    { affix: 'out', meaning: '外・超越 (beyond)' },
    { affix: 'inter', meaning: '間 (between)' },
    { affix: 'super', meaning: '超 (above/beyond)' },
    { affix: 'semi', meaning: '半分 (half)' },
    { affix: 'anti', meaning: '反対 (against)' },
    { affix: 'auto', meaning: '自動・自己 (self)' },
    { affix: 'co', meaning: '共同 (together)' },
    { affix: 'counter', meaning: '対抗 (against)' },
    { affix: 'de', meaning: '除去・逆 (remove/reverse)' },
    { affix: 'extra', meaning: '外・超 (beyond)' },
    { affix: 'fore', meaning: '前 (before/front)' },
    { affix: 'non', meaning: '非・不 (not)' },
    { affix: 'sub', meaning: '下・副 (under/below)' },
    { affix: 'trans', meaning: '横切る (across)' },
    { affix: 'multi', meaning: '多 (many)' },
    { affix: 'micro', meaning: '微小 (small)' },
    { affix: 'macro', meaning: '大きい (large)' },
    // im-/in-/ir-/il- (negative)
    { affix: 'im', meaning: '否定 (not)' },
    { affix: 'in', meaning: '否定・中 (not/into)' },
    { affix: 'ir', meaning: '否定 (not)' },
    { affix: 'il', meaning: '否定 (not)' },
];

const SUFFIXES: AffixEntry[] = [
    { affix: 'tion', meaning: '名詞化 (action/state)' },
    { affix: 'sion', meaning: '名詞化 (action/state)' },
    { affix: 'ment', meaning: '名詞化 (result/action)' },
    { affix: 'ness', meaning: '名詞化 (state/quality)' },
    { affix: 'ity', meaning: '名詞化 (quality)' },
    { affix: 'ance', meaning: '名詞化 (state/action)' },
    { affix: 'ence', meaning: '名詞化 (state/action)' },
    { affix: 'ful', meaning: '〜に満ちた (full of)' },
    { affix: 'less', meaning: '〜のない (without)' },
    { affix: 'able', meaning: '〜できる (capable of)' },
    { affix: 'ible', meaning: '〜できる (capable of)' },
    { affix: 'ous', meaning: '〜の性質 (having quality)' },
    { affix: 'ious', meaning: '〜の性質 (having quality)' },
    { affix: 'ive', meaning: '〜の傾向 (tending to)' },
    { affix: 'al', meaning: '〜の (relating to)' },
    { affix: 'ly', meaning: '副詞化 (in manner of)' },
    { affix: 'er', meaning: '〜する人 (one who)' },
    { affix: 'or', meaning: '〜する人 (one who)' },
    { affix: 'ist', meaning: '〜する人 (specialist)' },
    { affix: 'ism', meaning: '主義・状態 (doctrine/state)' },
    { affix: 'ize', meaning: '〜にする (to make)' },
    { affix: 'ise', meaning: '〜にする (to make)' },
    { affix: 'en', meaning: '〜にする (to make)' },
    { affix: 'ward', meaning: '〜の方向 (direction)' },
    { affix: 'ship', meaning: '状態・関係 (state/relationship)' },
];

// Sort suffixes longest-first so longer matches take priority (e.g. "ious" before "ous")
const SUFFIXES_SORTED = [...SUFFIXES].sort((a, b) => b.affix.length - a.affix.length);
// Sort prefixes longest-first
const PREFIXES_SORTED = [...PREFIXES].sort((a, b) => b.affix.length - a.affix.length);

/** Convert "word" → "Word" */
function toTitleCase(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Check if a root string corresponds to a real English word in the dictionary.
 * Tries the root directly and via lemmatization.
 */
function isValidRoot(root: string): boolean {
    if (root.length < 2) return false;
    const w = root.toLowerCase();

    // Direct lookup
    if (DICT[w]) return true;
    if (DICT[toTitleCase(w)]) return true;

    // Lemmatized candidates
    const candidates = getLemmatizedCandidates(w);
    for (const c of candidates) {
        if (DICT[c]) return true;
        if (DICT[toTitleCase(c)]) return true;
    }

    return false;
}

/**
 * Get dictionary translation for a root word.
 */
function getRootTranslation(root: string): string | undefined {
    const w = root.toLowerCase();

    // Helper to extract first translation
    const extract = (entries: string[]): string => {
        // Reuse a simplified version of cleanDictionaryEntry logic
        for (const entry of entries) {
            if (/^=/.test(entry.trim())) continue;
            let text = entry;
            text = text.replace(/《[^》]*》/g, '');
            text = text.replace(/[『』]/g, '');
            text = text.replace(/\([^)]*\)/g, '');
            text = text.replace(/（[^）]*）/g, '');
            const parts = text.split(/[;；、,，]+/);
            for (const part of parts) {
                const trimmed = part.trim();
                if (!trimmed) continue;
                if (/^[a-zA-Z\s\-'.:!?]+$/.test(trimmed)) continue;
                return trimmed;
            }
        }
        return '';
    };

    if (DICT[w]) return extract(DICT[w]) || undefined;
    if (DICT[toTitleCase(w)]) return extract(DICT[toTitleCase(w)]) || undefined;

    const candidates = getLemmatizedCandidates(w);
    for (const c of candidates) {
        if (DICT[c]) return extract(DICT[c]) || undefined;
        if (DICT[toTitleCase(c)]) return extract(DICT[toTitleCase(c)]) || undefined;
    }

    return undefined;
}

/**
 * Check if the word exists in the local dictionary (including lemmatized forms).
 */
function isInDictionary(word: string): boolean {
    const w = word.toLowerCase().replace(/[^a-z'-]/g, '');
    if (!w) return false;

    if (DICT[w]) return true;
    if (DICT[toTitleCase(w)]) return true;

    const raw = word.replace(/[^a-zA-Z'-]/g, '');
    if (raw && raw !== w && raw !== toTitleCase(w) && DICT[raw]) return true;

    const candidates = getLemmatizedCandidates(w);
    for (const c of candidates) {
        if (DICT[c]) return true;
        if (DICT[toTitleCase(c)]) return true;
    }

    return false;
}

// Consonants for double-consonant detection
const CONSONANTS = new Set('bcdfghjklmnpqrstvwxyz'.split(''));

interface DecompositionCandidate {
    morphemes: Morpheme[];
    rootTranslation?: string;
    score: number;
}

/**
 * Try to find valid root forms from a candidate root string.
 * Returns [resolvedRoot, rootTranslation] or null.
 */
function resolveRoot(root: string): [string, string | undefined] | null {
    // Direct check
    if (isValidRoot(root)) {
        return [root, getRootTranslation(root)];
    }

    // Try restoring trailing 'e' (e.g., lovable → lov → love)
    const withE = root + 'e';
    if (isValidRoot(withE)) {
        return [withE, getRootTranslation(withE)];
    }

    // Try removing doubled final consonant (e.g., unforgetttable scenario)
    if (root.length >= 3 && root[root.length - 1] === root[root.length - 2] && CONSONANTS.has(root[root.length - 1])) {
        const dedoubled = root.slice(0, -1);
        if (isValidRoot(dedoubled)) {
            return [dedoubled, getRootTranslation(dedoubled)];
        }
        // Also try dedoubled + 'e'
        const dedoubledE = dedoubled + 'e';
        if (isValidRoot(dedoubledE)) {
            return [dedoubledE, getRootTranslation(dedoubledE)];
        }
    }

    // Try restoring 'y' → 'i' transformation (e.g., happiness → happi → happy)
    if (root.endsWith('i')) {
        const withY = root.slice(0, -1) + 'y';
        if (isValidRoot(withY)) {
            return [withY, getRootTranslation(withY)];
        }
    }

    // Try removing trailing 'at' for -ation (e.g., decorat → decorate)
    if (root.endsWith('at')) {
        const base = root.slice(0, -2);
        if (base.length >= 2 && isValidRoot(base)) {
            return [base, getRootTranslation(base)];
        }
        const baseE = root.slice(0, -2) + 'e';
        if (isValidRoot(baseE)) {
            return [baseE, getRootTranslation(baseE)];
        }
    }

    return null;
}

/**
 * Decompose a word into prefix + root + suffix.
 * Returns null if the word is in the dictionary (we don't decompose known words).
 */
export function decomposeWord(word: string): MorphemeDecomposition | null {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w || w.length < 4) return null;

    // CRITICAL: Do not decompose words that exist in the dictionary
    if (isInDictionary(w)) return null;

    const candidates: DecompositionCandidate[] = [];

    // Try all combinations of prefix × suffix
    const prefixOptions: Array<{ prefix: AffixEntry | null; remainder: string }> = [
        { prefix: null, remainder: w },
    ];

    for (const p of PREFIXES_SORTED) {
        if (w.startsWith(p.affix) && w.length > p.affix.length + 2) {
            prefixOptions.push({ prefix: p, remainder: w.slice(p.affix.length) });
        }
    }

    for (const { prefix, remainder } of prefixOptions) {
        // Try each suffix
        const suffixOptions: Array<{ suffix: AffixEntry | null; root: string }> = [
            { suffix: null, root: remainder },
        ];

        for (const s of SUFFIXES_SORTED) {
            if (remainder.endsWith(s.affix) && remainder.length > s.affix.length + 1) {
                suffixOptions.push({ suffix: s, root: remainder.slice(0, -s.affix.length) });
            }
        }

        for (const { suffix, root } of suffixOptions) {
            // Must have at least a prefix or suffix to decompose
            if (!prefix && !suffix) continue;

            const resolved = resolveRoot(root);
            if (!resolved) continue;

            const [resolvedRoot, rootTranslation] = resolved;

            // Build morphemes
            const morphemes: Morpheme[] = [];
            let score = 0;

            if (prefix) {
                morphemes.push({ text: prefix.affix, type: 'prefix', meaning: prefix.meaning });
                score += prefix.affix.length;
            }

            morphemes.push({ text: resolvedRoot, type: 'root', meaning: rootTranslation || resolvedRoot });

            if (suffix) {
                morphemes.push({ text: suffix.affix, type: 'suffix', meaning: suffix.meaning });
                score += suffix.affix.length;
            }

            // Prefer decompositions with both prefix and suffix
            if (prefix && suffix) score += 5;
            // Prefer longer roots
            score += resolvedRoot.length;
            // Bonus for root translation found
            if (rootTranslation) score += 3;

            candidates.push({ morphemes, rootTranslation, score });
        }
    }

    if (candidates.length === 0) return null;

    // Pick the best candidate by score
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    return {
        original: word,
        morphemes: best.morphemes,
        rootTranslation: best.rootTranslation,
    };
}
