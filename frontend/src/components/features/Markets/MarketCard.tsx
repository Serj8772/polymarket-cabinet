/** Market card component — compact display of a single market summary */

import { Link } from "react-router-dom";
import type { Market } from "@/types/market";

function formatVolume(v: number | null): string {
  if (v == null) return "$0";
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function getTokenPrices(market: Market) {
  if (!market.tokens || market.tokens.length === 0) {
    return { yes: null, no: null };
  }
  const yesToken = market.tokens.find(
    (t) => t.outcome.toLowerCase() === "yes",
  );
  const noToken = market.tokens.find((t) => t.outcome.toLowerCase() === "no");
  return {
    yes: yesToken?.price ?? null,
    no: noToken?.price ?? null,
  };
}

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const { yes, no } = getTokenPrices(market);

  return (
    <Link
      to={`/markets/${market.id}`}
      className="flex h-full flex-col rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 transition-all hover:border-[var(--accent-blue)] hover:shadow-lg"
    >
      {/* Header: image + category + question */}
      <div className="mb-2 flex items-start gap-2">
        {market.image && (
          <img
            src={market.image}
            alt=""
            className="h-8 w-8 shrink-0 rounded object-cover"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          {market.category && (
            <span className="mb-0.5 inline-block rounded-full bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
              {market.category}
            </span>
          )}
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--text-primary)]">
            {market.question}
          </h3>
        </div>
      </div>

      {/* Price bars */}
      <div className="mb-2 flex gap-1.5">
        <PriceButton label="Yes" price={yes} color="green" />
        <PriceButton label="No" price={no} color="red" />
      </div>

      {/* Footer: volume + status */}
      <div className="mt-auto flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
        <span>Vol {formatVolume(market.volume)}</span>
        {market.closed ? (
          <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-secondary)]">
            Resolved
          </span>
        ) : market.active ? (
          <span className="rounded bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] px-1.5 py-0.5 text-[var(--accent-green)]">
            Active
          </span>
        ) : (
          <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[var(--text-secondary)]">
            Inactive
          </span>
        )}
      </div>
    </Link>
  );
}

function PriceButton({
  label,
  price,
  color,
}: {
  label: string;
  price: number | null;
  color: "green" | "red";
}) {
  const pct = price != null ? `${(price * 100).toFixed(0)}¢` : "—";
  const bgClass =
    color === "green"
      ? "bg-[color-mix(in_srgb,var(--accent-green)_12%,transparent)]"
      : "bg-[color-mix(in_srgb,var(--accent-red)_12%,transparent)]";
  const textClass =
    color === "green" ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]";

  return (
    <div
      className={`flex flex-1 items-center justify-between rounded-md px-2 py-1 ${bgClass}`}
    >
      <span className={`text-[11px] font-medium ${textClass}`}>{label}</span>
      <span className={`text-xs font-bold ${textClass}`}>{pct}</span>
    </div>
  );
}
