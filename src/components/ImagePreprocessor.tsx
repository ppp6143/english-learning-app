'use client';

import React, { useState } from 'react';

interface ImagePreprocessorProps {
    originalUrl: string;
    scannedUrl: string | null;
    documentDetected: boolean;
    isScanning: boolean;
}

export default function ImagePreprocessor({
    originalUrl,
    scannedUrl,
    documentDetected,
    isScanning,
}: ImagePreprocessorProps) {
    const [showScanned, setShowScanned] = useState(true);
    const displayUrl = showScanned && scannedUrl ? scannedUrl : originalUrl;
    const hasScanned = !!scannedUrl;

    return (
        <div className="relative">
            {/* Toggle buttons */}
            {hasScanned && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                    <div className="flex bg-gray-900/80 backdrop-blur rounded-lg border border-gray-700/50 p-0.5">
                        <button
                            onClick={() => setShowScanned(false)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                !showScanned
                                    ? 'bg-gray-700 text-gray-100'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Original
                        </button>
                        <button
                            onClick={() => setShowScanned(true)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                showScanned
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Scanned
                        </button>
                    </div>

                    {/* Detection badge */}
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-md backdrop-blur ${
                        documentDetected
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40'
                            : 'bg-gray-900/60 text-gray-400 border border-gray-700/40'
                    }`}>
                        {documentDetected ? 'Page Detected' : 'No Page Detected'}
                    </span>
                </div>
            )}

            {/* Scanning spinner overlay */}
            {isScanning && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/90 rounded-lg border border-gray-700/50">
                        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-300">Scanning document...</span>
                    </div>
                </div>
            )}

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={displayUrl}
                alt={showScanned && scannedUrl ? 'Scanned document' : 'Original image'}
                className="block max-w-full h-auto"
                style={{ maxHeight: '70vh' }}
            />
        </div>
    );
}
