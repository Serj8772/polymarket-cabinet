/** Order table component — tabular display of user orders with actions */

import type { Order } from "@/types/order";

interface OrderTableProps {
  orders: Order[] | undefined;
  isLoading: boolean;
  total?: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEditOrder: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  isCancelling?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number): string {
  return `${(price * 100).toFixed(1)}¢`;
}

function formatSize(size: number): string {
  if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
  return size.toFixed(2);
}

export function OrderTable({
  orders,
  isLoading,
  total = 0,
  page,
  pageSize,
  onPageChange,
  onEditOrder,
  onCancelOrder,
  isCancelling,
}: OrderTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading && !orders) {
    return <SkeletonTable />;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
        <svg
          className="mb-4 h-12 w-12 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium">No orders found</p>
        <p className="text-sm">
          Sync your orders from Polymarket to see them here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Market
              </th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Type
              </th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Side
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Price
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Size
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Filled
              </th>
              <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Status
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Date
              </th>
              <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onEdit={onEditOrder}
                onCancel={onCancelOrder}
                isCancelling={isCancelling}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="px-3 text-xs text-[var(--text-secondary)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* Total count */}
      <div className="mt-2 text-center text-[11px] text-[var(--text-secondary)]">
        {total.toLocaleString()} orders total
      </div>
    </div>
  );
}

function OrderRow({
  order,
  onEdit,
  onCancel,
  isCancelling,
}: {
  order: Order;
  onEdit: (order: Order) => void;
  onCancel: (orderId: string) => void;
  isCancelling?: boolean;
}) {
  const isBuy = order.side === "BUY";
  const isLive = order.status === "LIVE";

  return (
    <tr className="transition-colors hover:bg-[var(--bg-tertiary)]">
      {/* Market */}
      <td className="max-w-[200px] truncate px-3 py-2.5 text-[13px] text-[var(--text-primary)]">
        {order.market_question || order.market_id.slice(0, 12) + "..."}
      </td>

      {/* Type */}
      <td className="px-3 py-2.5">
        <OrderTypeBadge orderType={order.order_type} />
      </td>

      {/* Side */}
      <td className="px-3 py-2.5">
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
            isBuy
              ? "bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] text-[var(--accent-green)]"
              : "bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)]"
          }`}
        >
          {order.side}
        </span>
      </td>

      {/* Price */}
      <td className="px-3 py-2.5 text-right text-[13px] font-medium text-[var(--text-primary)]">
        {formatPrice(order.price)}
      </td>

      {/* Size */}
      <td className="px-3 py-2.5 text-right text-[13px] text-[var(--text-primary)]">
        {formatSize(order.size)}
      </td>

      {/* Filled */}
      <td className="px-3 py-2.5 text-right">
        <span className="text-[13px] text-[var(--text-primary)]">
          {formatSize(order.size_filled)}
        </span>
        <span className="ml-1 text-[11px] text-[var(--text-secondary)]">
          ({order.fill_percent.toFixed(0)}%)
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 text-center">
        <StatusBadge status={order.status} />
      </td>

      {/* Date */}
      <td className="whitespace-nowrap px-3 py-2.5 text-right text-[11px] text-[var(--text-secondary)]">
        {formatDate(order.placed_at)}
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5 text-center">
        {isLive && (
          <div className="flex items-center justify-center gap-1">
            {/* Edit button */}
            <button
              onClick={() => onEdit(order)}
              title="Edit price"
              className="rounded p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-blue)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            {/* Cancel button */}
            <button
              onClick={() => onCancel(order.id)}
              disabled={isCancelling}
              title="Cancel order"
              className="rounded p-1 text-[var(--text-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-red)_10%,transparent)] hover:text-[var(--accent-red)] disabled:opacity-40"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function OrderTypeBadge({ orderType }: { orderType: string }) {
  let label = orderType;
  let classes = "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";

  switch (orderType) {
    case "STOP_LOSS":
      label = "Stop Loss";
      classes =
        "bg-[color-mix(in_srgb,var(--accent-orange)_15%,transparent)] text-[var(--accent-orange)]";
      break;
    case "TAKE_PROFIT":
      label = "Take Profit";
      classes =
        "bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] text-[var(--accent-green)]";
      break;
    case "GTC":
      label = "Limit";
      break;
    case "LIMIT":
      label = "Limit";
      break;
    case "FOK":
      label = "Market";
      break;
    case "MARKET":
      label = "Market";
      break;
  }

  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${classes}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
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
    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${classes}`}>
      {status}
    </span>
  );
}

function SkeletonTable() {
  const cols = ["Market", "Type", "Side", "Price", "Size", "Filled", "Status", "Date", "Actions"];
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
            {cols.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-3 py-2.5">
                <div className="h-3.5 w-32 rounded bg-[var(--bg-tertiary)]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="h-3.5 w-12 rounded bg-[var(--bg-tertiary)]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="h-3.5 w-10 rounded bg-[var(--bg-tertiary)]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="ml-auto h-3.5 w-12 rounded bg-[var(--bg-tertiary)]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="ml-auto h-3.5 w-10 rounded bg-[var(--bg-tertiary)]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="ml-auto h-3.5 w-14 rounded bg-[var(--bg-tertiary)]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="mx-auto h-3.5 w-16 rounded bg-[var(--bg-tertiary)]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="ml-auto h-3.5 w-20 rounded bg-[var(--bg-tertiary)]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="mx-auto h-3.5 w-12 rounded bg-[var(--bg-tertiary)]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
