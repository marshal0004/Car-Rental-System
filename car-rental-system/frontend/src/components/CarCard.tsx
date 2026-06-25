'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Users, Fuel, Calendar, ArrowRight } from 'lucide-react';
import type { CarSummary } from '@/lib/types';
import { formatINR } from '@/lib/pricing';

interface CarCardProps {
  car: CarSummary;
}

const PLACEHOLDER = '/images/cars/placeholder.svg';

export default function CarCard({ car }: CarCardProps) {
  const [imgError, setImgError] = useState(false);
  const image = imgError ? PLACEHOLDER : car.images?.[0] || PLACEHOLDER;
  const available = car.is_available;

  return (
    <article className="card-lift flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={`${car.name} — ${car.model}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
            available
              ? 'bg-success/90 text-white'
              : 'bg-danger/90 text-white'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-white' : 'bg-white'}`}
            aria-hidden="true"
          />
          {available ? 'Available' : 'Currently Unavailable'}
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 shadow-sm">
          {car.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              {car.name}
            </h3>
            <p className="text-xs text-slate-500">
              {car.model} &middot; {car.year}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-brand-700">
              {formatINR(car.price_per_day)}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">per day</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
            <Fuel className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span className="capitalize">{car.fuel_type}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
            <Users className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            {car.seating_capacity} seats
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
            <Calendar className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            {car.transmission === 'automatic' ? 'Auto' : 'Manual'}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/cars/${car.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            View Details
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={available ? `/book?carId=${car.id}` : '#'}
            aria-disabled={!available}
            tabIndex={available ? 0 : -1}
            className={`flex-1 inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${
              available
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'cursor-not-allowed bg-slate-200 text-slate-400'
            }`}
            onClick={(e) => {
              if (!available) e.preventDefault();
            }}
          >
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
}
