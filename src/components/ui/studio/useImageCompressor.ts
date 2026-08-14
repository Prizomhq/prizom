import { useState } from 'react';
import { analyzeImageAspectRatio, AspectRatioAnalysisResult } from '@/lib/ai-studio/aspect-ratio';

export interface CompressedImageResult {
  blob: Blob;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioDetails: AspectRatioAnalysisResult;
  mimeType: string;
  fileSize: number;
}

/**
 * Custom React hook for client-side image inspection, aspect ratio extraction,
 * and downscaling canvas compression prior to upload.
 */
export function useImageCompressor() {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = (file: File, maxDimension: number = 1024): Promise<CompressedImageResult> => {
    return new Promise((resolve, reject) => {
      setIsCompressing(true);
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const originalWidth = img.width;
        const originalHeight = img.height;

        // Perform 4-Layer Aspect Ratio Analysis
        const aspectRatioDetails = analyzeImageAspectRatio(originalWidth, originalHeight);

        let width = originalWidth;
        let height = originalHeight;

        // Preserve native aspect ratio while clamping max dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setIsCompressing(false);
          reject(new Error('Failed to obtain 2D rendering canvas context.'));
          return;
        }

        // Draw compressed frame
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP format with quality compression
        canvas.toBlob(
          (blob) => {
            setIsCompressing(false);
            if (blob) {
              resolve({
                blob,
                width: originalWidth,
                height: originalHeight,
                aspectRatio: aspectRatioDetails.normalized_aspect_ratio,
                aspectRatioDetails,
                mimeType: file.type || 'image/jpeg',
                fileSize: file.size
              });
            } else {
              reject(new Error('Canvas encoding process failed to generate blob.'));
            }
          },
          'image/webp',
          0.85
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(img.src);
        setIsCompressing(false);
        reject(new Error('Failed to load image for visual inspection.'));
      };
    });
  };

  return { compressImage, isCompressing };
}
