/**
 * Unit tests for car-rental frontend — pricing utilities (pure functions).
 *
 * These are the most critical helpers: they compute the booking cost
 * the user sees and the total the backend charges. They MUST match
 * the backend's compute_total_cost exactly.
 */
import { describe, it, expect } from 'vitest';
import {
  daysBetween,
  computeTotalCost,
  formatINR,
  todayISO,
  addDays,
} from '@/lib/pricing';

describe('daysBetween', () => {
  it('returns positive diff for valid range', () => {
    expect(daysBetween('2026-12-25', '2026-12-28')).toBe(3);
  });

  it('returns 1 for next-day rental', () => {
    expect(daysBetween('2026-12-25', '2026-12-26')).toBe(1);
  });

  it('returns 0 for same day', () => {
    expect(daysBetween('2026-12-25', '2026-12-25')).toBe(0);
  });

  it('returns 0 for return before pickup', () => {
    expect(daysBetween('2026-12-28', '2026-12-25')).toBe(0);
  });

  it('returns 0 for empty inputs', () => {
    expect(daysBetween('', '2026-12-25')).toBe(0);
    expect(daysBetween('2026-12-25', '')).toBe(0);
  });

  it('returns 0 for invalid date strings', () => {
    expect(daysBetween('not-a-date', '2026-12-25')).toBe(0);
  });
});

describe('computeTotalCost', () => {
  it('multiplies days × price', () => {
    expect(computeTotalCost(3, 2200)).toBe(6600);
  });

  it('returns 0 for non-positive days', () => {
    expect(computeTotalCost(0, 2200)).toBe(0);
    expect(computeTotalCost(-1, 2200)).toBe(0);
  });

  it('returns 0 for non-positive price', () => {
    expect(computeTotalCost(3, 0)).toBe(0);
    expect(computeTotalCost(3, -100)).toBe(0);
  });
});

describe('formatINR', () => {
  it('formats with rupee symbol and Indian grouping', () => {
    expect(formatINR(6600)).toBe('₹6,600');
  });

  it('formats large amounts correctly', () => {
    expect(formatINR(150000)).toBe('₹1,50,000');
  });

  it('formats 0', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  it('formats single and double digit amounts', () => {
    expect(formatINR(5)).toBe('₹5');
    expect(formatINR(99)).toBe('₹99');
  });
});

describe('todayISO', () => {
  it('returns a YYYY-MM-DD string', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today (within ±1 day for timezone edges)', () => {
    const result = todayISO();
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(result).toBe(expected);
  });
});

describe('addDays', () => {
  it('adds days to a date', () => {
    expect(addDays('2026-12-25', 3)).toBe('2026-12-28');
  });

  it('handles month rollover', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('handles year rollover', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('returns empty string for invalid input', () => {
    expect(addDays('not-a-date', 3)).toBe('');
  });

  it('handles zero days (returns same date)', () => {
    expect(addDays('2026-12-25', 0)).toBe('2026-12-25');
  });
});
