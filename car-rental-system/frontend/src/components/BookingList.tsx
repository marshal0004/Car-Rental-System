'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Car, Loader2, Trash2, AlertCircle } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { ApiError, cancelBooking } from '@/lib/api';
import { formatINR } from '@/lib/pricing';

interface BookingListProps {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const STATUS_STYLES: Record<Booking['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-success/15 text-success',
  cancelled: 'bg-danger/10 text-danger line-through',
};

export default function BookingList({
  bookings,
  loading,
  error,
  onRefresh,
}: BookingListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    setCancellingId(id);
    setLocalError(null);
    try {
      await cancelBooking(id);
      // Optimistic update — refetch list immediately.
      onRefresh();
    } catch (err) {
      setLocalError(
        err instanceof ApiError
          ? err.message
          : 'Could not cancel booking. Please try again.',
      );
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Loading your bookings…
      </div>
    );
  }

  if (error || localError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <div>
            <p>{error || localError}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="mt-2 rounded-md border border-danger/40 px-3 py-1 text-xs font-medium hover:bg-danger/10"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <Car className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-semibold text-slate-900">
          You have no bookings yet
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Browse our fleet and book your first ride in under 2 minutes.
        </p>
        <Link
          href="/cars"
          className="mt-5 inline-flex items-center justify-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Browse Cars
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4" aria-label="Your bookings">
      {bookings.map((b) => {
        const isCancelled = b.status === 'cancelled';
        return (
          <li
            key={b.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-slate-900">
                    {b.car_name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[b.status]}`}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Ref: <span className="font-mono font-medium text-slate-700">{b.id}</span>
                </p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 sm:grid-cols-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span>{b.pickup_date} → {b.return_date}</span>
                  </div>
                  <div>{b.total_days} day{b.total_days === 1 ? '' : 's'}</div>
                  <div className="font-semibold text-slate-900">
                    {formatINR(b.total_cost)}
                  </div>
                </div>
                {b.special_requests && (
                  <p className="mt-2 text-xs italic text-slate-500">
                    &ldquo;{b.special_requests}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {!isCancelled && (
                  <button
                    type="button"
                    disabled={cancellingId === b.id}
                    onClick={() => handleCancel(b.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancellingId === b.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Cancelling…
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Cancel Booking
                      </>
                    )}
                  </button>
                )}
                <Link
                  href={`/cars/${b.car_id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Car className="h-4 w-4" aria-hidden="true" />
                  View Car
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
