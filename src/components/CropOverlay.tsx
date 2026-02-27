'use client';

import React, { useCallback, useRef } from 'react';
import { Corner } from '@/src/lib/types';

interface CropOverlayProps {
    corners: Corner[];
    onChange: (corners: Corner[]) => void;
    imageWidth: number;
    imageHeight: number;
    disabled?: boolean;
}

/**
 * SVG-based four-corner drag overlay for document crop selection.
 * Corners are in 0-1 normalized coordinates.
 */
export default function CropOverlay({
    corners,
    onChange,
    imageWidth,
    imageHeight,
    disabled,
}: CropOverlayProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const draggingIndex = useRef<number | null>(null);

    // Convert normalized corner to SVG pixel coords
    const toPixel = (c: Corner) => ({ x: c.x * imageWidth, y: c.y * imageHeight });
    const pixelCorners = corners.map(toPixel);

    const getPointerPos = useCallback(
        (e: React.PointerEvent): { x: number; y: number } | null => {
            const svg = svgRef.current;
            if (!svg) return null;
            const rect = svg.getBoundingClientRect();
            // Scale pointer position to SVG viewBox coordinates
            const scaleX = imageWidth / rect.width;
            const scaleY = imageHeight / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        },
        [imageWidth, imageHeight],
    );

    const handlePointerDown = useCallback(
        (e: React.PointerEvent, index: number) => {
            if (disabled) return;
            e.preventDefault();
            e.stopPropagation();
            draggingIndex.current = index;
            (e.target as Element).setPointerCapture(e.pointerId);
        },
        [disabled],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (draggingIndex.current === null) return;
            const pos = getPointerPos(e);
            if (!pos) return;

            // Clamp to image bounds (in normalized coords)
            const nx = Math.max(0, Math.min(1, pos.x / imageWidth));
            const ny = Math.max(0, Math.min(1, pos.y / imageHeight));

            const newCorners = [...corners];
            newCorners[draggingIndex.current] = { x: nx, y: ny };
            onChange(newCorners);
        },
        [corners, onChange, getPointerPos, imageWidth, imageHeight],
    );

    const handlePointerUp = useCallback(() => {
        draggingIndex.current = null;
    }, []);

    // Polygon points string for SVG
    const polyPoints = pixelCorners.map(p => `${p.x},${p.y}`).join(' ');

    // Unique ID for the mask
    const maskId = 'crop-mask';

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${imageWidth} ${imageHeight}`}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: 'none' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Mask: darken area outside the crop quadrilateral */}
            <defs>
                <mask id={maskId}>
                    <rect width={imageWidth} height={imageHeight} fill="white" />
                    <polygon points={polyPoints} fill="black" />
                </mask>
            </defs>
            <rect
                width={imageWidth}
                height={imageHeight}
                fill="rgba(0,0,0,0.5)"
                mask={`url(#${maskId})`}
            />

            {/* Crop quadrilateral border */}
            <polygon
                points={polyPoints}
                fill="none"
                stroke="rgba(251,191,36,0.8)"
                strokeWidth={Math.max(2, imageWidth * 0.003)}
            />

            {/* Edge midpoint lines for visual guidance */}
            {pixelCorners.map((p, i) => {
                const next = pixelCorners[(i + 1) % 4];
                return (
                    <line
                        key={`edge-${i}`}
                        x1={p.x}
                        y1={p.y}
                        x2={next.x}
                        y2={next.y}
                        stroke="rgba(251,191,36,0.4)"
                        strokeWidth={Math.max(1, imageWidth * 0.001)}
                        strokeDasharray={`${imageWidth * 0.01} ${imageWidth * 0.005}`}
                    />
                );
            })}

            {/* Draggable corner handles */}
            {pixelCorners.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={Math.max(14, imageWidth * 0.02)}
                    fill="rgba(251,191,36,0.3)"
                    stroke="rgba(251,191,36,0.9)"
                    strokeWidth={Math.max(2, imageWidth * 0.003)}
                    style={{ cursor: disabled ? 'default' : 'grab', touchAction: 'none' }}
                    onPointerDown={(e) => handlePointerDown(e, i)}
                />
            ))}
        </svg>
    );
}
