/** Position card — displays a single market position with P&L + trading controls */

import { useState } from "react";
import type { Position } from "@/types/portfolio";
import {
  useMarketSell,
  useSetTakeProfit,
  useCancelTakeProfit,
  useSetStopLoss,
  useRemoveStopLoss,
} from "@/hooks/useTrading";

function formatUSD(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  const pnlPositive = position.unrealized_pnl >= 0;
  const pnlColor = pnlPositive
    ? "text-[var(--accent-green)]"
    : "text-[var(--accent-red)]";

  // Trading state
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [tpInput, setTpInput] = useState("");
  const [slInput, setSlInput] = useState("");
  const [showTpForm, setShowTpForm] = useState(false);
  const [showSlForm, setShowSlForm] = useState(false);

  // Trading mutations
  const sellMutation = useMarketSell();
  const tpMutation = useSetTakeProfit();
  const cancelTpMutation = useCancelTakeProfit();
  const slMutation = useSetStopLoss();
  const removeSlMutation = useRemoveStopLoss();

  const isTrading =
    sellMutation.isPending ||
    tpMutation.isPending ||
    cancelTpMutation.isPending ||
    slMutation.isPending ||
    removeSlMutation.isPending;

  const polymarketUrl = position.market_slug
    ? `https://polymarket.com/event/${position.market_slug}`
    : null;

  function handleSell() {
    sellMutation.mutate(
      { position_id: position.id },
      { onSuccess: () => setShowSellConfirm(false) },
    );
  }

  function handleSetTp() {
    const price = parseFloat(tpInput);
    if (isNaN(price) || price <= 0 || price >= 1) return;
    tpMutation.mutate(
      { position_id: position.id, price },
      {
        onSuccess: () => {
          setTpInput("");
          setShowTpForm(false);
        },
      },
    );
  }

  function handleCancelTp() {
    cancelTpMutation.mutate(position.id);
  }

  function handleSetSl() {
    const price = parseFloat(slInput);
    if (isNaN(price) || price <= 0 || price >= 1) return;
    slMutation.mutate(
      { position_id: position.id, price },
      {
        onSuccess: () => {
          setSlInput("");
          setShowSlForm(false);
        },
      },
    );
  }

  function handleRemoveSl() {
    removeSlMutation.mutate(position.id);
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 transition-all hover:border-[var(--accent-blue)]">
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        {position.market_image && (
          <img
            src={position.market_image}
            alt=""
            className="h-10 w-10 shrink-0 rounded-md object-cover"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <span
            className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              position.outcome.toLowerCase() === "yes"
                ? "bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] text-[var(--accent-green)]"
                : "bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)]"
            }`}
          >
            {position.outcome}
          </span>
          {polymarketUrl ? (
            <a
              href={polymarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)] hover:text-[var(--accent-blue)]"
            >
              {position.market_question || position.market_id}
            </a>
          ) : (
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
              {position.market_question || position.market_id}
            </h3>
          )}
        </div>
      </div>

      {/* Values grid */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-[var(--bg-tertiary)] px-2 py-1.5">
          <span className="text-[var(--text-secondary)]">Shares</span>
          <div className="font-medium text-[var(--text-primary)]">
            {position.size.toFixed(2)}
          </div>
        </div>
        <div className="rounded-md bg-[var(--bg-tertiary)] px-2 py-1.5">
          <span className="text-[var(--text-secondary)]">Buy Price</span>
          <div className="font-medium text-[var(--text-primary)]">
            {(position.avg_price * 100).toFixed(1)}¢
          </div>
        </div>
        <div className="rounded-md bg-[var(--bg-tertiary)] px-2 py-1.5">
          <span className="text-[var(--text-secondary)]">Now</span>
          <div className={`font-medium ${
            position.current_price != null && position.current_price > position.avg_price
              ? "text-[var(--accent-green)]"
              : position.current_price != null && position.current_price < position.avg_price
                ? "text-[var(--accent-red)]"
                : "text-[var(--text-primary)]"
          }`}>
            {position.current_price != null
              ? `${(position.current_price * 100).toFixed(1)}¢`
              : "—"}
          </div>
        </div>
        <div className="rounded-md bg-[var(--bg-tertiary)] px-2 py-1.5">
          <span className="text-[var(--text-secondary)]">Cost</span>
          <div className="font-medium text-[var(--text-primary)]">
            {formatUSD(position.cost_basis)}
          </div>
        </div>
        <div className="col-span-2 rounded-md bg-[var(--bg-tertiary)] px-2 py-1.5">
          <span className="text-[var(--text-secondary)]">Value</span>
          <div className="font-medium text-[var(--text-primary)]">
            {formatUSD(position.current_value)}
          </div>
        </div>
      </div>

      {/* P&L */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-xs text-[var(--text-secondary)]">P&L </span>
          <span className={`text-sm font-bold ${pnlColor}`}>
            {pnlPositive ? "+" : ""}
            {formatUSD(position.unrealized_pnl)}
          </span>
        </div>
        <span className={`text-xs font-medium ${pnlColor}`}>
          {pnlPositive ? "+" : ""}
          {position.pnl_percent.toFixed(1)}%
        </span>
      </div>

      {/* TP/SL Status Badges */}
      {(position.take_profit_price || position.stop_loss_price) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {position.take_profit_price && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--accent-green)_12%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-green)]">
              TP {(position.take_profit_price * 100).toFixed(0)}¢
              <button
                onClick={handleCancelTp}
                disabled={isTrading}
                className="ml-0.5 hover:opacity-70"
                title="Cancel TP"
              >
                ✕
              </button>
            </span>
          )}
          {position.stop_loss_price && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--accent-red)_12%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-red)]">
              SL {(position.stop_loss_price * 100).toFixed(0)}¢
              <button
                onClick={handleRemoveSl}
                disabled={isTrading}
                className="ml-0.5 hover:opacity-70"
                title="Remove SL"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}

      {/* Trading Controls */}
      <div className="mt-auto space-y-2 border-t border-[var(--border-color)] pt-3">
        {/* Sell button / confirm */}
        {showSellConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">
              Sell all at market?
            </span>
            <button
              onClick={handleSell}
              disabled={isTrading}
              className="rounded bg-[var(--accent-red)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {sellMutation.isPending ? "Selling..." : "Confirm"}
            </button>
            <button
              onClick={() => setShowSellConfirm(false)}
              className="rounded bg-[var(--bg-tertiary)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:opacity-80"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowSellConfirm(true)}
              disabled={isTrading}
              className="flex-1 rounded bg-[var(--accent-red)] px-2 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Sell
            </button>
            {!position.take_profit_price && (
              <button
                onClick={() => {
                  setShowTpForm(!showTpForm);
                  setShowSlForm(false);
                }}
                disabled={isTrading}
                className="flex-1 rounded bg-[color-mix(in_srgb,var(--accent-green)_15%,var(--bg-tertiary))] px-2 py-1.5 text-xs font-medium text-[var(--accent-green)] hover:opacity-90 disabled:opacity-50"
              >
                TP
              </button>
            )}
            {!position.stop_loss_price && (
              <button
                onClick={() => {
                  setShowSlForm(!showSlForm);
                  setShowTpForm(false);
                }}
                disabled={isTrading}
                className="flex-1 rounded bg-[color-mix(in_srgb,var(--accent-red)_15%,var(--bg-tertiary))] px-2 py-1.5 text-xs font-medium text-[var(--accent-red)] hover:opacity-90 disabled:opacity-50"
              >
                SL
              </button>
            )}
          </div>
        )}

        {/* TP Form */}
        {showTpForm && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="0.99"
              value={tpInput}
              onChange={(e) => setTpInput(e.target.value)}
              placeholder="TP price (0.01-0.99)"
              className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
            />
            <button
              onClick={handleSetTp}
              disabled={isTrading || !tpInput}
              className="shrink-0 rounded bg-[var(--accent-green)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {tpMutation.isPending ? "..." : "Set"}
            </button>
          </div>
        )}

        {/* SL Form */}
        {showSlForm && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="0.99"
              value={slInput}
              onChange={(e) => setSlInput(e.target.value)}
              placeholder="SL price (0.01-0.99)"
              className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-red)]"
            />
            <button
              onClick={handleSetSl}
              disabled={isTrading || !slInput}
              className="shrink-0 rounded bg-[var(--accent-red)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {slMutation.isPending ? "..." : "Set"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
