/** Market detail page — shows full market info with live prices */

import { useParams, Link } from "react-router-dom";
import { useMarketDetail } from "@/hooks/useMarkets";

function formatVolume(v: number | null): string {
  if (v == null) return "$0";
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function formatDate(d: string | null): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MarketDetailPage() {
  const { marketId } = useParams<{ marketId: string }>();
  const { data: market, isLoading, error } = useMarketDetail(marketId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-48 rounded bg-[var(--bg-tertiary)]" />
        <div className="h-8 w-full rounded bg-[var(--bg-tertiary)]" />
        <div className="flex gap-4">
          <div className="h-24 flex-1 rounded-lg bg-[var(--bg-tertiary)]" />
          <div className="h-24 flex-1 rounded-lg bg-[var(--bg-tertiary)]" />
        </div>
        <div className="h-40 rounded-lg bg-[var(--bg-tertiary)]" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="flex flex-col items-center py-20 text-[var(--text-secondary)]">
        <p className="mb-4 text-lg">Market not found</p>
        <Link
          to="/markets"
          className="text-[var(--accent-blue)] hover:underline"
        >
          ← Back to Markets
        </Link>
      </div>
    );
  }

  const yesToken = market.tokens?.find(
    (t) => t.outcome.toLowerCase() === "yes",
  );
  const noToken = market.tokens?.find(
    (t) => t.outcome.toLowerCase() === "no",
  );

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        to="/markets"
        className="mb-4 inline-block text-sm text-[var(--accent-blue)] hover:underline"
      >
        ← Back to Markets
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        {market.image && (
          <img
            src={market.image}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        )}
        <div>
          {market.category && (
            <span className="mb-1 inline-block rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
              {market.category}
            </span>
          )}
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            {market.question}
          </h1>
          <div className="mt-1 flex gap-4 text-xs text-[var(--text-secondary)]">
            <span>Vol {formatVolume(market.volume)}</span>
            {market.liquidity != null && (
              <span>Liq {formatVolume(market.liquidity)}</span>
            )}
            {market.end_date && (
              <span>Ends {formatDate(market.end_date)}</span>
            )}
            <span>
              {market.closed
                ? "Resolved"
                : market.active
                  ? "Active"
                  : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Price cards */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <PriceCard
          label="Yes"
          price={yesToken?.price}
          midpoint={market.midpoint}
          bestBid={market.best_bid}
          bestAsk={market.best_ask}
          color="green"
        />
        <PriceCard label="No" price={noToken?.price} color="red" />
      </div>

      {/* Description */}
      {market.description && (
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
            Description
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
            {market.description}
          </p>
        </div>
      )}

      {/* Tokens info */}
      {market.tokens && market.tokens.length > 0 && (
        <div className="mt-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Tokens
          </h3>
          <div className="space-y-2">
            {market.tokens.map((token) => (
              <div
                key={token.token_id}
                className="flex items-center justify-between rounded-md bg-[var(--bg-tertiary)] px-3 py-2 text-sm"
              >
                <span className="font-medium text-[var(--text-primary)]">
                  {token.outcome}
                </span>
                <span className="text-[var(--text-secondary)]">
                  {token.price != null
                    ? `${(token.price * 100).toFixed(1)}¢`
                    : "—"}
                </span>
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  {token.token_id.slice(0, 12)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceCard({
  label,
  price,
  midpoint,
  bestBid,
  bestAsk,
  color,
}: {
  label: string;
  price: number | null | undefined;
  midpoint?: number | null;
  bestBid?: number | null;
  bestAsk?: number | null;
  color: "green" | "red";
}) {
  const pct = price != null ? `${(price * 100).toFixed(1)}¢` : "—";
  const bgClass =
    color === "green"
      ? "bg-[color-mix(in_srgb,var(--accent-green)_10%,transparent)]"
      : "bg-[color-mix(in_srgb,var(--accent-red)_10%,transparent)]";
  const textClass =
    color === "green"
      ? "text-[var(--accent-green)]"
      : "text-[var(--accent-red)]";

  return (
    <div
      className={`rounded-lg border border-[var(--border-color)] p-4 ${bgClass}`}
    >
      <div className="mb-1 text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </div>
      <div className={`text-3xl font-bold ${textClass}`}>{pct}</div>
      {midpoint != null && (
        <div className="mt-2 space-y-0.5 text-xs text-[var(--text-secondary)]">
          <div>Midpoint: {(midpoint * 100).toFixed(2)}¢</div>
          {bestBid != null && (
            <div>Best Bid: {(bestBid * 100).toFixed(2)}¢</div>
          )}
          {bestAsk != null && (
            <div>Best Ask: {(bestAsk * 100).toFixed(2)}¢</div>
          )}
        </div>
      )}
    </div>
  );
}
