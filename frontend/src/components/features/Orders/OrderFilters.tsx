/** Order status filters — pill buttons for All / Live / Matched / Cancelled */

import type { OrderStatus } from "@/types/order";

interface OrderFiltersProps {
  activeStatus: OrderStatus | undefined;
  onStatusChange: (status: OrderStatus | undefined) => void;
  counts?: {
    total_live: number;
    total_matched: number;
    total_cancelled: number;
  };
}

const STATUSES: { label: string; value: OrderStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Live", value: "LIVE" },
  { label: "Matched", value: "MATCHED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function OrderFilters({
  activeStatus,
  onStatusChange,
  counts,
}: OrderFiltersProps) {
  function getCount(value: OrderStatus | undefined): number | undefined {
    if (!counts) return undefined;
    if (value === undefined)
      return counts.total_live + counts.total_matched + counts.total_cancelled;
    if (value === "LIVE") return counts.total_live;
    if (value === "MATCHED") return counts.total_matched;
    if (value === "CANCELLED") return counts.total_cancelled;
    return undefined;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map(({ label, value }) => {
        const isActive = activeStatus === value;
        const count = getCount(value);
        return (
          <button
            key={label}
            onClick={() => onStatusChange(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-[var(--accent-blue)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
            {count !== undefined && (
              <span className="ml-1 opacity-70">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
