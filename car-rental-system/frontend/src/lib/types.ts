// Type definitions matching the backend's Pydantic models.

export type CarCategory = 'hatchback' | 'sedan' | 'suv' | 'luxury';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'cng';
export type Transmission = 'manual' | 'automatic';
export type SortOption = 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Car {
  id: string;
  name: string;
  model: string;
  year: number;
  category: CarCategory;
  fuel_type: FuelType;
  transmission: Transmission;
  seating_capacity: number;
  mileage: number;
  price_per_day: number;
  images: string[];
  features: string[];
  is_available: boolean;
  description: string;
  created_at: string;
}

export interface CarSummary {
  id: string;
  name: string;
  model: string;
  year: number;
  category: CarCategory;
  fuel_type: FuelType;
  transmission: Transmission;
  seating_capacity: number;
  mileage: number;
  price_per_day: number;
  images: string[];
  is_available: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Booking {
  id: string;
  user_id: string;
  car_id: string;
  car_name: string;
  customer_name: string;
  email: string;
  phone: string;
  pickup_date: string;
  return_date: string;
  pickup_address?: string | null;
  special_requests?: string | null;
  total_days: number;
  total_cost: number;
  status: BookingStatus;
  created_at: string;
}

export interface BookingCreatePayload {
  car_id: string;
  customer_name: string;
  email: string;
  phone: string;
  pickup_date: string;
  return_date: string;
  pickup_address?: string;
  special_requests?: string;
}

// Standard response envelope from the backend.
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

// Filter shape (URL-synced).
export interface CarFilters {
  search?: string;
  category?: CarCategory | '';
  fuel_type?: FuelType | '';
  transmission?: Transmission | '';
  min_price?: number;
  max_price?: number;
  min_seating?: number;
  available_only?: boolean;
  sort?: SortOption;
}
