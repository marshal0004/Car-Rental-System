'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Calendar,
  Car,
  ChevronRight,
  Shield,
  Star,
  Wrench,
  Zap,
  Award,
  Clock,
  Search,
} from 'lucide-react';
import type { CarSummary } from '@/lib/types';
import { fetchFeaturedCars } from '@/lib/api';
import CarCard from '@/components/CarCard';

const CATEGORIES = [
  {
    slug: 'hatchback',
    title: 'Hatchbacks',
    description: 'Compact & fuel-efficient city cars',
    Icon: Car,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    slug: 'sedan',
    title: 'Sedans',
    description: 'Comfort & style for every trip',
    Icon: Car,
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    slug: 'suv',
    title: 'SUVs',
    description: 'Spacious rides for the whole crew',
    Icon: Car,
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    slug: 'luxury',
    title: 'Luxury',
    description: 'Premium drives for special moments',
    Icon: Star,
    accent: 'bg-rose-50 text-rose-700',
  },
];

const HOW_IT_WORKS = [
  {
    Icon: Search,
    title: '1. Browse',
    description: 'Filter our fleet by category, fuel, price, or seating to find the perfect car.',
  },
  {
    Icon: Calendar,
    title: '2. Book',
    description: 'Pick your dates and fill a 60-second form. Get an instant booking reference.',
  },
  {
    Icon: Car,
    title: '3. Drive',
    description: 'Pick up your keys, hit the road, and return when your trip is done.',
  },
];

const STATS = [
  { value: '16+', label: 'Cars in fleet' },
  { value: '4', label: 'Categories' },
  { value: '24/7', label: 'Booking window' },
  { value: '0', label: 'Hidden charges' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<CarSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchFeaturedCars(6);
        if (active) setFeatured(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load featured cars.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 1200 800%27><rect fill=%27%230c4a6e%27 width=%271200%27 height=%27800%27/><g stroke=%27%23ffffff%27 stroke-opacity=%270.15%27 stroke-width=%271%27><path d=%27M0 600 Q300 400 600 500 T1200 400%27/><path d=%27M0 700 Q400 500 800 600 T1200 500%27/><path d=%27M0 800 Q500 600 1000 700 T1200 600%27/></g></svg>")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
        <div className="container relative py-20 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide ring-1 ring-white/20 backdrop-blur">
              <Zap className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              India&apos;s friendly neighbourhood car rental
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Drive Your Journey.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-brand-100 sm:text-xl">
              Browse our fleet of hatchbacks, sedans, SUVs and luxury cars.
              Transparent per-day pricing, easy online booking, zero hidden
              charges.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:bg-accent-dark"
              >
                Browse All Cars
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/cars?category=suv"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3 text-base font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Explore SUVs
              </Link>
            </div>
          </div>

          {/* Search widget (visual only for MVP — prefilled to /cars) */}
          <SearchWidget />

          {/* Stats strip */}
          <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-lg bg-white/5 p-4 text-center ring-1 ring-white/10 backdrop-blur"
              >
                <dt className="font-display text-3xl font-bold text-accent">
                  {s.value}
                </dt>
                <dd className="mt-1 text-xs uppercase tracking-wide text-brand-100">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Why ZoomWheels
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Built for travellers, by travellers.
            </h2>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              ZoomWheels started in 2019 when our founder, tired of opaque
              pricing and call-centre booking queues, decided that renting a car
              should be as simple as ordering food online. Today we serve
              thousands of happy customers every month across Bengaluru — every
              one of them paying exactly what they were quoted, every time.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Shield, title: 'Transparent Pricing', desc: 'What you see is what you pay. Taxes included, always.' },
              { Icon: Wrench, title: 'Well-Maintained Fleet', desc: 'Every car is serviced between rentals and sanitised.' },
              { Icon: Clock, title: '24/7 Booking', desc: 'Book any time, from anywhere — no call centres.' },
              { Icon: Award, title: 'Trusted by Thousands', desc: '4.8/5 average rating from 2,400+ verified trips.' },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-6 transition-shadow hover:shadow-md"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured cars */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Featured
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                Cars our customers love
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Hand-picked bestsellers across every category.
              </p>
            </div>
            <Link
              href="/cars"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              View all cars
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : error ? (
            <div className="mt-10 rounded-lg border border-danger/30 bg-danger/10 p-6 text-center text-sm text-danger">
              {error}
            </div>
          ) : featured.length === 0 ? (
            <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No featured cars available right now. Please check back soon.
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              By Category
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Find your perfect ride
            </h2>
            <p className="mt-2 text-base text-slate-600">
              From city hatchbacks to luxury sedans, we&apos;ve got every drive
              covered.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map(({ slug, title, description, Icon, accent }) => (
              <Link
                key={slug}
                href={`/cars?category=${slug}`}
                className="card-lift group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${accent}`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:text-brand-800">
                  Browse {title.toLowerCase()}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              How it works
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Book in 3 simple steps
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ Icon, title, description }, i) => (
              <div
                key={title}
                className="relative rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-md">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ChevronRight
                    className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-brand-300 sm:block"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-700 py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to hit the road?
          </h2>
          <p className="mt-3 text-base text-brand-100">
            Browse the fleet, pick your dates, and book your next adventure in
            under 2 minutes.
          </p>
          <Link
            href="/cars"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-accent-dark"
          >
            Browse Cars
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

function SearchWidget() {
  return (
    <form
      action="/cars"
      method="get"
      className="mt-10 max-w-3xl rounded-xl bg-white/95 p-3 shadow-xl backdrop-blur sm:p-4"
      aria-label="Quick search"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="pickup"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Pickup Date
          </label>
          <input
            id="pickup"
            name="pickup"
            type="date"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div>
          <label
            htmlFor="return"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Return Date
          </label>
          <input
            id="return"
            name="return"
            type="date"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Find Cars
      </button>
    </form>
  );
}
