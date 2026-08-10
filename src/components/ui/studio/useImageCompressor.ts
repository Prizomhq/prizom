import { useState } from 'react';

export interface CompressedImageResult {
  blob: Blob;
  width: number;
  height: number;
  aspectRatio: string;
}

export function calculateAspectRatio(w: number, h: number): string {
  const ratio = w / h;
  if (Math.abs(ratio - 1.0) < 0.08) return '1:1';
  if (Math.abs(ratio - (16 / 9)) < 0.1) return '16:9';
  if (Math.abs(ratio - (9 / 16)) < 0.1) return '9:16';
  if (Math.abs(ratio - (4 / 5)) < 0.08) return '4:5';
  if (Math.abs(ratio - (3 / 4)) < 0.08) return '3:4';
  if (Math.abs(ratio - (3 / 2)) < 0.1) return '3:2';
  if (Math.abs(ratio - (2 / 3)) < 0.1) return '2:3';
  return w > h ? '16:9' : '9:16';
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

