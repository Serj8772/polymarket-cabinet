/** Dashboard overview page */

import { useWeb3Auth } from "@/hooks/useWeb3Auth";

export function DashboardPage() {
  const { wallet } = useWeb3Auth();

  const shortAddress = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : "";

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Balance Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-5">
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Wallet
          </p>
          <p className="text-lg font-mono">{shortAddress}</p>
        </div>

        {/* Total PnL Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-5">
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Total PnL
          </p>
          <p className="text-lg font-bold text-[var(--text-secondary)]">
            Coming soon
          </p>
        </div>

        {/* Active Positions Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-5">
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Active Positions
          </p>
          <p className="text-lg font-bold text-[var(--text-secondary)]">
            Coming soon
          </p>
        </div>
      </div>

      <p className="text-[var(--text-secondary)]">
        Portfolio and market data will be available in Phase 2 & 3.
      </p>
    </div>
  );
}
