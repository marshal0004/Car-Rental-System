import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Car as CarIcon,
  Fuel,
  MapPin,
  Settings,
  Users,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Car, CarSummary } from '@/lib/types';
import { ApiError, fetchCarById, fetchCars } from '@/lib/api';
import { formatINR } from '@/lib/pricing';
import ImageGallery from '@/components/ImageGallery';
import CarCard from '@/components/CarCard';
import BookNowCTA from '@/components/BookNowCTA';

interface PageProps {
  params: { carId: string };
}

// Always render dynamically — the car detail depends on the URL param
// and on a live backend call.
export const dynamic = 'force-dynamic';

export default async function CarDetailPage({ params }: PageProps) {
  const carId = params?.carId;
  if (!carId) notFound();

  let car: Car;
  let similar: CarSummary[] = [];
  let errorMessage: string | null = null;

  try {
    car = await fetchCarById(carId);
    try {
      const list = await fetchCars({ category: car.category, sort: 'price_asc' });
      similar = list.filter((c) => c.id !== car.id).slice(0, 4);
    } catch {
      similar = [];
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      errorMessage = 'Car not found. It may have been removed from our fleet.';
    } else {
      errorMessage = err instanceof Error ? err.message : 'Failed to load car.';
    }
    // Render the error view below.
    car = null as unknown as Car;
  }

  if (errorMessage || !car) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-lg rounded-xl border border-danger/30 bg-danger/10 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-danger" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
            {errorMessage || 'Something went wrong'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The car you&apos;re looking for may have been removed or the link is
            incorrect.
          </p>
          <Link
            href="/cars"
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all cars
          </Link>
        </div>
      </div>
    );
  }

  const weeklyCost = car.price_per_day * 7;
  const monthlyCost = car.price_per_day * 30;

  return (
    <div className="bg-slate-50">
      {/* Breadcrumb */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container py-4">
          <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="hover:text-brand-700">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/cars" className="hover:text-brand-700">
                  Cars
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-slate-700">{car.name}</li>
            </ol>
          </nav>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gallery (client component) */}
          <div>
            <ImageGallery images={car.images} alt={car.name} />
          </div>

          {/* Specs + booking */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {car.category}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      car.is_available
                        ? 'bg-success/15 text-success'
                        : 'bg-danger/10 text-danger'
                    }`}
                  >
                    {car.is_available ? 'Available' : 'Currently Unavailable'}
                  </span>
                </div>
                <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
                  {car.name}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {car.model} &middot; Year {car.year}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold text-brand-700">
                  {formatINR(car.price_per_day)}
                </p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  per day
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-3 text-center">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Daily</p>
                <p className="font-display font-semibold text-slate-900">
                  {formatINR(car.price_per_day)}
                </p>
              </div>
              <div className="border-x border-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500">Weekly</p>
                <p className="font-display font-semibold text-slate-900">
                  {formatINR(weeklyCost)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Monthly</p>
                <p className="font-display font-semibold text-slate-900">
                  {formatINR(monthlyCost)}
                </p>
              </div>
            </div>

            {/* Specs grid */}
            <h2 className="mt-6 font-display text-lg font-semibold text-slate-900">
              Specifications
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SpecCard Icon={Calendar} label="Year" value={String(car.year)} />
              <SpecCard Icon={Fuel} label="Fuel" value={car.fuel_type} />
              <SpecCard Icon={Settings} label="Transmission" value={car.transmission} />
              <SpecCard Icon={Users} label="Seating" value={`${car.seating_capacity} seats`} />
              <SpecCard Icon={Zap} label="Mileage" value={car.mileage > 0 ? `${car.mileage} km/l` : 'N/A'} />
              <SpecCard Icon={CarIcon} label="Category" value={car.category} />
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <BookNowCTA carId={car.id} isAvailable={car.is_available} />
              <Link
                href="/cars"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-5 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Link>
            </div>
            {!car.is_available && (
              <p className="mt-2 text-xs text-danger">
                This car is currently on rent. Booking is disabled.
              </p>
            )}
          </div>
        </div>

        {/* Description + features */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-xl font-semibold text-slate-900">
              About this car
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700">
              {car.description}
            </p>

            <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">
              Features &amp; Equipment
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {car.features.map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                  {feat}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Rental terms
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" aria-hidden="true" />
                Free pickup at our MG Road office.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" aria-hidden="true" />
                Taxes &amp; basic insurance included.
              </li>
              <li className="flex items-start gap-2">
                <Fuel className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" aria-hidden="true" />
                Return with the same fuel level.
              </li>
              <li className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" aria-hidden="true" />
                Only the registered driver may drive.
              </li>
            </ul>
          </aside>
        </div>

        {/* Similar cars */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Similar cars you might like
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Other {car.category} options in our fleet.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((c) => (
                <CarCard key={c.id} car={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SpecCard({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
      <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold capitalize text-slate-900">{value}</p>
    </div>
  );
}
