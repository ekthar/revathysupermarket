"use client";

import { Search, X, Calendar } from "lucide-react";
import { useCallback, useState, useRef, useEffect } from "react";

export interface FilterConfig {
  key: string;
  type: "search" | "select" | "multi-select" | "date" | "date-range";
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface AdminFiltersProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  /** Debounce delay for search inputs (ms) */
  debounceMs?: number;
}

export function AdminFilters({
  filters,
  values,
  onChange,
  debounceMs = 300,
}: AdminFiltersProps) {
  const [localSearch, setLocalSearch] = useState<Record<string, string>>({});
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize local search values from props
  useEffect(() => {
    const searchFilters = filters.filter((f) => f.type === "search");
    const init: Record<string, string> = {};
    for (const f of searchFilters) {
      init[f.key] = values[f.key] || "";
    }
    setLocalSearch(init);
  }, []);

  const handleChange = useCallback(
    (key: string, value: string) => {
      onChange({ ...values, [key]: value });
    },
    [values, onChange]
  );

  const handleSearchChange = useCallback(
    (key: string, value: string) => {
      setLocalSearch((prev) => ({ ...prev, [key]: value }));

      if (debounceRef.current[key]) {
        clearTimeout(debounceRef.current[key]);
      }

      debounceRef.current[key] = setTimeout(() => {
        handleChange(key, value);
      }, debounceMs);
    },
    [handleChange, debounceMs]
  );

  const clearFilter = useCallback(
    (key: string) => {
      setLocalSearch((prev) => ({ ...prev, [key]: "" }));
      handleChange(key, "");
    },
    [handleChange]
  );

  const hasActiveFilters = Object.values(values).some((v) => v !== "");

  const clearAll = useCallback(() => {
    const cleared: Record<string, string> = {};
    for (const key of Object.keys(values)) {
      cleared[key] = "";
    }
    setLocalSearch({});
    onChange(cleared);
  }, [values, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => {
        switch (filter.type) {
          case "search":
            return (
              <div key={filter.key} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder={filter.placeholder || `Search ${filter.label}...`}
                  value={localSearch[filter.key] || ""}
                  onChange={(e) =>
                    handleSearchChange(filter.key, e.target.value)
                  }
                  className="h-9 w-56 rounded-lg border border-neutral-200 bg-white pl-9 pr-8 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:placeholder:text-neutral-500"
                />
                {(localSearch[filter.key] || values[filter.key]) && (
                  <button
                    onClick={() => clearFilter(filter.key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700"
                    aria-label={`Clear ${filter.label} filter`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );

          case "select":
            return (
              <select
                key={filter.key}
                value={values[filter.key] || ""}
                onChange={(e) => handleChange(filter.key, e.target.value)}
                className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                aria-label={filter.label}
              >
                <option value="">{filter.placeholder || `All ${filter.label}`}</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            );

          case "date":
            return (
              <div key={filter.key} className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="date"
                  value={values[filter.key] || ""}
                  onChange={(e) => handleChange(filter.key, e.target.value)}
                  className="h-9 rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  aria-label={filter.label}
                />
              </div>
            );

          default:
            return null;
        }
      })}

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
