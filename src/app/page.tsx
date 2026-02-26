'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ImageUploader from '@/src/components/ImageUploader';
import HighlightOverlay from '@/src/components/HighlightOverlay';
import WordPopup from '@/src/components/WordPopup';
import UISettings, { PopupScaleMode, PopupPositionMode } from '@/src/components/UISettings';
import WordListPanel from '@/src/components/WordListPanel';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useOcr } from '@/src/components/OcrAnalyzer';
import {
    CEFRLevel,
    ALL_LEVELS,
    getLevelDescription,
    getRelativeDifficulty,
    getHighlightStyle,
    getWordLevel,
} from '@/src/lib/wordLevels';
import { OcrWord, OcrEngine } from '@/src/lib/types';
import { prefetchTranslations, clearTranslationCache, translateSingleWord, translatePhrase, getSuggestions, Suggestion } from '@/src/lib/translationCache';
import { getRelatedPhrasalVerbs, PhrasalVerbEntry } from '@/src/lib/phrasalVerbs';
import { decomposeWord, MorphemeDecomposition } from '@/src/lib/morphemeAnalyzer';

/** Rotate an image 90 degrees clockwise on a canvas */
function rotateImage90CW(
    imgSrc: string
): Promise<{ dataUrl: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalHeight;
            canvas.height = img.naturalWidth;
            const ctx = canvas.getContext('2d')!;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
            resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), width: canvas.width, height: canvas.height });
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
    const [skewAngle, setSkewAngle] = useState(0);

    // Translation cache state
    const [translationCache, setTranslationCache] = useState<Record<string, string>>({});

    // UI Settings State
    const [popupScaleMode, setPopupScaleMode] = useState<PopupScaleMode>('dynamic');
    const [popupPositionMode, setPopupPositionMode] = useState<PopupPositionMode>('near');
    const [ocrEngine, setOcrEngine] = useState<OcrEngine>('tesseract');

    // Popup state
    const [selectedWord, setSelectedWord] = useState<OcrWord | null>(null);
    const [popupAnchor, setPopupAnchor] = useState<DOMRect | null>(null);

    // Manual search state
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [searchResult, setSearchResult] = useState<{
        word: string;
        level: string | null;
        translation: string | null;
        alternatives?: string[];
        source?: 'phrasal' | 'dict' | 'single';
        relatedPhrases?: PhrasalVerbEntry[];
        decomposition?: MorphemeDecomposition | null;
    } | null>(null);

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

    // Handle image selection — auto-analyze immediately
    const handleImageSelected = useCallback(
        async (_file: File, dataUrl: string) => {
            setImageDataUrl(dataUrl);
            setWords([]);
            setSelectedWord(null);
            clearTranslationCache();
            setTranslationCache({});

            const img = new Image();
            img.onload = () => {
                setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = dataUrl;

            const ocrResult = await analyze(dataUrl, userLevel, ocrEngine);
            setWords(ocrResult.words);
            setSkewAngle(ocrResult.skewAngle);

            const finalCache = prefetchTranslations(
                ocrResult.words.map(w => ({ text: w.text })),
            );
            setTranslationCache(finalCache);
        },
        [analyze, userLevel, ocrEngine]
    );

    // Handle manual 90° rotation (image only, no OCR)
    const handleRotate = useCallback(async () => {
        if (!imageDataUrl || isAnalyzing) return;
        try {
            const rotated = await rotateImage90CW(imageDataUrl);
            setImageDataUrl(rotated.dataUrl);
            setImageNaturalSize({ width: rotated.width, height: rotated.height });
            setWords([]);
            setSelectedWord(null);
        } catch {
            // Rotation failed
        }
    }, [imageDataUrl, isAnalyzing]);

    // Handle analyze
    const handleAnalyze = useCallback(async () => {
        if (!imageDataUrl || isAnalyzing) return;
        setWords([]);
        setSelectedWord(null);
        clearTranslationCache();
        setTranslationCache({});

        const ocrResult = await analyze(imageDataUrl, userLevel, ocrEngine);
        setWords(ocrResult.words);
        setSkewAngle(ocrResult.skewAngle);

        const finalCache = prefetchTranslations(
            ocrResult.words.map(w => ({ text: w.text })),
        );
        setTranslationCache(finalCache);
    }, [imageDataUrl, isAnalyzing, analyze, userLevel, ocrEngine]);

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

    // Manual search
    const handleSearch = useCallback((overrideQuery?: string) => {
        const q = (overrideQuery ?? searchInput).trim();
        if (!q) return;

        const hasSpace = /\s/.test(q);

        if (hasSpace) {
            // Multi-word: try phrase lookup
            const phraseResult = translatePhrase(q);
            setSearchResult({
                word: q,
                level: null,
                translation: phraseResult ? phraseResult.primary : null,
                alternatives: phraseResult?.alternatives,
                source: phraseResult?.source,
            });
        } else {
            // Single word: standard lookup + related phrasal verbs + decomposition
            const level = getWordLevel(q);
            const tr = translateSingleWord(q);
            const related = getRelatedPhrasalVerbs(q);
            const decomp = !tr ? decomposeWord(q) : null;

            setSearchResult({
                word: q,
                level: level,
                translation: tr ? tr.primary : null,
                alternatives: tr?.alternatives,
                source: tr ? 'single' : undefined,
                relatedPhrases: related.length > 0 ? related : undefined,
                decomposition: decomp,
            });
        }
    }, [searchInput]);

    const handleSearchClear = useCallback(() => {
        setSearchInput('');
        setSearchResult(null);
        setSuggestions([]);
        setShowSuggestions(false);
    }, []);

    // Autocomplete: debounced suggestions
    useEffect(() => {
        if (searchInput.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const timer = setTimeout(() => {
            const results = getSuggestions(searchInput.trim());
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
            setSelectedSuggestionIndex(-1);
        }, 150);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Autocomplete: click-outside handler
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Autocomplete: select a suggestion
    const handleSelectSuggestion = useCallback((word: string) => {
        setSearchInput(word);
        setShowSuggestions(false);
        setSuggestions([]);
        handleSearch(word);
    }, [handleSearch]);

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

                        {/* Manual word search bar */}
                        <div className="mb-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div ref={searchContainerRef} className="relative flex-1">
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                        onKeyDown={(e) => {
                                            if (!showSuggestions || suggestions.length === 0) {
                                                if (e.key === 'Enter') handleSearch();
                                                return;
                                            }
                                            if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setSelectedSuggestionIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
                                            } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
                                            } else if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (selectedSuggestionIndex >= 0) {
                                                    handleSelectSuggestion(suggestions[selectedSuggestionIndex].word);
                                                } else {
                                                    setShowSuggestions(false);
                                                    handleSearch();
                                                }
                                            } else if (e.key === 'Escape') {
                                                setShowSuggestions(false);
                                            }
                                        }}
                                        placeholder="Search a word..."
                                        className="w-full px-3 py-2 pr-8 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                                        autoComplete="off"
                                    />
                                    {searchInput && (
                                        <button
                                            onClick={handleSearchClear}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 z-10"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                    {/* Autocomplete dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl shadow-black/40 overflow-hidden">
                                            {suggestions.map((s, i) => (
                                                <li
                                                    key={s.word + s.source}
                                                    onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s.word); }}
                                                    onMouseEnter={() => setSelectedSuggestionIndex(i)}
                                                    className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${
                                                        i === selectedSuggestionIndex
                                                            ? 'bg-gray-800 text-amber-300'
                                                            : 'text-gray-300 hover:bg-gray-800/60'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2 min-w-0">
                                                        <span className="font-medium whitespace-nowrap">{s.word}</span>
                                                        {s.source === 'phrasal' && (
                                                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-900/50 text-blue-300 border border-blue-700/50 shrink-0">
                                                                句動詞
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-gray-500 truncate ml-3 max-w-[50%] text-right">{s.translation}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleSearch()}
                                    className="px-3 py-2 text-sm rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-amber-300 transition-all duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                            {searchResult && (
                                <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm space-y-2">
                                    {searchResult.translation ? (
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-amber-300">{searchResult.word}</span>
                                                {searchResult.level && (
                                                    <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-gray-700 text-gray-300">
                                                        {searchResult.level}
                                                    </span>
                                                )}
                                                {searchResult.source === 'phrasal' && (
                                                    <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
                                                        句動詞
                                                    </span>
                                                )}
                                                <span className="text-gray-400">{searchResult.translation}</span>
                                            </div>
                                            {searchResult.alternatives && searchResult.alternatives.length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-x-3">
                                                    {searchResult.alternatives.slice(0, 3).map((alt, i) => (
                                                        <span key={i} className="text-gray-500 text-xs">{alt}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : searchResult.decomposition ? (
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-semibold text-gray-300">{searchResult.word}</span>
                                                <span className="text-xs text-gray-500">辞書に未登録 — 形態素分解:</span>
                                            </div>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {searchResult.decomposition.morphemes.map((m, i) => (
                                                    <span key={i} className={`inline-flex flex-col items-center px-2 py-1 rounded text-xs ${
                                                        m.type === 'prefix' ? 'bg-purple-900/30 text-purple-300 border border-purple-700/30' :
                                                        m.type === 'suffix' ? 'bg-teal-900/30 text-teal-300 border border-teal-700/30' :
                                                        'bg-amber-900/30 text-amber-300 border border-amber-700/30'
                                                    }`}>
                                                        <span className="font-semibold">{m.text}</span>
                                                        <span className="text-[10px] opacity-75">{m.meaning}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">辞書に未登録</span>
                                    )}

                                    {/* Related phrasal verbs */}
                                    {searchResult.relatedPhrases && searchResult.relatedPhrases.length > 0 && (
                                        <div className="pt-2 border-t border-gray-800">
                                            <p className="text-xs text-gray-500 mb-1">関連する句動詞:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {searchResult.relatedPhrases.slice(0, 6).map((pv, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            setSearchInput(pv.phrase);
                                                            handleSearch(pv.phrase);
                                                        }}
                                                        className="px-2 py-0.5 text-xs rounded bg-blue-900/20 text-blue-300 border border-blue-800/30 hover:bg-blue-900/40 hover:border-blue-700/50 transition-all"
                                                    >
                                                        {pv.phrase}
                                                        <span className="ml-1 text-gray-500">{pv.translation.split('、')[0]}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

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
                                    skewAngle={skewAngle}
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
                                    handleSearchClear();
                                }}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all duration-200"
                            >
                                Upload New Image
                            </button>
                            <button
                                onClick={handleRotate}
                                disabled={isAnalyzing}
                                className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5"
                                title="Rotate 90° clockwise"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Rotate
                            </button>
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 ${
                                    words.length === 0
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                {words.length === 0 ? 'Analyze' : 'Re-Analyze'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Word list panel */}
                {words.length > 0 && <WordListPanel words={words} />}

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
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.25)', border: '1.5px dashed rgba(249, 115, 22, 0.5)' }} />
                            <span className="text-gray-400">Low OCR confidence</span>
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
                ocrEngine={ocrEngine}
                onOcrEngineChange={setOcrEngine}
            />
        </main>
    );
}
