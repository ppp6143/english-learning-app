'use client';

import React, { useState, useMemo } from 'react';
import { OcrWord } from '@/src/lib/types';
import { RelativeDifficulty } from '@/src/lib/wordLevels';
import { translateSingleWord } from '@/src/lib/translationCache';

interface WordListPanelProps {
    words: OcrWord[];
}

const DIFFICULTY_CONFIG: Record<RelativeDifficulty, { label: string; color: string; dotClass: string }> = {
    above: { label: 'Above Level', color: 'text-orange-400', dotClass: 'bg-orange-500/70' },
    at: { label: 'At Level', color: 'text-yellow-400', dotClass: 'bg-yellow-400/70' },
    below: { label: 'Recently Learned', color: 'text-blue-400', dotClass: 'bg-blue-400/50' },
    known: { label: 'Known', color: 'text-gray-500', dotClass: 'bg-gray-500/50' },
    unknown: { label: 'Unknown Level', color: 'text-gray-500', dotClass: 'bg-gray-500/50' },
};

export default function WordListPanel({ words }: WordListPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    const grouped = useMemo(() => {
        const groups: Record<RelativeDifficulty, { word: string; translation: string | null }[]> = {
            above: [],
            at: [],
            below: [],
            known: [],
            unknown: [],
        };

        const seen = new Set<string>();
        for (const w of words) {
            const lower = w.text.toLowerCase();
            if (seen.has(lower)) continue;
            seen.add(lower);
            const tr = translateSingleWord(w.text);
            groups[w.difficulty].push({ word: w.text, translation: tr ? tr.primary : null });
        }

        return groups;
    }, [words]);

    if (words.length === 0) return null;

    return (
        <div className="mt-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all duration-200"
            >
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Word List
            </button>

            {isOpen && (
                <div className="mt-3 p-4 bg-gray-900/80 border border-gray-800/60 rounded-xl space-y-4">
                    {(['at', 'below'] as RelativeDifficulty[]).map((difficulty) => {
                        const config = DIFFICULTY_CONFIG[difficulty];
                        const wordList = grouped[difficulty];
                        if (wordList.length === 0) return null;

                        return (
                            <div key={difficulty}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${config.dotClass}`} />
                                    <span className={`text-sm font-semibold ${config.color}`}>
                                        {config.label} ({wordList.length})
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {wordList.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between px-3 py-1.5 text-sm rounded bg-gray-800/60 border border-gray-700/30"
                                        >
                                            <span className="text-gray-200 font-medium">{item.word}</span>
                                            {item.translation && (
                                                <span className="text-gray-500 text-xs truncate ml-3 max-w-[60%] text-right">
                                                    {item.translation}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
