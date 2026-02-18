'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ImageUploader from '@/src/components/ImageUploader';
import HighlightOverlay from '@/src/components/HighlightOverlay';
import WordPopup from '@/src/components/WordPopup';
import UISettings, { PopupScaleMode, PopupPositionMode } from '@/src/components/UISettings';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useOcr } from '@/src/components/OcrAnalyzer';
import {
    CEFRLevel,
    ALL_LEVELS,
    getLevelDescription,
    getRelativeDifficulty,
    getHighlightStyle,
} from '@/src/lib/wordLevels';
import { OcrWord, OcrResult } from '@/src/lib/types';
import { prefetchTranslations, clearTranslationCache, translateSingleWord } from '@/src/lib/translationCache';

/** Rotate an image on a canvas by the given radians and return the new data URL + dimensions */
function rotateImageOnCanvas(
    imgSrc: string,
    radians: number
): Promise<{ dataUrl: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const cos = Math.abs(Math.cos(radians));
            const sin = Math.abs(Math.sin(radians));
            const newW = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
            const newH = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);

            const canvas = document.createElement('canvas');
            canvas.width = newW;
            canvas.height = newH;
            const ctx = canvas.getContext('2d')!;
            ctx.translate(newW / 2, newH / 2);
            ctx.rotate(radians);
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

            resolve({ dataUrl: canvas.toDataURL('image/png'), width: newW, height: newH });
        };
        img.onerror = reject;
        img.src = imgSrc;
    });
}

