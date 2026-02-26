'use client';

import React, { useEffect, useRef } from 'react';
import { OcrWord } from '@/src/lib/types';
import { getHighlightStyle, getWordLevel, getLevelDescription } from '@/src/lib/wordLevels';
import { translateSingleWord } from '@/src/lib/translationCache';
import { PopupScaleMode, PopupPositionMode } from './UISettings';

interface WordPopupProps {
    word: OcrWord;
    anchorRect: DOMRect;
    onClose: () => void;
    translationCache: Record<string, string>;
    scaleMode?: PopupScaleMode;
    positionMode?: PopupPositionMode;
}

export default function WordPopup({
    word,
    anchorRect,
    onClose,
    translationCache,
    scaleMode = 'dynamic',
    positionMode = 'near'
}: WordPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    const wordKey = word.text.toLowerCase().replace(/[^a-z'-]/g, '');

    // Get from pre-fetched cache
    const primaryJa = translationCache[`primary:${wordKey}`] || null;
    const altsJa = translationCache[`alts:${wordKey}`] || null;

    // If not in cache, try synchronous local lookup
    const localResult = (!primaryJa) ? translateSingleWord(word.text) : null;

    const displayPrimary = primaryJa || localResult?.primary || null;
    const displayAlts = altsJa
        ? altsJa.split(' / ')
        : localResult?.alternatives || [];

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

    // Visual Viewport Logic for Native Zoom stability
    const [viewport, setViewport] = React.useState<{ scale: number; offsetLeft: number; offsetTop: number; width: number; height: number } | null>(null);

    useEffect(() => {
        const handler = () => {
            if (!window.visualViewport) return;
            setViewport({
                scale: window.visualViewport.scale,
                offsetLeft: window.visualViewport.offsetLeft,
                offsetTop: window.visualViewport.offsetTop,
                width: window.visualViewport.width,
                height: window.visualViewport.height
            });
        };

        if (typeof window !== 'undefined' && window.visualViewport) {
            handler();
            window.visualViewport.addEventListener('resize', handler);
            window.visualViewport.addEventListener('scroll', handler);
        }

        return () => {
            if (typeof window !== 'undefined' && window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handler);
                window.visualViewport.removeEventListener('scroll', handler);
            }
        };
    }, []);

    // Layout Logic
    const isBottom = positionMode === 'bottom';

    // Sizing
    let baseFontSize = 16;
    let titleFontSize = 18;

    if (scaleMode === 'dynamic') {
        const h = anchorRect.height || 20;
        baseFontSize = Math.max(12, Math.min(18, h * 0.8));
        titleFontSize = Math.max(14, Math.min(22, h * 0.9));
    } else {
        baseFontSize = 16;
        titleFontSize = 20;
    }

    // Styles
    let popupStyle: React.CSSProperties = {};
    let overlayClass = "";
    const isReady = !!viewport;
    const currentScale = viewport?.scale || 1;

    if (isBottom) {
        overlayClass = "fixed inset-0 z-50 pointer-events-none overflow-hidden";

        if (isReady && viewport) {
            const vvBottom = viewport.offsetTop + viewport.height;
            const vvLeft = viewport.offsetLeft;
            const scaleFactor = 1 / viewport.scale;
            const calculatedWidth = viewport.width * viewport.scale;

            popupStyle = {
                position: 'absolute',
                left: 0,
                top: 0,
                width: calculatedWidth,
                transformOrigin: 'bottom left',
                transform: `translate(${vvLeft}px, ${vvBottom}px) translateY(-100%) scale(${scaleFactor})`,
                pointerEvents: 'auto',
                opacity: 1,
            };
        } else {
            popupStyle = { opacity: 0 };
        }

    } else {
        const top = anchorRect.bottom + (8 / currentScale);
        const scaleFactor = 1 / currentScale;

        const popupMaxHalfWidth = 140 / currentScale;
        let clampLeft: number, clampRight: number;
        if (viewport) {
            clampLeft = viewport.offsetLeft + popupMaxHalfWidth;
            clampRight = viewport.offsetLeft + viewport.width - popupMaxHalfWidth;
        } else {
            clampLeft = 140;
            clampRight = window.innerWidth - 140;
        }
        const wordCenter = anchorRect.left + anchorRect.width / 2;
        const left = Math.max(clampLeft, Math.min(wordCenter, clampRight));

        overlayClass = "fixed z-50 pointer-events-none";

        popupStyle = {
            position: 'fixed',
            top,
            left,
            transformOrigin: 'top center',
            transform: `translate(-50%, 0) scale(${scaleFactor})`,
            maxWidth: '90vw',
            pointerEvents: 'auto',
            opacity: isReady ? 1 : 0,
            transition: 'opacity 150ms ease-out',
        };
    }

    const animationClass = "";

    return (
        <div className={overlayClass}>
            <div
                ref={popupRef}
                className={animationClass}
                style={popupStyle}
            >
                <div
                    className={`
                        relative bg-gray-900 border-gray-700 shadow-2xl shadow-black/80 p-4 pointer-events-auto
                        ${isBottom ? 'border-t rounded-t-2xl pb-8' : 'border rounded-xl min-w-[120px] max-w-[280px]'}
                    `}
                >
                    {/* Arrow (only for floating) */}
                    {!isBottom && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-gray-900 border-l border-t border-gray-700" />
                    )}

                    <div className="relative z-10 flex flex-col gap-2">
                        {/* Header: Word + Level */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <p className="font-bold text-white tracking-wide leading-none" style={{ fontSize: titleFontSize }}>{word.text}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const u = new SpeechSynthesisUtterance(word.text);
                                        u.lang = 'en-US';
                                        window.speechSynthesis.cancel();
                                        window.speechSynthesis.speak(u);
                                    }}
                                    className="flex items-center justify-center rounded-full bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-all"
                                    style={{ width: titleFontSize * 1.4, height: titleFontSize * 1.4 }}
                                    title="Play pronunciation"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width={titleFontSize * 0.7} height={titleFontSize * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                    <p className="font-bold text-amber-300 leading-snug" style={{ fontSize: baseFontSize }}>
                                        {displayPrimary}
                                    </p>
                                    {displayAlts.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {displayAlts.slice(0, 3).map((alt, i) => (
                                                <p key={i} className="text-gray-400" style={{ fontSize: baseFontSize * 0.85 }}>
                                                    {alt}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">辞書に未登録</p>
                            )}
                        </div>

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
        </div>
    );
}
