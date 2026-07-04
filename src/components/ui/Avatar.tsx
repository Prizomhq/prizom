'use client';

import { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '@/lib/cloudinary-client';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
}

export default function Avatar({ src, username, size = 'md', className = '' }: AvatarProps) {
  const [error, setError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(false);
  }, [src]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-32 h-32 md:w-40 md:h-40 text-4xl',
    custom: '',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;
  const initial = username ? username.charAt(0).toUpperCase() : '?';
  const optType = (size === 'xl' || size === 'lg') ? 'avatar-large' : 'avatar';

  return (
    <div 
      className={`relative rounded-full bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] flex items-center justify-center font-bold text-white shadow-sm overflow-hidden shrink-0 transition-all select-none ${selectedSizeClass} ${className}`}
    >
      {src && !error ? (
        <Image 
          src={getOptimizedImageUrl(src, optType)} 
          alt={username} 
          fill
          className="object-cover" 
          onError={() => setError(true)}
          unoptimized
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
