/** Portfolio page — user positions with P&L */

import { usePortfolio, useSyncPositions } from "@/hooks/usePortfolio";
import { PortfolioSummary } from "@/components/features/Portfolio/PortfolioSummary";
import { PositionList } from "@/components/features/Portfolio/PositionList";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function PortfolioPage() {
  const { data: portfolio, isLoading, error } = usePortfolio();
  const syncMutation = useSyncPositions();
  const proxyWallet = useAuthStore((s) => s.proxyWallet);

  // Show wallet setup prompt if not linked
  if (error && !isLoading) {
    const isAuthError =
      (error as { response?: { status?: number } }).response?.status === 401 ||
      (error as { response?: { status?: number } }).response?.status === 403;

    if (isAuthError) {
      return (
        <div>
          <h2 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">
            Portfolio
          </h2>
          <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] py-16">
            <svg
              className="mb-4 h-16 w-16 text-[var(--accent-blue)] opacity-60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
              Authentication Required
            </h3>
            <p className="mb-6 max-w-md text-center text-sm text-[var(--text-secondary)]">
              Please reconnect your wallet to access your portfolio.
            </p>
            <Link
              to="/"
              className="rounded-md bg-[var(--accent-blue)] px-6 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Reconnect Wallet
            </Link>
          </div>
        </div>
      );
    }
  }

  // Show empty state with setup instructions when no positions and no proxy wallet
  const hasPositions = portfolio && portfolio.positions.length > 0;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">
        Portfolio
      </h2>

      {/* Summary cards */}
      {portfolio && (
        <PortfolioSummary
          portfolio={portfolio}
          onSync={() => syncMutation.mutate()}
          isSyncing={syncMutation.isPending}
        />
      )}

      {/* Setup prompt when no positions */}
      {!isLoading && !hasPositions && !proxyWallet && (
        <div className="mb-6 flex flex-col items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] py-12">
          <span className="mb-3 text-4xl">🟣</span>
          <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
            Set up your Polymarket Wallet
          </h3>
          <p className="mb-6 max-w-md text-center text-sm text-[var(--text-secondary)]">
            To sync your positions, add your Polymarket proxy wallet address in
            Settings, then click "Sync from Polymarket".
          </p>
          <Link
            to="/settings"
            className="rounded-md bg-[var(--accent-blue)] px-6 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* Position list */}
      <PositionList
        positions={portfolio?.positions ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
