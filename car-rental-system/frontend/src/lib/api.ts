// API client — wraps every backend call, returns unwrapped data, throws on error.

import type {
  ApiEnvelope,
  AuthResponse,
  Booking,
  BookingCreatePayload,
  Car,
  CarFilters,
  CarSummary,
} from './types';
import { filtersToApiQuery } from './filters';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8003/api';

const TOKEN_KEY = 'car_token';
const USER_KEY = 'car_user';

// ----------------------- token + storage helpers -----------------------

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore quota errors */
  }
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

export function getStoredUser<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStoredUser<T>(user: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

// ----------------------- core fetch wrapper -----------------------

export class ApiError extends Error {
  status: number;
  envelope?: ApiEnvelope<unknown>;
  constructor(message: string, status: number, envelope?: ApiEnvelope<unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.envelope = envelope;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new ApiError(
      `Network error contacting ${API_BASE}${path}: ${
        err instanceof Error ? err.message : 'unknown'
      }`,
      0,
    );
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(
      `Bad response from server (status ${res.status})`,
      res.status,
    );
  }

  if (!res.ok || !envelope.success) {
    const msg = envelope.message || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, envelope as ApiEnvelope<unknown>);
  }
  return envelope.data;
}

// ----------------------- auth -----------------------

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  // Backend uses OAuth2PasswordRequestForm — URL-encoded body.
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);
  const headers = new Headers({
    'Content-Type': 'application/x-www-form-urlencoded',
  });
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers,
    body: form.toString(),
  });
  let envelope: ApiEnvelope<AuthResponse>;
  try {
    envelope = (await res.json()) as ApiEnvelope<AuthResponse>;
  } catch {
    throw new ApiError(`Bad response from server (status ${res.status})`, res.status);
  }
  if (!res.ok || !envelope.success) {
    throw new ApiError(envelope.message || 'Login failed', res.status, envelope as ApiEnvelope<unknown>);
  }
  setToken(envelope.data.token);
  setStoredUser(envelope.data.user);
  return envelope.data;
}

export async function fetchCurrentUser<
  T = { id: string; name: string; email: string; phone?: string | null; created_at: string },
>(): Promise<T> {
  return request<T>('/auth/me');
}

// ----------------------- cars -----------------------

export async function fetchCars(filters: CarFilters = {}): Promise<CarSummary[]> {
  const qs = filtersToApiQuery(filters);
  const path = qs ? `/cars?${qs}` : '/cars';
  return request<CarSummary[]>(path);
}

export async function fetchFeaturedCars(limit = 6): Promise<CarSummary[]> {
  return request<CarSummary[]>(`/cars/featured?limit=${limit}`);
}

export async function fetchCarById(id: string): Promise<Car> {
  return request<Car>(`/cars/${encodeURIComponent(id)}`);
}

// ----------------------- meta -----------------------

export async function fetchCategories(): Promise<string[]> {
  return request<string[]>('/meta/categories');
}

export async function fetchFuelTypes(): Promise<string[]> {
  return request<string[]>('/meta/fuel-types');
}

// ----------------------- bookings -----------------------

export async function fetchBookings(): Promise<Booking[]> {
  return request<Booking[]>('/bookings');
}

export async function fetchBookingById(id: string): Promise<Booking> {
  return request<Booking>(`/bookings/${encodeURIComponent(id)}`);
}

export async function createBooking(
  payload: BookingCreatePayload,
): Promise<Booking> {
  // Clean up undefined optional fields so the server doesn't choke.
  const body: Record<string, unknown> = { ...payload };
  if (!body.pickup_address) delete body.pickup_address;
  if (!body.special_requests) delete body.special_requests;
  return request<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function cancelBooking(id: string): Promise<Booking> {
  return request<Booking>(`/bookings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export { API_BASE, TOKEN_KEY, USER_KEY };
