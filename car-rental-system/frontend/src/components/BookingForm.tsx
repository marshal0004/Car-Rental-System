'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, CheckCircle2, Loader2, MapPin, Phone, User, Mail, MessageSquare } from 'lucide-react';
import type { Booking, CarSummary } from '@/lib/types';
import { ApiError, createBooking, fetchCars } from '@/lib/api';
import { computeTotalCost, daysBetween, formatINR, todayISO } from '@/lib/pricing';

const bookingSchema = z
  .object({
    car_id: z.string().min(1, 'Please select a car'),
    customer_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().regex(/^[+]?[\d\s-]{10,15}$/, 'Enter a valid phone (10-15 digits)'),
    pickup_date: z
      .string()
      .min(1, 'Pickup date is required')
      .refine((d) => {
        const today = todayISO();
        return d >= today;
      }, 'Pickup date cannot be in the past'),
    return_date: z.string().min(1, 'Return date is required'),
    pickup_address: z.string().max(300).optional(),
    special_requests: z.string().max(1000).optional(),
  })
  .refine((data) => data.return_date > data.pickup_date, {
    message: 'Return date must be after pickup date',
    path: ['return_date'],
  });

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  preselectedCar?: CarSummary | null;
  defaultCustomerName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

export default function BookingForm({
  preselectedCar,
  defaultCustomerName = '',
  defaultEmail = '',
  defaultPhone = '',
}: BookingFormProps) {
  const router = useRouter();
  const [availableCars, setAvailableCars] = useState<CarSummary[]>([]);
  const [loadingCars, setLoadingCars] = useState(!preselectedCar);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      car_id: preselectedCar?.id ?? '',
      customer_name: defaultCustomerName,
      email: defaultEmail,
      phone: defaultPhone,
      pickup_date: '',
      return_date: '',
      pickup_address: '',
      special_requests: '',
    },
  });

  // Fetch the available-cars list when no preselected car is supplied.
  useEffect(() => {
    if (preselectedCar) return;
    let active = true;
    (async () => {
      try {
        const list = await fetchCars({ available_only: true, sort: 'price_asc' });
        if (active) setAvailableCars(list);
      } catch (err) {
        if (active) {
          setSubmitError(
            err instanceof ApiError ? err.message : 'Could not load available cars.',
          );
        }
      } finally {
        if (active) setLoadingCars(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [preselectedCar]);

  const carId = watch('car_id');
  const pickupDate = watch('pickup_date');
  const returnDate = watch('return_date');

  const selectedCar = useMemo(() => {
    if (preselectedCar) return preselectedCar;
    return availableCars.find((c) => c.id === carId) ?? null;
  }, [preselectedCar, availableCars, carId]);

  const days = useMemo(
    () => daysBetween(pickupDate, returnDate),
    [pickupDate, returnDate],
  );
  const totalCost = useMemo(
    () => computeTotalCost(days, selectedCar?.price_per_day ?? 0),
    [days, selectedCar],
  );

  const onSubmit = async (data: BookingFormData) => {
    setSubmitError(null);
    try {
      const created = await createBooking({
        car_id: data.car_id,
        customer_name: data.customer_name,
        email: data.email,
        phone: data.phone,
        pickup_date: data.pickup_date,
        return_date: data.return_date,
        pickup_address: data.pickup_address || undefined,
        special_requests: data.special_requests || undefined,
      });
      setSuccessBooking(created);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : 'Could not submit booking. Please try again.',
      );
    }
  };

  if (successBooking) {
    return (
      <SuccessView booking={successBooking} onReset={() => {
        setSuccessBooking(null);
        router.push('/my-bookings');
      }} />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
      aria-busy={isSubmitting}
    >
      {/* Selected car display */}
      {preselectedCar && (
        <div className="flex items-center gap-4 rounded-lg border border-brand-200 bg-brand-50 p-3">
          <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-slate-200">
            <img
              src={preselectedCar.images?.[0] || '/images/cars/placeholder.svg'}
              alt={preselectedCar.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/cars/placeholder.svg';
              }}
            />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold text-slate-900">{preselectedCar.name}</p>
            <p className="text-xs text-slate-600">
              {preselectedCar.model} &middot; {formatINR(preselectedCar.price_per_day)}/day
            </p>
          </div>
          <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
            Pre-selected
          </span>
        </div>
      )}

      {/* Car selector (only when no preselected car) */}
      {!preselectedCar && (
        <Field
          id="car_id"
          label="Select a Car"
          error={errors.car_id?.message}
          required
        >
          {loadingCars ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading available cars…
            </div>
          ) : (
            <select
              id="car_id"
              {...register('car_id')}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              aria-invalid={Boolean(errors.car_id)}
            >
              <option value="">— Choose a car —</option>
              {availableCars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.model}) — {formatINR(c.price_per_day)}/day
                </option>
              ))}
            </select>
          )}
        </Field>
      )}

      {/* Customer details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="customer_name" label="Full Name" error={errors.customer_name?.message} required>
          <InputWithIcon Icon={User}>
            <input
              id="customer_name"
              type="text"
              autoComplete="name"
              {...register('customer_name')}
              className={inputClass(Boolean(errors.customer_name))}
              aria-invalid={Boolean(errors.customer_name)}
            />
          </InputWithIcon>
        </Field>
        <Field id="email" label="Email" error={errors.email?.message} required>
          <InputWithIcon Icon={Mail}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={inputClass(Boolean(errors.email))}
              aria-invalid={Boolean(errors.email)}
            />
          </InputWithIcon>
        </Field>
        <Field id="phone" label="Phone" error={errors.phone?.message} required>
          <InputWithIcon Icon={Phone}>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              {...register('phone')}
              className={inputClass(Boolean(errors.phone))}
              aria-invalid={Boolean(errors.phone)}
            />
          </InputWithIcon>
        </Field>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="pickup_date" label="Pickup Date" error={errors.pickup_date?.message} required>
          <InputWithIcon Icon={Calendar}>
            <input
              id="pickup_date"
              type="date"
              min={todayISO()}
              {...register('pickup_date')}
              className={inputClass(Boolean(errors.pickup_date))}
              aria-invalid={Boolean(errors.pickup_date)}
            />
          </InputWithIcon>
        </Field>
        <Field id="return_date" label="Return Date" error={errors.return_date?.message} required>
          <InputWithIcon Icon={Calendar}>
            <input
              id="return_date"
              type="date"
              min={pickupDate || todayISO()}
              {...register('return_date')}
              className={inputClass(Boolean(errors.return_date))}
              aria-invalid={Boolean(errors.return_date)}
            />
          </InputWithIcon>
        </Field>
      </div>

      {/* Optional fields */}
      <Field id="pickup_address" label="Pickup Address (optional)" error={errors.pickup_address?.message}>
        <InputWithIcon Icon={MapPin}>
          <input
            id="pickup_address"
            type="text"
            placeholder="MG Road, Bengaluru"
            {...register('pickup_address')}
            className={inputClass(Boolean(errors.pickup_address))}
          />
        </InputWithIcon>
      </Field>
      <Field
        id="special_requests"
        label="Special Requests (optional)"
        error={errors.special_requests?.message}
      >
        <div className="relative">
          <MessageSquare
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <textarea
            id="special_requests"
            rows={3}
            placeholder="Child seat, additional driver, etc."
            {...register('special_requests')}
            className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </Field>

      {/* Live cost estimate */}
      {selectedCar && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Live Cost Estimate
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div>
              <p className="font-display text-2xl font-bold text-brand-800">
                {formatINR(totalCost)}
              </p>
              <p className="text-xs text-brand-700">
                {days > 0
                  ? `${days} day${days === 1 ? '' : 's'} × ${formatINR(selectedCar.price_per_day)}/day`
                  : 'Select both dates to see total'}
              </p>
            </div>
            <div className="text-right text-xs text-brand-700">
              <p>Rate: {formatINR(selectedCar.price_per_day)}/day</p>
              <p>Days: {days}</p>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Submitting…
          </>
        ) : (
          'Confirm Booking'
        )}
      </button>
    </form>
  );
}

