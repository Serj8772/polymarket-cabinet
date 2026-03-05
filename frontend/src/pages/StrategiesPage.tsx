/** Strategies page — arbitrage scanner for multi-bracket events */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useArbitrageScan } from "@/hooks/useArbitrageScan";
import type { ArbitrageOpportunity } from "@/types/strategy";

export function StrategiesPage() {
  const [tailThreshold, setTailThreshold] = useState(10);
  const [minBrackets, setMinBrackets] = useState(3);
  const [scanEnabled, setScanEnabled] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useArbitrageScan(
    { tail_threshold: tailThreshold / 100, min_brackets: minBrackets },
    scanEnabled,
  );

  const handleScan = () => {
    if (scanEnabled) {
      refetch();
    } else {
      setScanEnabled(true);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">
        Strategies
      </h2>

      {/* Arbitrage Scanner */}
      <div className="mb-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
        <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          Arbitrage Scanner
        </h3>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Scan multi-bracket events for tail-collecting opportunities. Buy NO on
          low-probability outcomes for small but likely profits.
        </p>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">
              Tail Threshold (%)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={tailThreshold}
              onChange={(e) => setTailThreshold(Number(e.target.value))}
              className="w-24 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-secondary)]">
              Min Brackets
            </label>
            <input
              type="number"
              min={2}
              max={20}
              value={minBrackets}
              onChange={(e) => setMinBrackets(Number(e.target.value))}
              className="w-24 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={isLoading}
            className="rounded bg-[var(--accent-blue)] px-5 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Scanning..." : "Scan Markets"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            Failed to scan: {(error as Error).message}
          </div>
        )}

        {/* Results summary */}
        {data && (
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            Found {data.opportunities.length} opportunities across{" "}
            {data.scanned_events} events (threshold: {tailThreshold}%)
          </p>
        )}
      </div>

      {/* Results table */}
      {data && data.opportunities.length > 0 && (
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px_90px_80px_90px] gap-2 border-b border-[var(--border-color)] px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)]">
            <span>Event</span>
            <span className="text-center">Brackets</span>
            <span className="text-center">Sum YES</span>
            <span className="text-center">Overround</span>
            <span className="text-center">Tails</span>
            <span className="text-right">Best ROI</span>
          </div>

          {/* Rows */}
          {data.opportunities.map((opp) => (
            <OpportunityRow
              key={opp.event_slug}
              opportunity={opp}
              isExpanded={expandedSlug === opp.event_slug}
              onToggle={() =>
                setExpandedSlug(
                  expandedSlug === opp.event_slug ? null : opp.event_slug,
                )
              }
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {data && data.opportunities.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] py-12">
          <span className="mb-3 text-3xl">🔍</span>
          <p className="text-sm text-[var(--text-secondary)]">
            No arbitrage opportunities found. Try adjusting the threshold.
          </p>
        </div>
      )}
    </div>
  );
}

function OpportunityRow({
  opportunity: opp,
  isExpanded,
  onToggle,
}: {
  opportunity: ArbitrageOpportunity;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--border-color)] last:border-b-0">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="grid w-full grid-cols-[1fr_80px_80px_90px_80px_90px] gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--bg-tertiary)]"
      >
        <span className="flex items-center gap-2 truncate text-[var(--text-primary)]">
          {opp.image && (
            <img
              src={opp.image}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          )}
          <span className="truncate">{opp.event_title}</span>
          <span className="text-xs text-[var(--text-secondary)]">
            {isExpanded ? "▲" : "▼"}
          </span>
        </span>
        <span className="text-center text-[var(--text-secondary)]">
          {opp.brackets.length}
        </span>
        <span className="text-center text-[var(--text-secondary)]">
          {opp.sum_yes.toFixed(2)}
        </span>
        <span
          className={`text-center ${opp.overround > 0 ? "text-[var(--accent-red)]" : "text-[var(--accent-green)]"}`}
        >
          {opp.overround > 0 ? "+" : ""}
          {(opp.overround * 100).toFixed(1)}%
        </span>
        <span className="text-center text-[var(--accent-yellow,orange)]">
          {opp.tail_count}
        </span>
        <span className="text-right font-medium text-[var(--accent-green)]">
          +{opp.best_tail_profit.toFixed(1)}%
        </span>
      </button>

      {/* Expanded brackets */}
      {isExpanded && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3">
          <div className="mb-2 grid grid-cols-[1fr_70px_70px_70px_70px] gap-2 text-xs font-medium text-[var(--text-secondary)]">
            <span>Bracket</span>
            <span className="text-center">YES</span>
            <span className="text-center">NO</span>
            <span className="text-center">ROI</span>
            <span className="text-right">Action</span>
          </div>
          {opp.brackets.map((b) => (
            <div
              key={b.market_id}
              className={`grid grid-cols-[1fr_70px_70px_70px_70px] gap-2 rounded px-1 py-1.5 text-sm ${
                b.is_tail ? "bg-[var(--accent-green)]/5" : ""
              }`}
            >
              <span className="truncate text-[var(--text-primary)]">
                {b.is_tail && (
                  <span className="mr-1.5 inline-block rounded bg-[var(--accent-green)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-green)]">
                    TAIL
                  </span>
                )}
                {b.question}
              </span>
              <span className="text-center text-[var(--text-secondary)]">
                {(b.yes_price * 100).toFixed(1)}c
              </span>
              <span className="text-center text-[var(--text-secondary)]">
                {(b.no_price * 100).toFixed(1)}c
              </span>
              <span
                className={`text-center ${b.is_tail ? "font-medium text-[var(--accent-green)]" : "text-[var(--text-secondary)]"}`}
              >
                {b.is_tail ? `+${b.profit_pct.toFixed(1)}%` : "-"}
              </span>
              <span className="text-right">
                <Link
                  to={`/markets/${b.market_id}`}
                  className="text-xs text-[var(--accent-blue)] hover:underline"
                >
                  View
                </Link>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
