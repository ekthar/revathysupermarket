"use client";

import { ReactNode, useState, useCallback } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from "lucide-react";
import { AdminEmptyState } from "./AdminEmptyState";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  /** Custom width class (e.g., "w-32", "min-w-[200px]") */
  width?: string;
  /** Render function for custom cell content */
  render?: (item: T, index: number) => ReactNode;
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Unique key extractor */
  getRowKey: (item: T) => string;
  /** Current sort state */
  sort?: SortState;
  /** Sort change handler (for server-side sort pass this) */
  onSortChange?: (sort: SortState) => void;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state configuration */
  emptyState?: {
    title: string;
    description?: string;
    action?: { label: string; onClick?: () => void; href?: string };
  };
  /** Bulk action bar content (rendered when items selected) */
  bulkActions?: ReactNode;
  /** Additional class for the table container */
  className?: string;
}

export function AdminDataTable<T>({
  columns,
  data,
  getRowKey,
  sort,
  onSortChange,
  selectable,
  selectedKeys = new Set(),
  onSelectionChange,
  onRowClick,
  loading,
  emptyState,
  bulkActions,
  className,
}: AdminDataTableProps<T>) {
  const [localSort, setLocalSort] = useState<SortState | undefined>(sort);

  const activeSort = sort || localSort;

  const handleSort = useCallback(
    (key: string) => {
      const newDirection: "asc" | "desc" =
        activeSort?.key === key && activeSort.direction === "asc"
          ? "desc"
          : "asc";
      const newSort = { key, direction: newDirection };
      if (onSortChange) {
        onSortChange(newSort);
      } else {
        setLocalSort(newSort);
      }
    },
    [activeSort, onSortChange]
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (selectedKeys.size === data.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(getRowKey)));
    }
  }, [data, getRowKey, onSelectionChange, selectedKeys.size]);

  const handleSelectRow = useCallback(
    (key: string) => {
      if (!onSelectionChange) return;
      const next = new Set(selectedKeys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onSelectionChange(next);
    },
    [onSelectionChange, selectedKeys]
  );

  // Local sort (when no server-side sort handler)
  const sortedData =
    !onSortChange && localSort
      ? [...data].sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[localSort.key];
          const bVal = (b as Record<string, unknown>)[localSort.key];
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          const cmp = String(aVal).localeCompare(String(bVal), undefined, {
            numeric: true,
          });
          return localSort.direction === "asc" ? cmp : -cmp;
        })
      : data;

  const allSelected = data.length > 0 && selectedKeys.size === data.length;
  const someSelected = selectedKeys.size > 0 && !allSelected;

  if (!loading && data.length === 0 && emptyState) {
    return (
      <AdminEmptyState
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {/* Bulk actions bar */}
      {selectedKeys.size > 0 && bulkActions && (
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-2.5 dark:bg-blue-950/30">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedKeys.size} selected
          </span>
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Header */}
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/80">
                {selectable && (
                  <th className="w-12 px-4 py-3">
                    <button
                      onClick={handleSelectAll}
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        allSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : someSelected
                            ? "border-blue-600 bg-blue-100 dark:bg-blue-900"
                            : "border-neutral-300 dark:border-neutral-600"
                      }`}
                      aria-label={allSelected ? "Deselect all" : "Select all"}
                    >
                      {(allSelected || someSelected) && (
                        <Check className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ${
                      col.width || ""
                    } ${col.hideOnMobile ? "hidden md:table-cell" : ""} ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : ""
                    }`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100"
                      >
                        {col.label}
                        {activeSort?.key === col.key ? (
                          activeSort.direction === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {selectable && (
                        <td className="px-4 py-3">
                          <div className="h-5 w-5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                        >
                          <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                        </td>
                      ))}
                    </tr>
                  ))
                : sortedData.map((item, index) => {
                    const key = getRowKey(item);
                    const isSelected = selectedKeys.has(key);
                    return (
                      <tr
                        key={key}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-blue-50/50 dark:bg-blue-950/20"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        } ${onRowClick ? "cursor-pointer" : ""}`}
                        onClick={() => onRowClick?.(item)}
                      >
                        {selectable && (
                          <td
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleSelectRow(key)}
                              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                                isSelected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-neutral-300 dark:border-neutral-600"
                              }`}
                              aria-label={
                                isSelected ? "Deselect row" : "Select row"
                              }
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </button>
                          </td>
                        )}
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-4 py-3 ${col.hideOnMobile ? "hidden md:table-cell" : ""} ${
                              col.align === "right"
                                ? "text-right"
                                : col.align === "center"
                                  ? "text-center"
                                  : ""
                            }`}
                          >
                            {col.render
                              ? col.render(item, index)
                              : String(
                                  (item as Record<string, unknown>)[col.key] ??
                                    ""
                                )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
