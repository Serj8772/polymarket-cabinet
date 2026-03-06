/** Wallet connection and authentication component */

import { useState } from "react";
import { useConnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";

import { useWeb3Auth } from "@/hooks/useWeb3Auth";

export function ConnectWallet() {
  const { connect } = useConnect();
  const { isConnected } = useAccount();
  const { authenticate, isAuthenticated } = useWeb3Auth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!isConnected) {
        // Step 1: Connect MetaMask
        connect({ connector: injected() });
      }
    } catch (err) {
      setError("Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await authenticate();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)] p-8 shadow-lg shadow-black/40">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 text-[var(--text-primary)]">Polymarket Cabinet</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Connect your wallet to get started
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg font-medium hover:bg-[color-mix(in_srgb,var(--accent-primary)_90%,black)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Connecting..." : "Connect MetaMask"}
            </button>
          ) : (
            <button
              onClick={handleAuthenticate}
              disabled={isLoading}
              className="px-6 py-3 bg-[var(--accent-green)] text-white rounded-lg font-medium hover:bg-[color-mix(in_srgb,var(--accent-green)_90%,black)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing..." : "Sign & Login"}
            </button>
          )}
        </div>

        {error && (
          <p className="text-[var(--accent-red)] text-sm text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
