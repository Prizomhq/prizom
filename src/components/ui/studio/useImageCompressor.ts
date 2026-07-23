import { useState } from 'react';

/**
 * Custom React hook bound to browser canvas API for downscaling 
 * and compressing user files prior to upload.
 */
export function useImageCompressor() {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = (file: File, maxDimension: number = 1024): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      setIsCompressing(true);
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(img.src);
        let width = img.width;
        let height = img.height;

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
              // Create dynamic file attachment with original filename mapping WebP extension
              resolve(blob);
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
