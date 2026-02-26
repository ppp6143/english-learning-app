'use client';

import React from 'react';
import { OcrWord } from '@/src/lib/types';
import { getHighlightStyle } from '@/src/lib/wordLevels';

interface HighlightOverlayProps {
    words: OcrWord[];
    imageWidth: number;
    imageHeight: number;
    displayWidth: number;
    displayHeight: number;
    onWordClick: (word: OcrWord, rect: DOMRect) => void;
}

export default function HighlightOverlay({
    words,
    imageWidth,
    imageHeight,
    displayWidth,
    displayHeight,
    onWordClick,
}: HighlightOverlayProps) {
    const scaleX = displayWidth / imageWidth;
    const scaleY = displayHeight / imageHeight;

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{ width: displayWidth, height: displayHeight }}
        >
            {words.map((word, index) => {
                const style = getHighlightStyle(word.difficulty);
                const isHighlighted = style.shouldHighlight;

                const left = word.bbox.x0 * scaleX;
                const top = word.bbox.y0 * scaleY;
                const width = (word.bbox.x1 - word.bbox.x0) * scaleX;
                const height = (word.bbox.y1 - word.bbox.y0) * scaleY;

                const isLowConfidence = word.confidence < 60;

                return (
                    <button
                        key={`${word.text}-${index}`}
                        className={`absolute pointer-events-auto rounded-sm
                       transition-all duration-200 ease-out
                       cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50
                       ${isHighlighted
                                ? 'hover:scale-105 hover:brightness-125'
                                : 'hover:bg-white/10 hover:ring-1 hover:ring-white/20'
                            }`}
                        style={{
                            left,
                            top,
                            width,
                            height,
                            backgroundColor: isHighlighted ? style.bgColor : 'transparent',
                            border: isHighlighted
                                ? `1.5px ${isLowConfidence ? 'dashed' : 'solid'} ${style.borderColor}`
                                : '1.5px solid transparent',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            onWordClick(word, rect);
                        }}
                        title={word.text}
                    />
                );
            })}
        </div>
    );
}
