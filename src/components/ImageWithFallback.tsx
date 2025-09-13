// src/components/ImageWithFallback.tsx
"use client";
import React, { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
}

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = "", 
  fallbackSrc = "/placeholder.png",
  width,
  height,
  priority = false,
  fill = false,
  sizes,
  style
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  // إذا تم استخدام fill، نحتاج إلى حاوية بموضع نسبي
  if (fill) {
    return (
      <div className={`relative ${className}`} style={style}>
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes={sizes || "100vw"}
          className="object-cover"
          onError={handleError}
          priority={priority}
        />
      </div>
    );
  }

  // للاستخدام مع أبعاد محددة
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 500}
      height={height || 300}
      className={className}
      onError={handleError}
      priority={priority}
      style={style}
      sizes={sizes}
    />
  );
}