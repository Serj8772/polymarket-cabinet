/** Dashboard overview page — aggregated stats, recent positions & orders */

import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useOrders } from "@/hooks/useOrders";
import type { Position } from "@/types/portfolio";
import type { Order } from "@/types/order";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPnl(value: number, percent: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatCurrency(value)} (${sign}${percent.toFixed(1)}%)`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function DashboardPage() {
  const { wallet, proxyWallet } = useAuthStore();
  const portfolio = usePortfolio();
  const orders = useOrders(undefined, 1, 5);

  const shortAddress = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : "";

  const portfolioData = portfolio.data;
  const ordersData = orders.data;
  const isLoading = portfolio.isLoading || orders.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Dashboard
        </h2>
        <span className="font-mono text-sm text-[var(--text-secondary)]">
          {shortAddress}
        </span>
      </div>

      {/* CTA Banner — no proxy wallet */}
      {!proxyWallet && (
        <div className="flex items-center justify-between rounded-lg border border-[color-mix(in_srgb,var(--accent-orange)_30%,var(--border-color))] bg-[color-mix(in_srgb,var(--accent-orange)_8%,var(--bg-secondary))] p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🟣</span>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Add your Polymarket wallet
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Enter your Polymarket proxy wallet address to see live portfolio
                data
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className="shrink-0 rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Portfolio Value"
          value={
            portfolioData
              ? formatCurrency(
                  portfolioData.total_value + portfolioData.cash_balance,
                )
              : null
          }
          isLoading={isLoading}
          icon="💰"
        />
        <StatCard
          label="Cash Balance"
          value={
            portfolioData ? formatCurrency(portfolioData.cash_balance) : null
          }
          isLoading={isLoading}
          icon="💵"
        />
        <StatCard
          label="Unrealized P&L"
          value={
            portfolioData
              ? formatPnl(
                  portfolioData.total_unrealized_pnl,
                  portfolioData.total_pnl_percent,
                )
              : null
          }
          valueColor={
            portfolioData
              ? portfolioData.total_unrealized_pnl >= 0
                ? "text-[var(--accent-green)]"
                : "text-[var(--accent-red)]"
              : undefined
          }
          isLoading={isLoading}
          icon="📈"
        />
        <StatCard
          label="Active Positions"
          value={
            portfolioData ? String(portfolioData.positions_count) : null
          }
          isLoading={isLoading}
          icon="💼"
        />
        <StatCard
          label="Live Orders"
          value={ordersData ? String(ordersData.total_live) : null}
          isLoading={isLoading}
          icon="📋"
        />
      </div>

      {/* Two-column: Recent Positions + Recent Orders */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Recent Positions */}
        <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Recent Positions
            </h3>
            <Link
              to="/portfolio"
              className="text-xs text-[var(--accent-blue)] hover:underline"
            >
              View all →
            </Link>
          </div>

          {portfolio.isLoading && !portfolioData ? (
            <SkeletonRows count={5} />
          ) : !portfolioData || portfolioData.positions.length === 0 ? (
            <EmptyState message="No positions yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="pb-2 text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                      Market
                    </th>
                    <th className="pb-2 text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                      Outcome
                    </th>
                    <th className="pb-2 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                      Size
                    </th>
                    <th className="pb-2 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                      P&L
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {portfolioData.positions.slice(0, 5).map((pos: Position) => (
                    <tr key={pos.id}>
                      <td className="max-w-[180px] truncate py-2 text-[13px] text-[var(--text-primary)]">
                        {pos.market_question || pos.market_id.slice(0, 12)}
                      </td>
                      <td className="py-2 text-[13px] text-[var(--text-primary)]">
                        {pos.outcome}
                      </td>
                      <td className="py-2 text-right text-[13px] text-[var(--text-primary)]">
                        {pos.size.toFixed(2)}
                      </td>
                      <td
                        className={`py-2 text-right text-[13px] font-medium ${
                          pos.unrealized_pnl >= 0
                            ? "text-[var(--accent-green)]"
                            : "text-[var(--accent-red)]"
                        }`}
                      >
                        {pos.unrealized_pnl >= 0 ? "+" : ""}
                        {formatCurrency(pos.unrealized_pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Orders */}
        <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Recent Orders
            </h3>
            <Link
              to="/orders"
              className="text-xs text-[var(--accent-blue)] hover:underline"
            >
              View all →
            </Link>
          </div>

          {orders.isLoading && !ordersData ? (
            <SkeletonRows count={5} />
          ) : !ordersData || ordersData.orders.length === 0 ? (
            <EmptyState message="No orders yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="pb-2 text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                      Market
                    </th>
                    <th className="pb-2 text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                      Side
                    </th>
                    <th className="pb-2 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                      Price
                    </th>
                    <th className="pb-2 text-center text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                      Status
                    </th>
                    <th className="pb-2 text-right text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {ordersData.orders.slice(0, 5).map((order: Order) => (
                    <tr key={order.id}>
                      <td className="max-w-[160px] truncate py-2 text-[13px] text-[var(--text-primary)]">
                        {order.market_question ||
                          order.market_id.slice(0, 12)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                            order.side === "BUY"
                              ? "bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] text-[var(--accent-green)]"
                              : "bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)]"
                          }`}
                        >
                          {order.side}
                        </span>
                      </td>
                      <td className="py-2 text-right text-[13px] text-[var(--text-primary)]">
                        {(order.price * 100).toFixed(1)}¢
                      </td>
                      <td className="py-2 text-center">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-2 text-right text-[11px] text-[var(--text-secondary)]">
                        {formatDate(order.placed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─── Helper Components ────────────────────────────────── */

function StatCard({
  label,
  value,
  valueColor,
  isLoading,
  icon,
}: {
  label: string;
  value: string | null;
  valueColor?: string;
  isLoading: boolean;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </p>
      </div>
      {isLoading || value === null ? (
        <div className="h-7 w-28 animate-pulse rounded bg-[var(--bg-tertiary)]" />
      ) : (
        <p
          className={`text-lg font-bold ${valueColor || "text-[var(--text-primary)]"}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  let classes = "";
  switch (status) {
    case "LIVE":
      classes =
        "bg-[color-mix(in_srgb,var(--accent-blue)_15%,transparent)] text-[var(--accent-blue)]";
      break;
    case "MATCHED":
      classes =
        "bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] text-[var(--accent-green)]";
      break;
    case "CANCELLED":
      classes =
        "bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)]";
      break;
    default:
      classes = "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  }
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${classes}`}
    >
      {status}
    </span>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-3 flex-1 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-10 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-12 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-14 rounded bg-[var(--bg-tertiary)]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-sm text-[var(--text-secondary)]">
      {message}
    </div>
  );
}
