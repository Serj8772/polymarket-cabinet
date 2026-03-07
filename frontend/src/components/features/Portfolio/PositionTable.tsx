/** Portfolio positions table — sortable by date or P&L, with expandable trading controls */

import { useState, useMemo } from "react";
import type { Position } from "@/types/portfolio";
import {
  useMarketSell,
  useSetTakeProfit,
  useCancelTakeProfit,
  useSetStopLoss,
  useRemoveStopLoss,
} from "@/hooks/useTrading";

type SortField = "synced_at" | "unrealized_pnl";
type SortDir = "asc" | "desc";

function formatUSD(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface PositionTableProps {
  positions: Position[];
}

export function PositionTable({ positions }: PositionTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("synced_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...positions].sort((a, b) => {
      const va =
        sortBy === "synced_at"
          ? new Date(a.synced_at || 0).getTime()
          : a.unrealized_pnl;
      const vb =
        sortBy === "synced_at"
          ? new Date(b.synced_at || 0).getTime()
          : b.unrealized_pnl;
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [positions, sortBy, sortDir]);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  }

  const arrow = (field: SortField) =>
    sortBy === field ? (sortDir === "desc" ? " ↓" : " ↑") : "";

  return (
    <div>
      {/* Sort controls */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-[var(--text-secondary)]">Sort by:</span>
        <button
          onClick={() => toggleSort("synced_at")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            sortBy === "synced_at"
              ? "bg-[var(--accent-primary)] text-white"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Date{arrow("synced_at")}
        </button>
        <button
          onClick={() => toggleSort("unrealized_pnl")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            sortBy === "unrealized_pnl"
              ? "bg-[var(--accent-primary)] text-white"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          P&L{arrow("unrealized_pnl")}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              <th className="px-4 py-3 text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                Market
              </th>
              <th className="px-3 py-3 text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                Side
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                Shares
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                Buy
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                Now
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                Cost
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                Value
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                P&L
              </th>
              <th className="px-3 py-3 text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                TP / SL
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {sorted.map((pos) => {
              const isExpanded = expandedId === pos.id;
              const pnlPositive = pos.unrealized_pnl >= 0;
              const pnlColor = pnlPositive
                ? "text-[var(--accent-green)]"
                : "text-[var(--accent-red)]";
              const polymarketUrl = pos.market_slug
                ? `https://polymarket.com/event/${pos.market_slug}`
                : null;

              return (
                <TableRow
                  key={pos.id}
                  position={pos}
                  isExpanded={isExpanded}
                  pnlColor={pnlColor}
                  pnlPositive={pnlPositive}
                  polymarketUrl={polymarketUrl}
                  onToggle={() =>
                    setExpandedId(isExpanded ? null : pos.id)
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Table Row with expandable trading controls ─── */

function TableRow({
  position: pos,
  isExpanded,
  pnlColor,
  pnlPositive,
  polymarketUrl,
  onToggle,
}: {
  position: Position;
  isExpanded: boolean;
  pnlColor: string;
  pnlPositive: boolean;
  polymarketUrl: string | null;
  onToggle: () => void;
}) {
  const priceChange =
    pos.current_price != null && pos.current_price > pos.avg_price
      ? "text-[var(--accent-green)]"
      : pos.current_price != null && pos.current_price < pos.avg_price
        ? "text-[var(--accent-red)]"
        : "text-[var(--text-primary)]";

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)]/50"
      >
        {/* Market */}
        <td className="max-w-[260px] px-4 py-3">
          <div className="flex items-center gap-2.5">
            {pos.market_image && (
              <img
                src={pos.market_image}
                alt=""
                className="h-8 w-8 shrink-0 rounded object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0">
              {polymarketUrl ? (
                <a
                  href={polymarketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="line-clamp-1 text-[13px] font-medium text-[var(--text-primary)] hover:text-[var(--accent-blue)]"
                >
                  {pos.market_question || pos.market_id}
                </a>
              ) : (
                <span className="line-clamp-1 text-[13px] font-medium text-[var(--text-primary)]">
                  {pos.market_question || pos.market_id}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Outcome */}
        <td className="px-3 py-3">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              pos.outcome.toLowerCase() === "yes"
                ? "bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] text-[var(--accent-green)]"
                : "bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)]"
            }`}
          >
            {pos.outcome}
          </span>
        </td>

        {/* Shares */}
        <td className="px-3 py-3 text-right text-[13px] text-[var(--text-primary)]">
          {pos.size.toFixed(2)}
        </td>

        {/* Buy Price */}
        <td className="px-3 py-3 text-right text-[13px] text-[var(--text-primary)]">
          {(pos.avg_price * 100).toFixed(1)}¢
        </td>

        {/* Current Price */}
        <td className={`px-3 py-3 text-right text-[13px] font-medium ${priceChange}`}>
          {pos.current_price != null
            ? `${(pos.current_price * 100).toFixed(1)}¢`
            : "—"}
        </td>

        {/* Cost */}
        <td className="px-3 py-3 text-right text-[13px] text-[var(--text-primary)]">
          {formatUSD(pos.cost_basis)}
        </td>

        {/* Value */}
        <td className="px-3 py-3 text-right text-[13px] text-[var(--text-primary)]">
          {formatUSD(pos.current_value)}
        </td>

        {/* P&L */}
        <td className="px-3 py-3 text-right">
          <span className={`text-[13px] font-bold ${pnlColor}`}>
            {pnlPositive ? "+" : ""}
            {formatUSD(pos.unrealized_pnl)}
          </span>
          <span className={`ml-1.5 text-[11px] ${pnlColor}`}>
            {pnlPositive ? "+" : ""}
            {pos.pnl_percent.toFixed(1)}%
          </span>
        </td>

        {/* TP/SL */}
        <td className="px-3 py-3">
          <div className="flex flex-wrap gap-1">
            {pos.take_profit_price && (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-green)_12%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-green)]">
                TP {(pos.take_profit_price * 100).toFixed(0)}¢
              </span>
            )}
            {pos.stop_loss_price && (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-red)_12%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-red)]">
                SL {(pos.stop_loss_price * 100).toFixed(0)}¢
              </span>
            )}
          </div>
        </td>

        {/* Date */}
        <td className="px-3 py-3 text-right text-[11px] text-[var(--text-secondary)]">
          {formatDate(pos.synced_at)}
        </td>
      </tr>

      {/* Expanded trading controls */}
      {isExpanded && (
        <tr>
          <td
            colSpan={10}
            className="border-t border-[var(--border-color)]/40 bg-[var(--bg-tertiary)]/30 px-4 py-3"
          >
            <TradingControls position={pos} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Inline Trading Controls ─── */

function TradingControls({ position }: { position: Position }) {
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [tpInput, setTpInput] = useState("");
  const [slInput, setSlInput] = useState("");

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
      { onSuccess: () => setTpInput("") },
    );
  }

  function handleSetSl() {
    const price = parseFloat(slInput);
    if (isNaN(price) || price <= 0 || price >= 1) return;
    slMutation.mutate(
      { position_id: position.id, price },
      { onSuccess: () => setSlInput("") },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sell */}
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
        <button
          onClick={() => setShowSellConfirm(true)}
          disabled={isTrading}
          className="rounded bg-[var(--accent-red)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Sell All
        </button>
      )}

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--border-color)]" />

      {/* TP */}
      {position.take_profit_price ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--accent-green)]">
            TP: {(position.take_profit_price * 100).toFixed(0)}¢
          </span>
          <button
            onClick={() => cancelTpMutation.mutate(position.id)}
            disabled={isTrading}
            className="rounded bg-[var(--bg-tertiary)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent-red)] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="0.99"
            value={tpInput}
            onChange={(e) => setTpInput(e.target.value)}
            placeholder="TP price"
            onClick={(e) => e.stopPropagation()}
            className="w-24 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          />
          <button
            onClick={handleSetTp}
            disabled={isTrading || !tpInput}
            className="rounded bg-[var(--accent-green)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {tpMutation.isPending ? "..." : "Set TP"}
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--border-color)]" />

      {/* SL */}
      {position.stop_loss_price ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--accent-red)]">
            SL: {(position.stop_loss_price * 100).toFixed(0)}¢
          </span>
          <button
            onClick={() => removeSlMutation.mutate(position.id)}
            disabled={isTrading}
            className="rounded bg-[var(--bg-tertiary)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent-red)] disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="0.99"
            value={slInput}
            onChange={(e) => setSlInput(e.target.value)}
            placeholder="SL price"
            onClick={(e) => e.stopPropagation()}
            className="w-24 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-red)]"
          />
          <button
            onClick={handleSetSl}
            disabled={isTrading || !slInput}
            className="rounded bg-[var(--accent-red)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {slMutation.isPending ? "..." : "Set SL"}
          </button>
        </div>
      )}
    </div>
  );
}
