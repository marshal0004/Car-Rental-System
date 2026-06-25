'use client';

import { X } from 'lucide-react';
import type { CarFilters } from '@/lib/types';
import { getActiveFilterChips, type FilterChip } from '@/lib/filters';

interface FilterChipsProps {
  filters: CarFilters;
  onRemove: (key: FilterChip['key']) => void;
}

export default function FilterChips({ filters, onRemove }: FilterChipsProps) {
  const chips = getActiveFilterChips(filters);
  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="Active filters"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Active:
      </span>
      {chips.map((chip) => (
        <span
          key={`${chip.key}-${chip.value}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800"
        >
          <span className="text-brand-600">{chip.label}:</span>
          <span>{chip.value}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove filter: ${chip.label} ${chip.value}`}
            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-brand-700 hover:bg-brand-200"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
