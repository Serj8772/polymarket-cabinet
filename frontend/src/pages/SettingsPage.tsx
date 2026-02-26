/** Settings page — Polymarket wallet, API credentials, wallet info */

import { useState } from "react";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/authStore";
import { savePolymarketCreds, saveProxyWallet, savePrivateKey } from "@/services/api/auth";

export function SettingsPage() {
  const { wallet, proxyWallet, hasPolymarketCreds, hasPrivateKey, setHasPolymarketCreds, setHasPrivateKey, setProxyWallet } =
    useAuthStore();

  // Proxy wallet form
  const [proxyInput, setProxyInput] = useState("");
  const [savingProxy, setSavingProxy] = useState(false);

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(proxyInput.trim());
  const canSubmitProxy = isValidAddress && !savingProxy;

  async function handleSaveProxy(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitProxy) return;

    setSavingProxy(true);
    try {
      const user = await saveProxyWallet({ proxy_wallet: proxyInput.trim() });
      setProxyWallet(user.proxy_wallet);
      setProxyInput("");
      toast.success("Polymarket wallet address saved!");
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { detail?: string } };
      };
      const message =
        error.response?.data?.detail || "Failed to save wallet address";
      toast.error(message);
    } finally {
      setSavingProxy(false);
    }
  }

  // Private key form
  const [pkInput, setPkInput] = useState("");
  const [savingPk, setSavingPk] = useState(false);

  const isValidPk = /^(0x)?[a-fA-F0-9]{64}$/.test(pkInput.trim());
  const canSubmitPk = isValidPk && !savingPk;

  async function handleSavePk(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitPk) return;

    setSavingPk(true);
    try {
      const user = await savePrivateKey({ private_key: pkInput.trim() });
      setHasPrivateKey(user.has_private_key);
      setPkInput("");
      toast.success("Trading key saved successfully!");
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { detail?: string } };
      };
      const message =
        error.response?.data?.detail || "Failed to save trading key";
      toast.error(message);
    } finally {
      setSavingPk(false);
    }
  }

  // API credentials form
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit =
    apiKey.trim() !== "" &&
    apiSecret.trim() !== "" &&
    passphrase.trim() !== "" &&
    !saving;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      await savePolymarketCreds({
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        passphrase: passphrase.trim(),
      });
      setHasPolymarketCreds(true);
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      toast.success("Polymarket credentials saved successfully!");
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { detail?: string } };
      };
      const message =
        error.response?.data?.detail || "Failed to save credentials";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        Settings
      </h2>

      {/* Wallet Info */}
      <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Wallet
          </h3>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-green)]">
            Connected
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-lg">
            🦊
          </div>
          <div>
            <p className="font-mono text-sm text-[var(--text-primary)]">
              {wallet || "Not connected"}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              MetaMask Wallet
            </p>
          </div>
        </div>
      </section>

      {/* Polymarket Wallet Address */}
      <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Polymarket Wallet
          </h3>
          {proxyWallet ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-green)]">
              Connected
            </span>
          ) : (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-orange)_15%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-orange)]">
              Not configured
            </span>
          )}
        </div>

        {proxyWallet ? (
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-lg">
                🟣
              </div>
              <div>
                <p className="font-mono text-sm text-[var(--text-primary)]">
                  {proxyWallet}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Polymarket Proxy Wallet (Polygon)
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Your portfolio positions will be synced from this address. Enter a new address below to update.
            </p>
          </div>
        ) : (
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            Polymarket uses a separate proxy wallet on Polygon to hold your positions.
            To sync your portfolio, enter your Polymarket wallet address below.
            You can find it at{" "}
            <a
              href="https://polymarket.com/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-blue)] hover:underline"
            >
              polymarket.com/profile
            </a>
            {" "}— look for the address shown under your username.
          </p>
        )}

        <form onSubmit={handleSaveProxy} className="space-y-4">
          <div>
            <label
              htmlFor="proxy-wallet"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Polymarket Wallet Address
            </label>
            <input
              id="proxy-wallet"
              type="text"
              value={proxyInput}
              onChange={(e) => setProxyInput(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
              autoComplete="off"
            />
            {proxyInput.trim() !== "" && !isValidAddress && (
              <p className="mt-1 text-xs text-[var(--accent-red)]">
                Please enter a valid Ethereum address (0x + 40 hex characters)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmitProxy}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingProxy ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save Wallet Address"
            )}
          </button>
        </form>
      </section>

      {/* Trading Key (Private Key) */}
      <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Trading Key
          </h3>
          {hasPrivateKey ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-green)]">
              Saved
            </span>
          ) : (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-orange)_15%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-orange)]">
              Not configured
            </span>
          )}
        </div>

        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          {hasPrivateKey
            ? "Your trading key is saved and encrypted. Submit a new key below to update it."
            : "Required for placing orders (market sell, take profit). Your private key is encrypted with Fernet (AES-128-CBC) before storage and never exposed."}
        </p>

        <form onSubmit={handleSavePk} className="space-y-4">
          <div>
            <label
              htmlFor="private-key"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Wallet Private Key
            </label>
            <input
              id="private-key"
              type="password"
              value={pkInput}
              onChange={(e) => setPkInput(e.target.value)}
              placeholder="64 hex characters (with or without 0x prefix)"
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
              autoComplete="off"
            />
            {pkInput.trim() !== "" && !isValidPk && (
              <p className="mt-1 text-xs text-[var(--accent-red)]">
                Please enter a valid private key (64 hex characters, optional 0x prefix)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmitPk}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingPk ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save Trading Key"
            )}
          </button>
        </form>
      </section>

      {/* Polymarket API Credentials */}
      <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Polymarket API Credentials
          </h3>
          {hasPolymarketCreds ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-green)]">
              Connected
            </span>
          ) : (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-orange)_15%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-orange)]">
              Optional
            </span>
          )}
        </div>

        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          {hasPolymarketCreds
            ? "Your Polymarket API credentials are saved. Submit new values below to update them."
            : "API credentials are optional — they are only needed for placing orders and viewing order history. Portfolio sync works without them."}
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          {/* API Key */}
          <div>
            <label
              htmlFor="api-key"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Polymarket API key"
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
              autoComplete="off"
            />
          </div>

          {/* API Secret */}
          <div>
            <label
              htmlFor="api-secret"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              API Secret
            </label>
            <input
              id="api-secret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Base64-encoded secret"
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
              autoComplete="off"
            />
          </div>

          {/* Passphrase */}
          <div>
            <label
              htmlFor="passphrase"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Passphrase
            </label>
            <input
              id="passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="API passphrase"
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--accent-blue)]"
              autoComplete="off"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save Credentials"
            )}
          </button>
        </form>
      </section>

      {/* Info Note */}
      <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
        <h3 className="mb-2 text-base font-semibold text-[var(--text-primary)]">
          How it works
        </h3>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p>
            <strong>Polymarket Wallet</strong> — Your Polymarket proxy wallet address
            on Polygon. This is where your positions and USDC are held. Required for
            portfolio sync.
          </p>
          <p>
            <strong>Trading Key</strong> — Your wallet private key, used to sign CLOB
            orders (market sell, take profit). Encrypted with Fernet (AES-128-CBC) before
            storage and never exposed. Required for trading.
          </p>
          <p>
            <strong>API Credentials</strong> — Optional L2 API keys for placing orders
            and viewing order history. Encrypted with Fernet (AES-128-CBC) before storage.
          </p>
        </div>
      </section>
    </div>
  );
}
