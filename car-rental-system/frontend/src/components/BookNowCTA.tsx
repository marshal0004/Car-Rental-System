'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BookNowCTAProps {
  carId: string;
  isAvailable: boolean;
  /** Optional label override (default: "Book Now"). */
  label?: string;
}

/**
 * Client component for the "Book Now" call-to-action.
 *
 * The car detail page is a Server Component, so it can't attach `onClick`
 * handlers directly. When a car is unavailable we want to render a button
 * that looks disabled and doesn't navigate — that requires a client-side
 * click handler, hence this little wrapper.
 */
export default function BookNowCTA({
  carId,
  isAvailable,
  label = 'Book Now',
}: BookNowCTAProps) {
  const href = isAvailable ? `/book?carId=${encodeURIComponent(carId)}` : '#';

  if (!isAvailable) {
    // Render a non-interactive disabled button — no <Link>, so no navigation.
    return (
      <span
        aria-disabled="true"
        className="flex-1 inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-200 px-6 py-3 text-base font-semibold text-slate-400"
      >
        {label}
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
    >
      {label}
      <ChevronRight className="h-5 w-5" aria-hidden="true" />
    </Link>
  );
}
