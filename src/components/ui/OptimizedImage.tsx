'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: '3/4' | '4/3' | '1/1' | '16/9' | 'auto';
  priority?: boolean;
  objectFit?: 'cover' | 'contain';
  fallbackText?: string;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio = 'auto',
  priority = false,
  objectFit = 'cover',
  fallbackText,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Redefine o estado de carregamento quando a URL da imagem mudar
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const aspectClass = {
    '3/4': 'aspect-[3/4]',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '16/9': 'aspect-video',
    'auto': '',
  }[aspectRatio];

  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full ${aspectClass} rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-slate-500 select-none ${containerClassName}`}
      >
        <Sparkles className="w-8 h-8 mb-1.5 stroke-1 text-slate-300 dark:text-slate-600" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {fallbackText || alt || 'Magia Festeira'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800/80 ${aspectClass} ${containerClassName}`}
    >
      {/* Skeleton / Shimmer placeholder enquanto a imagem carrega */}
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
        >
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-slate-300/60 dark:text-slate-600/60" />
          </div>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsLoaded(true);
          setHasError(true);
        }}
        className={`w-full h-full ${fitClass} transition-opacity duration-300 relative z-10 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
