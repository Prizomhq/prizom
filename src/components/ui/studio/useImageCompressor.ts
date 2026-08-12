import { useState } from 'react';

export interface CompressedImageResult {
  blob: Blob;
  width: number;
  height: number;
  aspectRatio: string;
}

export function calculateAspectRatio(w: number, h: number): string {
  if (!w || !h) return '1:1';
  const ratio = w / h;
  
  const standardRatios = [
    { label: '1:1', value: 1.0 },
    { label: '4:5', value: 0.8 },
    { label: '5:4', value: 1.25 },
    { label: '3:4', value: 0.75 },
    { label: '4:3', value: 1.333 },
    { label: '2:3', value: 0.667 },
    { label: '3:2', value: 1.5 },
    { label: '9:16', value: 0.5625 },
    { label: '16:9', value: 1.7778 },
    { label: '21:9', value: 2.333 }
  ];

  let closest = standardRatios[0];
  let minDiff = Math.abs(ratio - closest.value);

  for (let i = 1; i < standardRatios.length; i++) {
    const diff = Math.abs(ratio - standardRatios[i].value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = standardRatios[i];
    }
  }

  // If closest standard ratio difference is within threshold 0.12, use standard ratio label
  if (minDiff <= 0.12) {
    return closest.label;
  }

  // Fallback to custom ratio format or orientation default
  return w > h ? `${Math.round((w / h) * 10) / 10}:1` : `1:${Math.round((h / w) * 10) / 10}`;
}

/**
 * Custom React hook bound to browser canvas API for downscaling 
 * and compressing user files prior to upload.
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
        const aspectRatio = calculateAspectRatio(originalWidth, originalHeight);

        let width = originalWidth;
        let height = originalHeight;

        // Preserve aspect ratio and clamp to maxDimension boundary
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
                aspectRatio
              });
            } else {
              reject(new Error('Canvas encoding process failed to generate blob.'));
            }
          },
          'image/webp',
          0.82
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(img.src);
        setIsCompressing(false);
        reject(err);
      };
    });
  };

  return { compressImage, isCompressing };
}

