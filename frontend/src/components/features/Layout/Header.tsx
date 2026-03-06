/** Header component with wallet info */

import { useWeb3Auth } from "@/hooks/useWeb3Auth";

export function Header() {
  const { wallet, isAuthenticated, logout } = useWeb3Auth();

  const shortAddress = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : "";

  return (
    <header className="h-14 bg-[var(--bg-secondary)]/50 backdrop-blur-sm flex items-center justify-end px-6" style={{ boxShadow: '0 1px 0 var(--border-color)' }}>
      <div className="flex items-center gap-3">
        {isAuthenticated && wallet && (
          <>
            <span className="inline-flex items-center rounded-full bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-mono text-[var(--text-secondary)]">
              {shortAddress}
            </span>
            <button
              onClick={logout}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors rounded-lg px-2.5 py-1.5 hover:bg-[var(--accent-red)]/8"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </header>
  );
}