// ----------------------- helpers -----------------------

function inputClass(hasError: boolean): string {
  return `w-full rounded-md border bg-white py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-danger focus:border-danger focus:ring-danger/30'
      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200'
  }`;
}

function InputWithIcon({
  Icon,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-1 text-xs text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function SuccessView({
  booking,
  onReset,
}: {
  booking: Booking;
  onReset: () => void;
}) {
  return (
    <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center sm:p-8">
      <CheckCircle2
        className="mx-auto h-14 w-14 text-success"
        aria-hidden="true"
      />
      <h2 className="mt-4 font-display text-2xl font-bold text-slate-900">
        Booking Confirmed!
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        We&apos;ve received your booking request. Our fleet team will confirm
        availability shortly.
      </p>
      <div className="mx-auto mt-6 max-w-md rounded-lg border border-slate-200 bg-white p-4 text-left text-sm">
        <Row label="Booking Reference" value={booking.id} strong />
        <Row label="Car" value={booking.car_name} />
        <Row
          label="Dates"
          value={`${booking.pickup_date} → ${booking.return_date}`}
        />
        <Row label="Duration" value={`${booking.total_days} day${booking.total_days === 1 ? '' : 's'}`} />
        <Row label="Total Cost" value={formatINR(booking.total_cost)} strong />
        <Row label="Status" value={booking.status} />
      </div>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          View My Bookings
        </button>
        <a
          href="/cars"
          className="inline-flex items-center justify-center rounded-md border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Browse More Cars
        </a>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span
        className={`text-slate-900 ${strong ? 'font-display font-bold' : 'font-medium'} capitalize`}
      >
        {value}
      </span>
    </div>
  );
}
