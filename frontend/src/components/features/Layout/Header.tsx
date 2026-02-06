/** Header component with wallet info */

import { useWeb3Auth } from "@/hooks/useWeb3Auth";

export function Header() {
  const { wallet, isAuthenticated, logout } = useWeb3Auth();

  const shortAddress = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : "";

  return (
    <header className="h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-6">
      <div />

      <div className="flex items-center gap-4">
        {isAuthenticated && wallet && (
          <>
            <span className="text-sm text-[var(--text-secondary)]">
              {shortAddress}
            </span>
            <button
              onClick={logout}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </header>
  );
}
