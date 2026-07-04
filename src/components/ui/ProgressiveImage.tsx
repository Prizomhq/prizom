'use client';

import { useState } from 'react';
import { getOptimizedImageUrl } from '@/lib/cloudinary-client';
import Image from 'next/image';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  type?: 'card' | 'detail';
}

export default function ProgressiveImage({ src, alt, className = '', type = 'card' }: ProgressiveImageProps) {
  const [highResLoaded, setHighResLoaded] = useState(false);
  
  const placeholderUrl = getOptimizedImageUrl(src, 'placeholder');
  const highResUrl = getOptimizedImageUrl(src, type);

  // If URL is not on Cloudinary (e.g. Unsplash placeholders or external developer testing URLs)
  const isCloudinary = src && src.includes('cloudinary.com');

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-100">
      {isCloudinary && (
        <Image
          src={placeholderUrl}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-500 absolute inset-0 z-10 ${
            highResLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ filter: 'blur(8px)', transform: 'scale(1.05)' }}
          unoptimized
        />
      )}
      <Image
        src={highResUrl}
        alt={alt}
        fill
        className={`object-cover transition-all duration-700 ${className} ${
          highResLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-102'
        }`}
        onLoad={() => setHighResLoaded(true)}
        sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        style={{
          backgroundImage: highResLoaded
            ? undefined
            : 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjRmNGY1Ii8+PC9zdmc+")',
          backgroundSize: 'cover',
        }}
        unoptimized
      />
    </div>
  );
}
