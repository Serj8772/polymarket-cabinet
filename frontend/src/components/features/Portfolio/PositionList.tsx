/** Position list — sortable table of positions with empty/loading states */

import { PositionTable } from "./PositionTable";
import type { Position } from "@/types/portfolio";

interface PositionListProps {
  positions: Position[];
  isLoading: boolean;
}

export function PositionList({ positions, isLoading }: PositionListProps) {
  if (isLoading) {
    return <SkeletonTable />;
  }

  if (positions.length === 0) {
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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="text-lg font-medium">No positions yet</p>
        <p className="text-sm">
          Connect your Polymarket credentials and sync to see your positions
        </p>
      </div>
    );
  }

  return <PositionTable positions={positions} />;
}

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 border-b border-[var(--border-color)] px-4 py-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-[var(--bg-tertiary)]"
            style={{ width: i === 0 ? 120 : 60 }}
          />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 border-b border-[var(--border-color)]/50 px-4 py-3"
        >
          <div className="h-8 w-8 shrink-0 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 flex-1 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-12 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-14 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-14 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-16 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-16 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-20 rounded bg-[var(--bg-tertiary)]" />
        </div>
      ))}
    </div>
  );
}
