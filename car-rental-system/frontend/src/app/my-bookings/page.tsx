'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { ApiError, fetchBookings } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import BookingList from '@/components/BookingList';

export default function MyBookingsPage() {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth gate — redirect to /login?redirect=/my-bookings.
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=%2Fmy-bookings');
    }
  }, [isReady, isAuthenticated, router]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBookings();
      // Already sorted DESC by created_at on the server, but we double-check.
      setBookings(
        [...data].sort((a, b) =>
          b.created_at.localeCompare(a.created_at),
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not load your bookings. Please try again.',
      );
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadBookings();
  }, [isAuthenticated, loadBookings]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <p className="text-sm text-slate-600">
          Redirecting you to login…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container py-6">
          <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            View and manage your past and upcoming car rental bookings.
          </p>
        </div>
      </section>

      <div className="container py-8">
        <BookingList
          bookings={bookings}
          loading={loading}
          error={error}
          onRefresh={loadBookings}
        />
      </div>
    </div>
  );
}
