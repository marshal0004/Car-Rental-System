'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type { CarSummary } from '@/lib/types';
import { ApiError, fetchCarById } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import BookingForm from '@/components/BookingForm';

export default function BookPage() {
  return (
    <Suspense fallback={<BookPageFallback />}>
      <BookPageContent />
    </Suspense>
  );
}

function BookPageFallback() {
  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container py-6">
          <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Book a Car
          </h1>
        </div>
      </section>
      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        </div>
      </div>
    </div>
  );
}

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carId = searchParams?.get('carId') ?? '';
  const { user, isReady, isAuthenticated } = useAuth();

  const [preselectedCar, setPreselectedCar] = useState<CarSummary | null>(null);
  const [loadingCar, setLoadingCar] = useState(Boolean(carId));
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch the preselected car (if any) for the top-of-form display.
  useEffect(() => {
    if (!carId) {
      setLoadingCar(false);
      return;
    }
    let active = true;
    setLoadingCar(true);
    setLoadError(null);
    // fetchCarById returns full Car — compatible with CarSummary shape.
    fetchCarById(carId)
      .then((c) => {
        if (!active) return;
        setPreselectedCar(c);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(
          err instanceof ApiError && err.status === 404
            ? 'The selected car could not be found.'
            : err instanceof Error
              ? err.message
              : 'Could not load the selected car.',
        );
      })
      .finally(() => {
        if (active) setLoadingCar(false);
      });
    return () => {
      active = false;
    };
  }, [carId]);

  // Auth gate — redirect to /login?redirect=... if not authenticated.
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      const target = `/book${carId ? `?carId=${carId}` : ''}`;
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [isReady, isAuthenticated, router, carId]);

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
          <Link
            href="/cars"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to cars
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Book a Car
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Fill in your details and dates below. We&apos;ll confirm availability
            within 2 hours.
          </p>
        </div>
      </section>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          {loadingCar ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Loading car details…
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-6 text-sm text-danger">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p>{loadError}</p>
                  <Link
                    href="/cars"
                    className="mt-2 inline-block text-xs font-medium underline"
                  >
                    Pick a different car
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Authenticated user banner */}
              {user && (
                <div className="mb-4 rounded-md bg-brand-50 px-4 py-3 text-sm text-brand-800">
                  Booking as <span className="font-semibold">{user.name}</span>{' '}
                  ({user.email}). You can edit the contact fields below if needed.
                </div>
              )}
              <BookingForm
                preselectedCar={preselectedCar}
                defaultCustomerName={user?.name ?? ''}
                defaultEmail={user?.email ?? ''}
                defaultPhone={user?.phone ?? ''}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
