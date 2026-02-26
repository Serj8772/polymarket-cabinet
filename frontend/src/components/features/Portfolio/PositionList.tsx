/** Position list — grid of position cards with empty state */

import { PositionCard } from "./PositionCard";
import type { Position } from "@/types/portfolio";

interface PositionListProps {
  positions: Position[];
  isLoading: boolean;
}

export function PositionList({ positions, isLoading }: PositionListProps) {
  if (isLoading) {
    return <SkeletonGrid />;
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {positions.map((position) => (
        <PositionCard key={position.id} position={position} />
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4"
        >
          <div className="mb-3 flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-md bg-[var(--bg-tertiary)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-12 rounded bg-[var(--bg-tertiary)]" />
              <div className="h-4 w-full rounded bg-[var(--bg-tertiary)]" />
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="h-10 rounded-md bg-[var(--bg-tertiary)]" />
            <div className="h-10 rounded-md bg-[var(--bg-tertiary)]" />
            <div className="h-10 rounded-md bg-[var(--bg-tertiary)]" />
            <div className="h-10 rounded-md bg-[var(--bg-tertiary)]" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-20 rounded bg-[var(--bg-tertiary)]" />
            <div className="h-4 w-12 rounded bg-[var(--bg-tertiary)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
