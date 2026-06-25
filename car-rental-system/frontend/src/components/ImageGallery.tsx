'use client';

import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

const PLACEHOLDER = '/images/cars/placeholder.svg';

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const safeImages = images.length > 0 ? images : [PLACEHOLDER];
  const [active, setActive] = useState(0);
  const [mainError, setMainError] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <img
          src={mainError ? PLACEHOLDER : safeImages[active] ?? PLACEHOLDER}
          alt={`${alt} — view ${active + 1}`}
          className="h-full w-full object-cover"
          onError={() => setMainError(true)}
        />
      </div>

      {safeImages.length > 1 && (
        <div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3"
          role="tablist"
          aria-label={`${alt} image gallery`}
        >
          {safeImages.map((img, idx) => (
            <ThumbnailButton
              key={`${img}-${idx}`}
              src={img}
              alt={`${alt} — thumbnail ${idx + 1}`}
              isActive={idx === active}
              onClick={() => {
                setActive(idx);
                setMainError(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThumbnailButton({
  src,
  alt,
  isActive,
  onClick,
}: {
  src: string;
  alt: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [errored, setErrored] = useState(false);
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={alt}
      onClick={onClick}
      className={`relative aspect-[4/3] overflow-hidden rounded-md border-2 transition-colors ${
        isActive
          ? 'border-brand-500 ring-2 ring-brand-200'
          : 'border-slate-200 hover:border-brand-300'
      }`}
    >
      <img
        src={errored ? PLACEHOLDER : src}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setErrored(true)}
      />
    </button>
  );
}
