/** Portfolio summary header — total value, P&L, positions count */

import type { PortfolioResponse } from "@/types/portfolio";

function formatUSD(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

interface PortfolioSummaryProps {
  portfolio: PortfolioResponse;
  onSync: () => void;
  isSyncing: boolean;
}

export function PortfolioSummary({
  portfolio,
  onSync,
  isSyncing,
}: PortfolioSummaryProps) {
  const pnlPositive = portfolio.total_unrealized_pnl >= 0;

  const totalPortfolioValue = portfolio.total_value + portfolio.cash_balance;

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
      {/* Portfolio Value (positions + cash) */}
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
        <div className="text-xs text-[var(--text-secondary)]">Portfolio Value</div>
        <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
          {formatUSD(totalPortfolioValue)}
        </div>
        <div className="mt-1 text-xs text-[var(--text-secondary)]">
          Positions: {formatUSD(portfolio.total_value)}
        </div>
      </div>

      {/* Cash Balance */}
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
        <div className="text-xs text-[var(--text-secondary)]">Cash Balance</div>
        <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
          {formatUSD(portfolio.cash_balance)}
        </div>
        <div className="mt-1 text-xs text-[var(--text-secondary)]">USDC</div>
      </div>

      {/* Unrealized P&L */}
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
        <div className="text-xs text-[var(--text-secondary)]">
          Unrealized P&L
        </div>
        <div
          className={`mt-1 text-2xl font-bold ${
            pnlPositive
              ? "text-[var(--accent-green)]"
              : "text-[var(--accent-red)]"
          }`}
        >
          {pnlPositive ? "+" : ""}
          {formatUSD(portfolio.total_unrealized_pnl)}
        </div>
        <div
          className={`text-xs ${
            pnlPositive
              ? "text-[var(--accent-green)]"
              : "text-[var(--accent-red)]"
          }`}
        >
          {pnlPositive ? "+" : ""}
          {portfolio.total_pnl_percent.toFixed(2)}%
        </div>
      </div>

      {/* Realized P&L */}
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
        <div className="text-xs text-[var(--text-secondary)]">Realized P&L</div>
        <div
          className={`mt-1 text-2xl font-bold ${
            portfolio.total_realized_pnl >= 0
              ? "text-[var(--accent-green)]"
              : "text-[var(--accent-red)]"
          }`}
        >
          {portfolio.total_realized_pnl >= 0 ? "+" : ""}
          {formatUSD(portfolio.total_realized_pnl)}
        </div>
      </div>

      {/* Positions count + Sync */}
      <div className="flex flex-col rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
        <div className="text-xs text-[var(--text-secondary)]">Positions</div>
        <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
          {portfolio.positions_count}
        </div>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="mt-auto rounded-md bg-[var(--accent-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {isSyncing ? "Syncing..." : "Sync from Polymarket"}
        </button>
      </div>
    </div>
  );
}