export default function Home() {
    // User's current CEFR level
    const [userLevel, setUserLevel] = useState<CEFRLevel>('B2');

    // Image state
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
    const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // OCR state
    const { analyze, isAnalyzing, progress, error } = useOcr();
    const [words, setWords] = useState<OcrWord[]>([]);

    // Translation cache state
    const [translationCache, setTranslationCache] = useState<Record<string, string>>({});
    const [isTranslating, setIsTranslating] = useState(false);

    // UI Settings State
    const [popupScaleMode, setPopupScaleMode] = useState<PopupScaleMode>('dynamic');
    const [popupPositionMode, setPopupPositionMode] = useState<PopupPositionMode>('near');

    // Popup state
    const [selectedWord, setSelectedWord] = useState<OcrWord | null>(null);
    const [popupAnchor, setPopupAnchor] = useState<DOMRect | null>(null);

    // Update display size on resize
    const updateDisplaySize = useCallback(() => {
        if (imageRef.current) {
            setImageDisplaySize({
                width: imageRef.current.clientWidth,
                height: imageRef.current.clientHeight,
            });
        }
    }, []);

    useEffect(() => {
        window.addEventListener('resize', updateDisplaySize);
        return () => window.removeEventListener('resize', updateDisplaySize);
    }, [updateDisplaySize]);

    // Handle image selection
    const handleImageSelected = useCallback(
        async (_file: File, dataUrl: string) => {
            setImageDataUrl(dataUrl);
            setWords([]);
            setSelectedWord(null);
            clearTranslationCache();
            setTranslationCache({});

            // Wait for image to load to get natural dimensions
            const img = new Image();
            img.onload = async () => {
                setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });

                // Start OCR automatically
                const ocrResult = await analyze(dataUrl, userLevel);
                setWords(ocrResult.words);

                // If Tesseract applied significant rotation, rotate the displayed image to match
                const rad = ocrResult.rotateRadians;
                if (rad !== null && Math.abs(rad) >= 0.005) {
                    try {
                        const rotated = await rotateImageOnCanvas(dataUrl, rad);
                        setImageDataUrl(rotated.dataUrl);
                        setImageNaturalSize({ width: rotated.width, height: rotated.height });
                    } catch {
                        // Rotation failed — keep original image
                    }
                }

                // Pre-fetch translations in background
                setIsTranslating(true);
                await prefetchTranslations(
                    ocrResult.words.map(w => ({ text: w.text, context: w.context })),
                    (updatedCache) => setTranslationCache({ ...updatedCache })
                );
                setIsTranslating(false);
            };
            img.src = dataUrl;
        },
        [analyze, userLevel]
    );

    // Handle user level change — re-classify words dynamically
    const handleLevelChange = useCallback(
        (newLevel: CEFRLevel) => {
            setUserLevel(newLevel);
            setSelectedWord(null);

            // Re-compute difficulty for existing words based on new user level
            setWords((prev) =>
                prev.map((w) => ({
                    ...w,
                    difficulty: getRelativeDifficulty(w.text, newLevel),
                }))
            );
        },
        []
    );

    // Handle word click
    const handleWordClick = useCallback((word: OcrWord, rect: DOMRect) => {
        setSelectedWord(word);
        setPopupAnchor(rect);
    }, []);

    // On image load
    const handleImageLoad = useCallback(() => {
        updateDisplaySize();
    }, [updateDisplaySize]);

    // Stats
    const highlightedWords = words.filter((w) => getHighlightStyle(w.difficulty).shouldHighlight);
    const aboveCount = words.filter((w) => w.difficulty === 'above').length;
    const atCount = words.filter((w) => w.difficulty === 'at').length;
    const belowCount = words.filter((w) => w.difficulty === 'below').length;

    return (
        <main className="min-h-screen bg-gray-950 text-gray-100">
            {/* Header */}
            <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                                    WordLens
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500 hidden sm:block">English Vocabulary Analyzer</p>
                        </div>
                    </div>

                    {/* Level selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 hidden sm:block">My Level:</label>
                        <div className="flex bg-gray-900 rounded-lg border border-gray-800 p-0.5">
                            {ALL_LEVELS.map((level) => (
                                <button
                                    key={level}
                                    onClick={() => handleLevelChange(level)}
                                    className={`
                    px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-200
                    ${userLevel === level
                                            ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-gray-900 shadow-md shadow-amber-500/30'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }
                  `}
                                    title={getLevelDescription(level)}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Upload area — show when no image */}
                {!imageDataUrl && (
                    <div className="mt-8">
                        <ImageUploader onImageSelected={handleImageSelected} />
                    </div>
                )}

                {/* Analyzing indicator */}
                {isAnalyzing && (
                    <div className="mt-6 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-gray-400">Analyzing text...</span>
                            <span className="text-sm font-mono text-amber-400">{progress}%</span>
                        </div>
                        <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mt-6 p-4 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-sm">
                        <span className="font-semibold">Error:</span> {error}
                    </div>
                )}

                {/* Image display with overlay */}
                {imageDataUrl && (
                    <div className="mt-6">
                        {/* Stats bar */}
                        {words.length > 0 && (
                            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
                                <span className="text-gray-500">{words.length} words detected</span>
                                <span className="text-gray-700">|</span>
                                {aboveCount > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500/70" />
                                        <span className="text-gray-400">{aboveCount} above level</span>
                                    </span>
                                )}
                                {atCount > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                                        <span className="text-gray-400">{atCount} at level</span>
                                    </span>
                                )}
                                {belowCount > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400/50" />
                                        <span className="text-gray-400">{belowCount} recently learned</span>
                                    </span>
                                )}
                                {highlightedWords.length === 0 && (
                                    <span className="text-gray-500">No highlighted words</span>
                                )}
                            </div>
                        )}

                        {/* Image container */}
                        <div
                            ref={containerRef}
                            className="relative inline-block rounded-xl overflow-hidden border border-gray-800 shadow-2xl shadow-black/40 bg-gray-900"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                ref={imageRef}
                                src={imageDataUrl}
                                alt="Uploaded text"
                                onLoad={handleImageLoad}
                                className="block max-w-full h-auto"
                                style={{ maxHeight: '70vh' }}
                            />

                            {/* Highlight overlay */}
                            {words.length > 0 && imageDisplaySize.width > 0 && (
                                <HighlightOverlay
                                    words={words}
                                    imageWidth={imageNaturalSize.width}
                                    imageHeight={imageNaturalSize.height}
                                    displayWidth={imageDisplaySize.width}
                                    displayHeight={imageDisplaySize.height}
                                    onWordClick={handleWordClick}
                                />
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={() => {
                                    setImageDataUrl(null);
                                    setWords([]);
                                    setSelectedWord(null);
                                }}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all duration-200"
                            >
                                Upload New Image
                            </button>
                            {words.length > 0 && (
                                <button
                                    onClick={async () => {
                                        const ocrResult = await analyze(imageDataUrl, userLevel);
                                        setWords(ocrResult.words);
                                    }}
                                    disabled={isAnalyzing}
                                    className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                                >
                                    Re-Analyze
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="mt-10 p-5 bg-gray-900/60 border border-gray-800/60 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Color Legend</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.45)', border: '1.5px solid rgba(249, 115, 22, 0.7)' }} />
                            <span className="text-gray-400">Above your level</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.45)', border: '1.5px solid rgba(234, 179, 8, 0.7)' }} />
                            <span className="text-gray-400">At your level (learning now)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded" style={{ backgroundColor: 'rgba(96, 165, 250, 0.3)', border: '1.5px solid rgba(96, 165, 250, 0.5)' }} />
                            <span className="text-gray-400">Recently learned</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Word popup */}
            {selectedWord && (popupAnchor || popupPositionMode === 'bottom') && (
                <WordPopup
                    word={selectedWord}
                    anchorRect={popupAnchor || new DOMRect()} // Anchor not needed for bottom mode
                    onClose={() => setSelectedWord(null)}
                    translationCache={translationCache}
                    scaleMode={popupScaleMode}
                    positionMode={popupPositionMode}
                />
            )}

            {/* UI Settings Toggle */}
            <UISettings
                scaleMode={popupScaleMode}
                onScaleChange={setPopupScaleMode}
                positionMode={popupPositionMode}
                onPositionChange={setPopupPositionMode}
            />
        </main>
    );
}
