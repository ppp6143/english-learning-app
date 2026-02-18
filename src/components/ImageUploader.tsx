'use client';

import React, { useCallback, useRef, useState } from 'react';

interface ImageUploaderProps {
    onImageSelected: (file: File, dataUrl: string) => void;
    isDisabled?: boolean;
}

export default function ImageUploader({ onImageSelected, isDisabled }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (file: File) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                onImageSelected(file, dataUrl);
            };
            reader.readAsDataURL(file);
        },
        [onImageSelected]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div
            onDrop={isDisabled ? undefined : handleDrop}
            onDragOver={isDisabled ? undefined : handleDragOver}
            onDragLeave={isDisabled ? undefined : handleDragLeave}
            className={`
        relative flex flex-col items-center justify-center gap-5 p-10
        border-2 border-dashed rounded-2xl
        transition-all duration-300 ease-out
        ${isDisabled
                    ? 'border-gray-600 bg-gray-800/30 cursor-not-allowed opacity-60'
                    : isDragging
                        ? 'border-amber-400 bg-amber-400/10 scale-[1.02] shadow-lg shadow-amber-400/20'
                        : 'border-gray-600 bg-gray-800/40'
                }
      `}
        >
            {/* Upload icon */}
            <div className={`
        w-16 h-16 rounded-full flex items-center justify-center
        transition-all duration-300
        ${isDragging
                    ? 'bg-amber-400/20 text-amber-400 scale-110'
                    : 'bg-gray-700/60 text-gray-400'
                }
      `}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>

            <div className="text-center">
                <p className="text-lg font-medium text-gray-200">
                    {isDragging ? 'Drop your image here' : 'Capture or select an image'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    Take a photo of English text or choose from your gallery
                </p>
            </div>

            {/* Two-button layout */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
                {/* Take Photo button */}
                <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                        bg-gradient-to-b from-amber-400 to-orange-500 text-gray-900 font-semibold text-sm
                        shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30
                        transition-all duration-200 active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {/* Camera icon */}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    Take Photo
                </button>

                {/* Choose Image button */}
                <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => inputRef.current?.click()}
                    className="flex-1 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                        border border-gray-600 text-gray-300 font-medium text-sm
                        hover:border-gray-400 hover:text-gray-100 hover:bg-gray-800/60
                        transition-all duration-200 active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {/* Gallery icon */}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    Choose Image
                </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="px-2 py-1 bg-gray-800 rounded">PNG</span>
                <span className="px-2 py-1 bg-gray-800 rounded">JPG</span>
                <span className="px-2 py-1 bg-gray-800 rounded">WEBP</span>
            </div>

            {/* Hidden file inputs */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleChange}
                className="hidden"
            />
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
            />
        </div>
    );
}
