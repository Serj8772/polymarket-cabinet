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
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Polymarket Cabinet</h1>
        <p className="text-[var(--text-secondary)]">
          Connect your wallet to get started
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-6 py-3 bg-[var(--accent-blue)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? "Connecting..." : "Connect MetaMask"}
          </button>
        ) : (
          <button
            onClick={handleAuthenticate}
            disabled={isLoading}
            className="px-6 py-3 bg-[var(--accent-green)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? "Signing..." : "Sign & Login"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-[var(--accent-red)] text-sm">{error}</p>
      )}
    </div>
  );
}
