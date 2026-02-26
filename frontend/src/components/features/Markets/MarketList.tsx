/** Market list grid with loading skeletons and pagination */

import { MarketCard } from "./MarketCard";
import type { Market } from "@/types/market";

interface MarketListProps {
  markets: Market[] | undefined;
  isLoading: boolean;
  total?: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function MarketList({
  markets,
  isLoading,
  total = 0,
  page,
  pageSize,
  onPageChange,
}: MarketListProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading && !markets) {
    return <SkeletonGrid />;
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
        <svg
          className="mb-4 h-12 w-12 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-medium">No markets found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <PaginationButton
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            ← Prev
          </PaginationButton>

          <span className="px-3 text-sm text-[var(--text-secondary)]">
            Page {page} of {totalPages}
          </span>

          <PaginationButton
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next →
          </PaginationButton>
        </div>
      )}

      {/* Total count */}
      <div className="mt-3 text-center text-xs text-[var(--text-secondary)]">
        {total.toLocaleString()} markets total
      </div>
    </div>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3"
        >
          <div className="mb-2 flex items-start gap-2">
            <div className="h-8 w-8 shrink-0 rounded bg-[var(--bg-tertiary)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-14 rounded bg-[var(--bg-tertiary)]" />
              <div className="h-3.5 w-full rounded bg-[var(--bg-tertiary)]" />
              <div className="h-3.5 w-3/4 rounded bg-[var(--bg-tertiary)]" />
            </div>
          </div>
          <div className="mb-2 flex gap-1.5">
            <div className="h-7 flex-1 rounded-md bg-[var(--bg-tertiary)]" />
            <div className="h-7 flex-1 rounded-md bg-[var(--bg-tertiary)]" />
          </div>
          <div className="flex justify-between">
            <div className="h-2.5 w-14 rounded bg-[var(--bg-tertiary)]" />
            <div className="h-2.5 w-10 rounded bg-[var(--bg-tertiary)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
