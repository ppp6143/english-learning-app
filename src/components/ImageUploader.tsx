'use client';

import React, { useCallback, useRef, useState } from 'react';

interface ImageUploaderProps {
    onImageSelected: (file: File, dataUrl: string) => void;
    isDisabled?: boolean;
}

/** Rotate an image 90° clockwise using Canvas API, returns Base64 dataUrl */
function rotateImage90CW(src: string): Promise<string> {
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
            resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = reject;
        img.src = src;
    });
}

export default function ImageUploader({ onImageSelected, isDisabled }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    // Camera preview state — only set after camera capture, null otherwise
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Gallery / drag-and-drop: no preview, go straight to onImageSelected
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

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    // Camera: show preview screen instead of passing through immediately
    const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPreviewDataUrl(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        // Reset so the same photo can be retaken
        e.target.value = '';
    };

    // Rotate the preview image 90° CW using Canvas API
    const handleRotate = useCallback(async () => {
        if (!previewDataUrl) return;
        try {
            const rotated = await rotateImage90CW(previewDataUrl);
            setPreviewDataUrl(rotated);
        } catch {
            // Rotation failed silently
        }
    }, [previewDataUrl]);

    // ✕ Cancel — discard photo, go back to uploader
    const handleCancel = useCallback(() => {
        setPreviewDataUrl(null);
    }, []);

    // ✓ Confirm — pass the (possibly rotated) image to the parent
    const handleConfirm = useCallback(async () => {
        if (!previewDataUrl) return;
        // Convert Base64 → Blob → File so the callback signature is satisfied
        const res = await fetch(previewDataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' });
        onImageSelected(file, previewDataUrl);
        setPreviewDataUrl(null);
    }, [previewDataUrl, onImageSelected]);

    // ── Preview screen (camera only) ──────────────────────────────────────
    if (previewDataUrl) {
        return (
            <div className="flex flex-col items-center gap-6">
                {/* Preview image */}
                <div className="rounded-xl overflow-hidden border border-gray-800 shadow-2xl shadow-black/40 bg-gray-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewDataUrl}
                        alt="Camera preview"
                        className="block max-w-full h-auto"
                        style={{ maxHeight: '65vh' }}
                    />
                </div>

                {/* ✕ / 🔄 / ✓ buttons */}
                <div className="flex items-center gap-6">
                    {/* ✕ Cancel */}
                    <button
                        onClick={handleCancel}
                        className="w-14 h-14 rounded-full bg-gray-800 text-gray-400
                            hover:bg-red-900/60 hover:text-red-300
                            flex items-center justify-center
                            transition-all duration-200 shadow-md"
                        title="Retake"
                    >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    {/* 🔄 Rotate 90° */}
                    <button
                        onClick={handleRotate}
                        className="w-14 h-14 rounded-full bg-gray-700 text-gray-300
                            hover:bg-gray-600
                            flex items-center justify-center
                            transition-all duration-200 shadow-md"
                        title="Rotate 90°"
                    >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>

                    {/* ✓ Confirm */}
                    <button
                        onClick={handleConfirm}
                        className="w-14 h-14 rounded-full
                            bg-gradient-to-b from-amber-400 to-orange-500 text-gray-900
                            flex items-center justify-center
                            shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50
                            transition-all duration-200"
                        title="Use this photo"
                    >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    // ── Normal uploader UI ────────────────────────────────────────────────
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
                onChange={handleCameraChange}
                className="hidden"
            />
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleGalleryChange}
                className="hidden"
            />
        </div>
    );
}
