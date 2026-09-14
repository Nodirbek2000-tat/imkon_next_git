"use client";

import { Input, Select } from "@/components/ui/Input";

export type Filters = {
  minPrice: string;
  maxPrice: string;
  region: string;
  saleType: string;
};

/**
 * Narx oralig'i / viloyat / sotuv turi — backend'da (`ProductFilter`)
 * allaqachon qo'llab-quvvatlanadi, shu yerda faqat UI qo'shiladi.
 */
export function FilterPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  return (
    <div className="space-y-5 rounded-[var(--radius-card)] border bg-[var(--surface)] p-5">
      <div>
        <p className="mb-3 text-sm font-semibold">Narx oralig&apos;i</p>
        <div className="flex items-center gap-2">
          <Input
            id="min-price"
            label="Dan"
            inputMode="numeric"
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value.replace(/\D/g, "") })}
          />
          <span className="mt-6 text-ink-400">—</span>
          <Input
            id="max-price"
            label="Gacha"
            inputMode="numeric"
            placeholder="1 000 000"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value.replace(/\D/g, "") })}
          />
        </div>
      </div>

      <Input
        id="filter-region"
        label="Viloyat"
        placeholder="Toshkent"
        value={filters.region}
        onChange={(e) => onChange({ ...filters, region: e.target.value })}
      />

      <Select
        id="filter-sale-type"
        label="Sotuv turi"
        value={filters.saleType}
        onChange={(e) => onChange({ ...filters, saleType: e.target.value })}
      >
        <option value="">Hammasi</option>
        <option value="fixed">Belgilangan narx</option>
        <option value="auction">Auksion</option>
      </Select>
    </div>
  );
}

export const EMPTY_FILTERS: Filters = { minPrice: "", maxPrice: "", region: "", saleType: "" };
