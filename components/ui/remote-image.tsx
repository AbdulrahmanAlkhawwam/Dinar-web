'use client';

import { useState } from 'react';

interface RemoteImageProps {
  src: string | null | undefined;
  alt: string;
  /** Shown when there is no image or it fails to load. */
  fallback: string;
  className?: string;
}

/**
 * An image from a URL an admin typed in, so any host at all.
 *
 * Deliberately a plain <img>, not next/image: optimising arbitrary hosts
 * means `remotePatterns: [{ hostname: '**' }]`, which turns this server into
 * an open image proxy for anyone who can reach it.
 */
export function RemoteImage({ src, alt, fallback, className = '' }: RemoteImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden={alt === '' || undefined}
        className={`grid place-items-center bg-surface-container-high font-bold text-on-surface-variant ${className}`}
      >
        {fallback.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- see comment above
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
