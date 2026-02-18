'use client';

import React, { useEffect, useRef, useState } from 'react';
import { OcrWord } from '@/src/lib/types';
import { getHighlightStyle, getWordLevel, getLevelDescription } from '@/src/lib/wordLevels';
import { translateSingleWord } from '@/src/lib/translationCache';

interface WordPopupProps {
    word: OcrWord;
    anchorRect: DOMRect;
    onClose: () => void;
    translationCache: Record<string, string>;
}

export default function WordPopup({ word, anchorRect, onClose, translationCache }: WordPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [onDemandJa, setOnDemandJa] = useState<{ primary: string; alternatives?: string[] } | null>(null);
    const [jaLoading, setJaLoading] = useState(false);

    const wordKey = word.text.toLowerCase().replace(/[^a-z'-]/g, '');

    // Get from pre-fetched cache
    const primaryJa = translationCache[`primary:${wordKey}`] || null;
    const altsJa = translationCache[`alts:${wordKey}`] || null;

    // If not cached, fetch on demand
    useEffect(() => {
        if (primaryJa || onDemandJa) {
            setJaLoading(false);
            return;
        }

        let cancelled = false;
        const fetch = async () => {
            setJaLoading(true);
            try {
                // Safety timeout to prevent infinite loading
                const timeoutPromise = new Promise<null>((resolve) =>
                    setTimeout(() => resolve(null), 8000)
                );

                const result = await Promise.race([
                    translateSingleWord(word.text, word.context || word.text),
                    timeoutPromise
                ]);

                if (!cancelled && result) setOnDemandJa(result);
            } catch (error) {
                console.error("Translation fetch failed", error);
            } finally {
                if (!cancelled) setJaLoading(false);
            }
        };
        fetch();
        return () => { cancelled = true; };
    }, [word.text, word.context, primaryJa, onDemandJa]);

    // Clean definition helper
    const cleanDef = (text: string | null) => {
        if (!text) return null;
        let cleaned = text
            // Remove context/grammar/preposition info in various brackets
            .replace(/[《〈〔（\(][^《〈〔（\(》〉〕）\)]*[》〉〕）\)]/g, '')
            // Remove [ ... ]
            .replace(/[\[].*?[\]]/g, '')
            // Remove 『』 brackets but keep content
            .replace(/[『』]/g, '')
            // Unify separators and cleanup
            .replace(/[,，、]+/g, '、')
            .replace(/^[、\s]+|[、\s]+$/g, '')
            .trim();

        // If the result is empty (e.g. only had grammar tags), fallback or keep empty?
        // Usually definitions have some content.
        return cleaned;
    };

    const rawPrimary = primaryJa || onDemandJa?.primary || null;
    const rawAlts = altsJa ? altsJa.split(' / ') : onDemandJa?.alternatives || [];

    const displayPrimary = cleanDef(rawPrimary);
    const displayAlts = rawAlts
        .map(cleanDef)
        .filter((s): s is string => !!s && s.length > 0)
        .slice(0, 3); // Limit relative alternatives for simpler UI

    // Close handlers
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    const style = getHighlightStyle(word.difficulty);
    const level = getWordLevel(word.text);
    const levelDesc = level ? getLevelDescription(level) : null;

    const top = anchorRect.bottom + 8;
    const left = Math.max(140, Math.min(anchorRect.left + anchorRect.width / 2, window.innerWidth - 140));

    return (
        <div
            ref={popupRef}
            className="fixed z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ top, left, transform: 'translateX(-50%)' }}
        >
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/60 p-3.5 min-w-[180px] max-w-[280px]">
                {/* Arrow */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-gray-900 border-l border-t border-gray-700" />

                <div className="relative z-10">
                    {/* Header: Word + Level */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-white tracking-wide">{word.text}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const u = new SpeechSynthesisUtterance(word.text);
                                    u.lang = 'en-US';
                                    window.speechSynthesis.cancel();
                                    window.speechSynthesis.speak(u);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-all"
                                title="Play pronunciation"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: style.bgColor.replace(/[\d.]+\)$/, '1)') }}
                            />
                            <span className="text-[11px] text-gray-400">{level ?? '—'}</span>
                        </div>
                    </div>

                    {/* Hero: Japanese Translation */}
                    <div className="py-2.5 border-t border-gray-800">
                        {displayPrimary ? (
                            <>
                                <p className="text-xl font-bold text-amber-300 leading-snug">
                                    {displayPrimary}
                                </p>
                                {displayAlts.length > 0 && (
                                    <p className="text-sm text-amber-200/50 mt-1">
                                        {displayAlts.join('、')}
                                    </p>
                                )}
                            </>
                        ) : jaLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm text-gray-500">翻訳中...</span>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">—</p>
                        )}
                    </div>

                    {/* Context (if available) */}


                    {/* Footer */}
                    <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                        <span className="text-[10px] text-gray-600">
                            {level ?? '—'}{levelDesc ? ` · ${levelDesc}` : ''}
                        </span>
                        <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">✕</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
