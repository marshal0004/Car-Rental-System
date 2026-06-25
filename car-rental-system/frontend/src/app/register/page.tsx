'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z
    .string()
    .regex(/^[+]?[\d\s-]{10,15}$/, 'Enter a valid phone (10-15 digits)')
    .optional()
    .or(z.literal('')),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterFallback() {
  return (
    <div className="bg-slate-50">
      <div className="container py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Loading…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      });
      router.push(redirect);
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.message
          : 'Could not register. Please try again.',
      );
    }
  };

  return (
    <div className="bg-slate-50">
      <div className="container py-12 sm:py-16">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <UserPlus className="h-6 w-6" aria-hidden="true" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Join ZoomWheels and start booking cars in minutes.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-6 space-y-4"
              noValidate
            >
              <div className="flex flex-col">
                <label htmlFor="name" className="mb-1 text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  className={`rounded-md border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-danger focus:border-danger focus:ring-danger/30'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200'
                  }`}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && (
                  <p role="alert" className="mt-1 text-xs text-danger">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <label htmlFor="email" className="mb-1 text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`rounded-md border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-danger focus:border-danger focus:ring-danger/30'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200'
                  }`}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && (
                  <p role="alert" className="mt-1 text-xs text-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <label htmlFor="password" className="mb-1 text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className={`rounded-md border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-danger focus:border-danger focus:ring-danger/30'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200'
                  }`}
                  aria-invalid={Boolean(errors.password)}
                />
                {errors.password && (
                  <p role="alert" className="mt-1 text-xs text-danger">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <label htmlFor="phone" className="mb-1 text-sm font-medium text-slate-700">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                  className={`rounded-md border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? 'border-danger focus:border-danger focus:ring-danger/30'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200'
                  }`}
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone && (
                  <p role="alert" className="mt-1 text-xs text-danger">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{serverError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating account…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                className="font-semibold text-brand-700 hover:text-brand-800"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
