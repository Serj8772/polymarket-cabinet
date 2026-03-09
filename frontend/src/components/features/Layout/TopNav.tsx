/** Horizontal top navigation bar — replaces Sidebar + Header */

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useConnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";
import { useWeb3Auth } from "@/hooks/useWeb3Auth";
import { useSyncPositions } from "@/hooks/usePortfolio";
import { useSyncOrders } from "@/hooks/useOrders";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    to: "/markets",
    label: "Markets",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" />
      </svg>
    ),
  },
  {
    to: "/portfolio",
    label: "Portfolio",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25" />
      </svg>
    ),
  },
  {
    to: "/orders",
    label: "Orders",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12" />
      </svg>
    ),
  },
  {
    to: "/strategies",
    label: "Strategies",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      </svg>
    ),
  },
];

export function TopNav() {
  const { wallet, isAuthenticated, authenticate, logout } = useWeb3Auth();
  const { connect } = useConnect();
  const { isConnected } = useAccount();
  const syncPositions = useSyncPositions();
  const syncOrders = useSyncOrders();

  const [authLoading, setAuthLoading] = useState(false);

  const isSyncing = syncPositions.isPending || syncOrders.isPending;

  const shortAddress = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : "";

  const handleSync = () => {
    if (isSyncing) return;
    syncPositions.mutate();
    syncOrders.mutate();
  };

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await authenticate();
    } catch {
      // error handled by useWeb3Auth
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <nav
      className="sticky top-0 z-50 flex items-center"
      style={{
        height: "var(--nav-h)",
        background: "var(--bg-1)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        className="mx-auto flex h-full w-full items-center gap-8 px-8"
        style={{ maxWidth: "var(--max-w)" }}
      >
        {/* Brand */}
        <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
          <div
            className="grid h-[26px] w-[26px] place-items-center text-[13px] font-bold text-white"
            style={{
              borderRadius: "var(--r-s)",
              background: "linear-gradient(135deg, var(--accent), #a06040)",
            }}
          >
            P
          </div>
          <span className="nav-wordmark text-[14px] font-bold tracking-tight">
            Polymarket
          </span>
        </NavLink>

        {/* Nav links */}
        <div className="flex flex-1 items-center justify-center gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-[var(--r-s)] px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-2)]"
                }`
              }
              style={({ isActive }) =>
                isActive ? { background: "rgba(196,123,90,.09)" } : undefined
              }
            >
              <span className="[&>svg]:h-[15px] [&>svg]:w-[15px] [&>svg]:shrink-0 [&>svg]:fill-none [&>svg]:stroke-current [&>svg]:stroke-[1.7]">
                {item.icon}
              </span>
              <span className="nav-link-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Right section */}
        <div className="flex shrink-0 items-center gap-2.5">
          {isAuthenticated ? (
            <>
              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 rounded-[var(--r-s)] border px-3 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  borderColor: isSyncing
                    ? "rgba(196,123,90,.2)"
                    : "var(--border-s)",
                  background: isSyncing
                    ? "rgba(196,123,90,.08)"
                    : "var(--bg-2)",
                  color: isSyncing ? "var(--accent)" : "var(--text-2)",
                }}
              >
                <svg
                  className={`h-[13px] w-[13px] fill-none stroke-current stroke-2 ${isSyncing ? "syncing-icon" : ""}`}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992"
                  />
                </svg>
                <span className="nav-sync-label">
                  {isSyncing ? "Syncing..." : "Sync"}
                </span>
              </button>

              {/* Wallet address */}
              <span
                className="nav-addr rounded-full px-3 py-1 text-[11px]"
                style={{
                  fontFamily: "var(--mono)",
                  color: "var(--text-3)",
                  background: "var(--bg-2)",
                }}
              >
                {shortAddress}
              </span>

              {/* Disconnect */}
              <button
                onClick={logout}
                className="rounded-[var(--r-s)] border-none bg-transparent px-2 py-1 text-[11px] font-medium text-[var(--text-3)] transition-colors hover:bg-[var(--red-d)] hover:text-[var(--red)]"
              >
                Disconnect
              </button>
            </>
          ) : isConnected ? (
            <button
              onClick={handleSignIn}
              disabled={authLoading}
              className="rounded-[var(--r-s)] px-4 py-1.5 text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "var(--green)" }}
            >
              {authLoading ? "Signing..." : "Sign In"}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="rounded-[var(--r-s)] px-4 py-1.5 text-[12px] font-semibold text-white transition-colors"
              style={{ background: "var(--accent)" }}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
