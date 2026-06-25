/**
 * Component tests for the car-rental frontend — CarCard renders car
 * summary fields correctly and links to the detail / booking pages.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CarCard from '@/components/CarCard';
import type { CarSummary } from '@/lib/types';

const baseCar: CarSummary = {
  id: 'maruti-swift',
  name: 'Maruti Swift',
  model: 'VXi',
  year: 2024,
  category: 'hatchback',
  fuel_type: 'petrol',
  transmission: 'manual',
  seating_capacity: 5,
  mileage: 22,
  price_per_day: 2200,
  images: ['/images/cars/swift-1.webp'],
  is_available: true,
};

describe('CarCard component', () => {
  it('renders the car name', () => {
    render(<CarCard car={baseCar} />);
    expect(screen.getByText('Maruti Swift')).toBeInTheDocument();
  });

  it('renders model and year', () => {
    render(<CarCard car={baseCar} />);
    expect(screen.getByText(/VXi/)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('renders the daily price formatted as INR', () => {
    render(<CarCard car={baseCar} />);
    expect(screen.getByText('₹2,200')).toBeInTheDocument();
  });

  it('shows the category badge', () => {
    render(<CarCard car={baseCar} />);
    expect(screen.getByText('hatchback')).toBeInTheDocument();
  });

  it('shows fuel type', () => {
    render(<CarCard car={baseCar} />);
    expect(screen.getByText('petrol')).toBeInTheDocument();
  });

  it('shows seating capacity', () => {
    render(<CarCard car={baseCar} />);
    expect(screen.getByText(/5 seats/)).toBeInTheDocument();
  });

  it('shows transmission type', () => {
    render(<CarCard car={baseCar} />);
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  it('shows Available status when is_available=true', () => {
    render(<CarCard car={baseCar} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows Unavailable status when is_available=false', () => {
    render(<CarCard car={{ ...baseCar, is_available: false }} />);
    expect(screen.getByText('Currently Unavailable')).toBeInTheDocument();
  });

  it('links to detail page with car id', () => {
    render(<CarCard car={baseCar} />);
    const detailLink = screen.getByRole('link', { name: /view details/i });
    expect(detailLink).toHaveAttribute('href', '/cars/maruti-swift');
  });

  it('links to booking page when available', () => {
    render(<CarCard car={baseCar} />);
    const bookLink = screen.getByRole('link', { name: 'Book Now' });
    expect(bookLink).toHaveAttribute('href', '/book?carId=maruti-swift');
  });
});
