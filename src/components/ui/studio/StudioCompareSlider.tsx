'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Sliders, Sparkles, Layers } from 'lucide-react';

export interface StudioCompareSliderProps {
  originalImageUrl: string;
  reconstructedImageUrl?: string;
  aspectRatio?: string;
  modelName?: string;
}

export function StudioCompareSlider({
  originalImageUrl,
  reconstructedImageUrl,
  aspectRatio = '1:1',
  modelName = 'Flux 1.1 Pro'
}: StudioCompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Fallback to original image if simulated reconstruction image is not provided
  const targetImage = reconstructedImageUrl || originalImageUrl;

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Visual Reconstruction Split Canvas
            </h3>
            <p className="text-[11px] text-zinc-400 font-medium">
              Drag slider to inspect source upload vs. AST model simulation side-by-side
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/50 text-[10px] font-extrabold uppercase">
            {modelName}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-bold">
            {aspectRatio}
          </span>
        </div>
      </div>

      {/* Split Comparison Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative w-full aspect-square rounded-2xl overflow-hidden select-none cursor-ew-resize bg-zinc-900 border border-zinc-800"
      >
        {/* Layer 1: Reconstructed / Target Image (Full Width) */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={targetImage}
            alt="Simulated Reconstruction"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized
            className="object-cover filter contrast-[1.03] brightness-[0.98]"
          />
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-purple-200 text-[10px] font-extrabold flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Target AI Reconstruction ({Math.round(100 - sliderPosition)}%)</span>
          </div>
        </div>

        {/* Layer 2: Original Uploaded Image (Clipped by Slider Position) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="relative w-full h-full aspect-square" style={{ width: containerWidth ? `${containerWidth}px` : '100%' }}>
            <Image
              src={originalImageUrl}
              alt="Source Upload"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized
              className="object-cover"
            />
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-700 text-zinc-200 text-[10px] font-extrabold flex items-center gap-1.5 shadow-lg">
              <Layers className="w-3 h-3 text-zinc-400" />
              <span>Original Source Upload ({Math.round(sliderPosition)}%)</span>
            </div>
          </div>
        </div>

        {/* Interactive Split Divider Handle */}
        <div
          className="absolute inset-y-0 w-0.5 bg-gradient-to-b from-purple-500 via-white to-blue-500 z-30 shadow-[0_0_12px_rgba(168,85,247,0.8)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-900 shadow-xl flex items-center justify-center border-2 border-purple-600 font-bold text-xs">
            ↔
          </div>
        </div>
      </div>
    </div>
  );
}
