'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { useStudioState, useStudioDispatch } from './context';
import { useImageCompressor } from './useImageCompressor';
import { createStudioSessionAction } from '@/app/actions/studio';
import PrizomLogo from '@/components/ui/PrizomLogo';

export function StudioUploader() {
  const state = useStudioState();
  const dispatch = useStudioDispatch();
  const { compressImage, isCompressing } = useImageCompressor();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Check overdraft balance
    if (state.credits <= 0) {
      setUploadError('You have run out of AI Studio credits. Please wait for your monthly allocation or upgrade to Pro.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid image format. Only JPG, PNG, and WebP are allowed.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be under 5MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // 1. Compress image client-side via canvas
      const compressedBlob = await compressImage(file, 1024);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
        type: 'image/webp'
      });

      // 2. Upload to Cloudinary via /api/upload
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('folder', 'studio-drafts');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadResult.error || 'Failed to upload draft image.');
      }

      // 3. Create Studio Session record in database
      const requestId = crypto.randomUUID();
      const sessionRes = await createStudioSessionAction(
        uploadResult.url,
        uploadResult.publicId,
        requestId
      );

      if (!sessionRes.success || !sessionRes.session) {
        throw new Error(sessionRes.error || 'Failed to create AI Studio session.');
      }

      // 4. Update Reducer State
      dispatch({
        type: 'SET_IMAGE',
        url: uploadResult.url,
        sessionId: sessionRes.session.id,
        credits: state.credits - 1
      });

    } catch (err: any) {
      console.error('[STUDIO UPLOADER ERROR]', err);
      setUploadError(err.message || 'An unexpected error occurred during upload.');
      dispatch({ type: 'SET_ERROR', message: err.message || 'Upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
          <PrizomLogo size={16} /> Prizom Studio Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
          Transform Image into AI Prompt
        </h1>
        <p className="text-zinc-500 font-medium text-sm sm:text-base max-w-lg mx-auto">
          Upload any artwork or photo. AG Router will analyze visual composition, lighting, camera angles, and style to generate optimized prompt templates.
        </p>
      </div>

      {uploadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 bg-white/80 backdrop-blur-sm ${
          isDragging
            ? 'border-[var(--color-neon-purple)] bg-purple-50/50 shadow-xl scale-[1.01]'
            : 'border-zinc-200 hover:border-purple-300 hover:shadow-md'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        {isCompressing || isUploading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-12 h-12 text-[var(--color-neon-purple)] animate-spin mb-4" />
            <p className="text-zinc-900 font-bold text-lg mb-1">
              {isCompressing ? 'Optimizing Image Canvas...' : 'Uploading Draft Image...'}
            </p>
            <p className="text-zinc-400 text-xs font-medium">Preparing image for AG Router analysis</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-10 h-10 text-[var(--color-neon-purple)]" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1">
              Drop your image here, or <span className="text-[var(--color-neon-purple)]">browse</span>
            </h3>
            <p className="text-zinc-400 text-xs font-medium mb-4">
              Supports JPG, PNG, and WebP up to 5MB
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 bg-zinc-100 px-4 py-2 rounded-full">
              <ImageIcon className="w-4 h-4 text-zinc-400" />
              Canvas compressed to max 1024px WebP automatically
            </div>
          </div>
        )}
      </div>

      {/* Credit Status Indicator */}
      <div className="mt-6 flex items-center justify-between text-xs font-medium text-zinc-400 px-2">
        <span>1 Credit per AI Studio analysis</span>
        <span className="font-bold text-purple-600">Available Credits: {state.credits}</span>
      </div>
    </div>
  );
}
