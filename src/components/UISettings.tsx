'use client';

import React, { useState } from 'react';
import { OcrEngine, ScanMode } from '@/src/lib/types';

export type PopupScaleMode = 'dynamic' | 'fixed';
export type PopupPositionMode = 'near' | 'bottom';

interface UISettingsProps {
    scaleMode: PopupScaleMode;
    onScaleChange: (mode: PopupScaleMode) => void;
    positionMode: PopupPositionMode;
    onPositionChange: (mode: PopupPositionMode) => void;
    ocrEngine: OcrEngine;
    onOcrEngineChange: (engine: OcrEngine) => void;
    scanMode: ScanMode;
    onScanModeChange: (mode: ScanMode) => void;
}

export default function UISettings({
    scaleMode,
    onScaleChange,
    positionMode,
    onPositionChange,
    ocrEngine,
    onOcrEngineChange,
    scanMode,
    onScanModeChange,
}: UISettingsProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-full shadow-lg flex items-center justify-center text-gray-200 hover:bg-gray-700 hover:text-white transition-all"
                title="UI Settings"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                )}
            </button>

            {/* Menu */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-3 bg-gray-800/50 border-b border-gray-700">
                        <h3 className="text-sm font-bold text-gray-200">UI Settings</h3>
                        <p className="text-xs text-gray-500">Customize your viewing experience</p>
                    </div>

                    <div className="p-4 space-y-5">
                        {/* Scale Mode */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Popup Size</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => onScaleChange('dynamic')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${scaleMode === 'dynamic'
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Dynamic
                                </button>
                                <button
                                    onClick={() => onScaleChange('fixed')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${scaleMode === 'fixed'
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Fixed
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5">
                                {scaleMode === 'dynamic'
                                    ? "Matches highlighted text size"
                                    : "Consistent reliable size"}
                            </p>
                        </div>

                        {/* Position Mode */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Popup Position</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => onPositionChange('near')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${positionMode === 'near'
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Floating
                                </button>
                                <button
                                    onClick={() => onPositionChange('bottom')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${positionMode === 'bottom'
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Fixed Bottom
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5">
                                {positionMode === 'near'
                                    ? "Appears next to the word"
                                    : "Docked at bottom of screen"}
                            </p>
                        </div>

                        {/* OCR Engine */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">OCR Engine</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => onOcrEngineChange('tesseract')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${ocrEngine === 'tesseract'
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Tesseract
                                </button>
                                <button
                                    onClick={() => onOcrEngineChange('paddleocr')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${ocrEngine === 'paddleocr'
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    PaddleOCR
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5">
                                {ocrEngine === 'tesseract'
                                    ? "Standard engine, good for clean text"
                                    : "Alternative engine, better for complex layouts"}
                            </p>
                        </div>

                        {/* Document Scanner */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Document Scanner</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => onScanModeChange('enhanced')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${scanMode === 'enhanced'
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Enhanced
                                </button>
                                <button
                                    onClick={() => onScanModeChange('bw')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${scanMode === 'bw'
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    B&W
                                </button>
                                <button
                                    onClick={() => onScanModeChange('off')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${scanMode === 'off'
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Off
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5">
                                {scanMode === 'enhanced'
                                    ? "Shadow removal + contrast boost, crop & straighten"
                                    : scanMode === 'bw'
                                    ? "B&W threshold, best for printed text"
                                    : "No scanner, analyze original image directly"}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
