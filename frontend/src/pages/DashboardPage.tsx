/** Dashboard — portfolio summary cards + positions table with inline SL/TP */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  useSetStopLoss,
  useRemoveStopLoss,
  useSetTakeProfit,
  useCancelTakeProfit,
} from "@/hooks/useTrading";
import type { Position } from "@/types/portfolio";

/* ─── Formatters ──────────────────────────────────────── */

function fmtUSD(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtUSD2(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function fmtPct(v: number): string {
  const s = v >= 0 ? "+" : "";
  return `${s}${v.toFixed(1)}%`;
}

function fmtCents(v: number): string {
  return `${(v * 100).toFixed(1)}\u00A2`;
}

/* ─── Main Component ──────────────────────────────────── */

export function DashboardPage() {
  const { jwt, proxyWallet } = useAuthStore();
  const portfolio = usePortfolio();
  const p = portfolio.data;
  const isLoading = portfolio.isLoading;

  // Sort positions by P&L descending
  const sorted = useMemo(() => {
    if (!p?.positions) return [];
    return [...p.positions].sort((a, b) => b.unrealized_pnl - a.unrealized_pnl);
  }, [p?.positions]);

  const totalValue = p ? p.total_value + p.cash_balance : 0;

  /* ─── Unauthenticated state ─── */
  if (!jwt) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div
          className="grid h-16 w-16 place-items-center rounded-2xl text-2xl font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--accent), #a06040)" }}
        >
          P
        </div>
        <h1 className="mt-5 text-[24px] font-bold" style={{ color: "var(--text-1)" }}>
          Polymarket Cabinet
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-3)" }}>
          Connect your wallet to view portfolio, positions, and analytics
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* CTA Banner — no proxy wallet */}
      {!proxyWallet && (
        <div
          className="mb-6 flex items-center justify-between rounded-[var(--r-l)] border p-4"
          style={{
            borderColor: "rgba(219,162,85,.2)",
            background: "rgba(219,162,85,.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#128268;</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                Add your Polymarket wallet
              </p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                Enter your proxy wallet address in Settings to see live portfolio data
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className="shrink-0 rounded-[var(--r-s)] px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* ═══ Summary Cards ═══ */}
      <div
        className="summary-grid mb-7 grid gap-4"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Left — Portfolio card */}
        <div
          className="overflow-hidden rounded-[var(--r-l)]"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div className="px-7 pt-6 pb-5">
            <div className="card-left-top mb-5 flex items-end justify-between">
              <div>
                <div className="mb-1 text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
                  Portfolio Value
                </div>
                {isLoading ? (
                  <div className="h-9 w-36 animate-pulse rounded" style={{ background: "var(--bg-3)" }} />
                ) : (
                  <>
                    <div className="cl-val-big text-[30px] font-bold leading-tight" style={{ letterSpacing: "-.7px" }}>
                      {fmtUSD(totalValue)}
                    </div>
                    {p && (
                      <div
                        className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold"
                        style={{ color: p.total_unrealized_pnl >= 0 ? "var(--green)" : "var(--red)" }}
                      >
                        <svg className="h-3 w-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={
                              p.total_unrealized_pnl >= 0
                                ? "M4.5 19.5l15-15"
                                : "M4.5 4.5l15 15"
                            }
                          />
                        </svg>
                        {p.total_unrealized_pnl >= 0 ? "+" : ""}
                        {fmtUSD2(p.total_unrealized_pnl)} ({fmtPct(p.total_pnl_percent)})
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <div
                  className="card-cash-label mb-1 text-right text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-3)" }}
                >
                  Available to trade
                </div>
                {isLoading ? (
                  <div className="ml-auto h-7 w-24 animate-pulse rounded" style={{ background: "var(--bg-3)" }} />
                ) : (
                  <div
                    className="card-cash-val cl-cash-val-big text-right text-[22px] font-bold leading-tight"
                    style={{ letterSpacing: "-.4px" }}
                  >
                    {fmtUSD(p?.cash_balance ?? 0)}
                  </div>
                )}
              </div>
            </div>
            <div className="h-px" style={{ background: "var(--border-s)" }} />
            <div className="cl-stats-row flex pt-3.5">
              <StatCell label="Positions" value={isLoading ? null : String(p?.positions_count ?? 0)} />
              <StatCell label="Invested" value={isLoading ? null : fmtUSD(p?.total_cost ?? 0)} />
              <StatCell
                label="Unrealized P&L"
                value={isLoading ? null : `${p && p.total_unrealized_pnl >= 0 ? "+" : ""}${fmtUSD2(p?.total_unrealized_pnl ?? 0)}`}
                color={p && p.total_unrealized_pnl >= 0 ? "var(--green)" : "var(--red)"}
              />
            </div>
          </div>
        </div>

        {/* Right — P&L Chart card */}
        <div
          className="flex flex-col overflow-hidden rounded-[var(--r-l)]"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div className="px-7 pt-6">
            <div className="mb-1.5 flex items-start justify-between">
              <div>
                <div className="mb-1 text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
                  Profit / Loss
                </div>
                {isLoading ? (
                  <div className="h-8 w-28 animate-pulse rounded" style={{ background: "var(--bg-3)" }} />
                ) : (
                  <>
                    <div
                      className="cr-val-big text-[26px] font-bold leading-tight"
                      style={{
                        letterSpacing: "-.5px",
                        color: (p?.total_unrealized_pnl ?? 0) >= 0 ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {(p?.total_unrealized_pnl ?? 0) >= 0 ? "+" : ""}
                      {fmtUSD2(p?.total_unrealized_pnl ?? 0)}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
                      All time
                    </div>
                  </>
                )}
              </div>
              <div className="flex self-start rounded-[var(--r-s)] p-0.5" style={{ background: "var(--bg-2)" }}>
                {["1W", "1M", "ALL"].map((tab, i) => (
                  <button
                    key={tab}
                    className="rounded border-none px-2.5 py-0.5 text-[10.5px] font-semibold"
                    style={{
                      fontFamily: "var(--font)",
                      background: i === 2 ? "var(--accent)" : "transparent",
                      color: i === 2 ? "#fff" : "var(--text-3)",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Sparkline placeholder */}
          <svg
            className="mt-auto block w-full"
            viewBox="0 0 300 70"
            preserveAspectRatio="none"
            style={{ minHeight: 56 }}
          >
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c47b5a" />
                <stop offset="50%" stopColor="#d4956e" />
                <stop offset="100%" stopColor="#e0b090" />
              </linearGradient>
              <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c47b5a" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#c47b5a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path
              d="M0,48 C20,50 35,52 55,50 C75,48 85,42 105,44 C125,46 135,50 155,52 C170,53 180,38 200,30 C220,22 235,26 255,24 C270,22 280,16 295,18 L300,18 L300,70 L0,70Z"
              fill="url(#fg)"
            />
            <path
              d="M0,48 C20,50 35,52 55,50 C75,48 85,42 105,44 C125,46 135,50 155,52 C170,53 180,38 200,30 C220,22 235,26 255,24 C270,22 280,16 295,18 L300,18"
              fill="none"
              stroke="url(#lg)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ═══ Positions Table ═══ */}
      <div
        className="tbl-wrap overflow-x-auto rounded-[var(--r-l)]"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        {isLoading ? (
          <SkeletonTable />
        ) : sorted.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: "var(--text-3)" }}>
            No positions yet. Sync your portfolio to get started.
          </div>
        ) : (
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "auto" }} />
              <col style={{ width: 64 }} />
              <col style={{ width: 76 }} />
              <col className="hide-mobile" style={{ width: 100 }} />
              <col style={{ width: 72 }} />
              <col style={{ width: 72 }} />
              <col style={{ width: 92 }} />
              <col style={{ width: 36 }} />
            </colgroup>
            <thead>
              <tr>
                <TH first>Market</TH>
                <TH align="right">Shares</TH>
                <TH align="right">Value</TH>
                <TH align="right" className="hide-mobile">Avg / Now</TH>
                <TH align="center">SL</TH>
                <TH align="center">TP</TH>
                <TH align="right">P&L</TH>
                <TH last />
              </tr>
            </thead>
            <tbody>
              {sorted.map((pos) => (
                <PositionRow key={pos.id} pos={pos} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── Table Header Cell ───────────────────────────────── */

function TH({
  children,
  align,
  first,
  last,
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  first?: boolean;
  last?: boolean;
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap select-none border-b py-2.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}
      style={{
        color: "var(--text-3)",
        borderColor: "var(--border)",
        textAlign: align || "left",
        padding: `10px ${last ? 20 : 12}px 10px ${first ? 20 : 12}px`,
      }}
    >
      {children}
    </th>
  );
}

/* ─── Stat Cell (portfolio card bottom row) ───────────── */

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string | null;
  color?: string;
}) {
  return (
    <div className="relative flex-1 text-center">
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
        {label}
      </div>
      {value === null ? (
        <div className="mx-auto h-5 w-14 animate-pulse rounded" style={{ background: "var(--bg-3)" }} />
      ) : (
        <div className="text-[15px] font-bold" style={{ letterSpacing: "-.2px", color: color || "var(--text-1)" }}>
          {value}
        </div>
      )}
    </div>
  );
}

/* ─── Position Row ────────────────────────────────────── */

function PositionRow({ pos }: { pos: Position }) {
  const isProfit = pos.unrealized_pnl >= 0;
  const polyLink = pos.market_slug
    ? `https://polymarket.com/event/${pos.market_slug}`
    : null;

  return (
    <tr className="transition-colors duration-75 hover:bg-white/[.018]">
      {/* Market */}
      <td className="border-b py-2.5" style={{ borderColor: "var(--border)", padding: "10px 12px 10px 20px" }}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--r-s)] text-xs"
            style={{ background: "var(--bg-3)", color: "var(--text-2)" }}
          >
            {pos.market_image ? (
              <img src={pos.market_image} alt="" className="h-7 w-7 rounded-[var(--r-s)] object-cover" />
            ) : (
              "?"
            )}
          </div>
          <div className="min-w-0">
            <div
              className="truncate text-[12.5px] font-medium leading-tight"
              style={{ color: "var(--text-1)" }}
            >
              {pos.market_question || pos.market_id.slice(0, 20)}
            </div>
            <div
              className="mt-0.5 text-[10px] font-semibold"
              style={{ color: pos.outcome === "Yes" ? "var(--green)" : "var(--red)" }}
            >
              {pos.outcome?.toUpperCase()}
            </div>
          </div>
        </div>
      </td>

      {/* Shares */}
      <TD align="right">{pos.size.toLocaleString("en-US", { maximumFractionDigits: 0 })}</TD>

      {/* Value */}
      <TD align="right" bold>
        {fmtUSD(pos.current_value)}
      </TD>

      {/* Avg / Now */}
      <TD align="right" dim className="hide-mobile">
        {fmtCents(pos.avg_price)} &rarr; {fmtCents(pos.current_price ?? pos.avg_price)}
      </TD>

      {/* SL */}
      <td className="border-b" style={{ borderColor: "var(--border)", padding: "10px 12px" }}>
        <SLTPCell positionId={pos.id} type="sl" value={pos.stop_loss_price} />
      </td>

      {/* TP */}
      <td className="border-b" style={{ borderColor: "var(--border)", padding: "10px 12px" }}>
        <SLTPCell positionId={pos.id} type="tp" value={pos.take_profit_price} />
      </td>

      {/* P&L */}
      <td className="border-b text-right" style={{ borderColor: "var(--border)", padding: "10px 12px" }}>
        <div
          className="text-[12.5px] font-semibold leading-tight"
          style={{ color: isProfit ? "var(--green)" : "var(--red)" }}
        >
          {isProfit ? "+" : ""}{fmtUSD2(pos.unrealized_pnl)}
        </div>
        <div className="mt-0.5 text-[10px] font-medium" style={{ color: "var(--text-3)" }}>
          {fmtPct(pos.pnl_percent)}
        </div>
      </td>

      {/* Link */}
      <td className="border-b py-2.5" style={{ borderColor: "var(--border)", padding: "10px 20px 10px 12px" }}>
        <div className="grid place-items-center">
          {polyLink ? (
            <a
              href={polyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-6 w-6 place-items-center rounded-[var(--r-s)] transition-colors hover:bg-[rgba(108,163,212,.08)]"
              style={{ color: "var(--text-3)" }}
            >
              <svg className="h-[11px] w-[11px] fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </a>
          ) : (
            <span style={{ color: "var(--text-3)" }}>—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── Generic Table Data Cell ─────────────────────────── */

function TD({
  children,
  align,
  bold,
  dim,
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  bold?: boolean;
  dim?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap border-b text-[12.5px] ${bold ? "font-semibold" : ""} ${className}`}
      style={{
        padding: "10px 12px",
        borderColor: "var(--border)",
        textAlign: align || "left",
        color: dim ? "var(--text-2)" : "var(--text-1)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </td>
  );
}

/* ─── SL/TP Inline Edit Cell ──────────────────────────── */

function SLTPCell({
  positionId,
  type,
  value,
}: {
  positionId: string;
  type: "sl" | "tp";
  value: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const setSL = useSetStopLoss();
  const removeSL = useRemoveStopLoss();
  const setTP = useSetTakeProfit();
  const cancelTP = useCancelTakeProfit();

  const isSL = type === "sl";

  const startEdit = useCallback(() => {
    setInputVal(value ? String(Math.round(value * 100)) : "");
    setEditing(true);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    const v = inputVal.trim();
    setEditing(false);
    if (!v || isNaN(Number(v)) || Number(v) <= 0) return;
    const price = Number(v) / 100;
    if (isSL) {
      setSL.mutate({ position_id: positionId, price });
    } else {
      setTP.mutate({ position_id: positionId, price });
    }
  }, [inputVal, isSL, positionId, setSL, setTP]);

  const handleRemove = useCallback(() => {
    if (isSL) {
      removeSL.mutate(positionId);
    } else {
      cancelTP.mutate(positionId);
    }
  }, [isSL, positionId, removeSL, cancelTP]);

  if (editing) {
    return (
      <div className="flex items-center justify-center">
        <input
          ref={inputRef}
          className="sltp-input"
          value={inputVal}
          placeholder="0"
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              inputRef.current?.blur();
            }
            if (e.key === "Escape") {
              setInputVal("");
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  if (value != null && value > 0) {
    return (
      <div className="group flex items-center justify-center gap-1" style={{ minHeight: 28 }}>
        <span
          onClick={startEdit}
          className="cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors hover:bg-[var(--bg-3)]"
          style={{ color: isSL ? "var(--red)" : "var(--green)" }}
        >
          {Math.round(value * 100)}&cent;
        </span>
        <button
          onClick={handleRemove}
          className="grid h-4 w-4 shrink-0 place-items-center rounded border-none bg-transparent p-0 opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--red-d)]"
          style={{ color: "var(--text-3)" }}
          title="Remove"
        >
          <svg className="h-2.5 w-2.5 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 28 }}>
      <span
        onClick={startEdit}
        className="cursor-pointer rounded px-1.5 py-0.5 text-[11px] transition-colors"
        style={{
          color: "var(--text-3)",
          border: "1px dashed rgba(255,255,255,.08)",
        }}
      >
        + set
      </span>
    </div>
  );
}

/* ─── Skeleton Table ──────────────────────────────────── */

function SkeletonTable() {
  return (
    <div className="p-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="mb-3 flex animate-pulse items-center gap-4">
          <div className="h-7 w-7 rounded" style={{ background: "var(--bg-3)" }} />
          <div className="h-4 flex-1 rounded" style={{ background: "var(--bg-3)" }} />
          <div className="h-4 w-14 rounded" style={{ background: "var(--bg-3)" }} />
          <div className="h-4 w-14 rounded" style={{ background: "var(--bg-3)" }} />
          <div className="h-4 w-16 rounded" style={{ background: "var(--bg-3)" }} />
          <div className="h-4 w-12 rounded" style={{ background: "var(--bg-3)" }} />
        </div>
      ))}
    </div>
  );
}
