'use client';

import React, { useState, useMemo } from 'react';
import { OcrWord } from '@/src/lib/types';
import { RelativeDifficulty } from '@/src/lib/wordLevels';

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
    const [copied, setCopied] = useState(false);

    const grouped = useMemo(() => {
        const groups: Record<RelativeDifficulty, string[]> = {
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
            groups[w.difficulty].push(w.text);
        }

        return groups;
    }, [words]);

    const copyAboveWords = () => {
        const text = grouped.above.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

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
                    {(['above', 'at', 'below'] as RelativeDifficulty[]).map((difficulty) => {
                        const config = DIFFICULTY_CONFIG[difficulty];
                        const wordList = grouped[difficulty];
                        if (wordList.length === 0) return null;

                        return (
                            <div key={difficulty}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${config.dotClass}`} />
                                        <span className={`text-sm font-semibold ${config.color}`}>
                                            {config.label} ({wordList.length})
                                        </span>
                                    </div>
                                    {difficulty === 'above' && (
                                        <button
                                            onClick={copyAboveWords}
                                            className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all"
                                        >
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {wordList.map((w, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-300 border border-gray-700/50"
                                        >
                                            {w}
                                        </span>
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
