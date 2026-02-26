/** Orders history page — view, edit, cancel, and sync order history */

import { useState, useCallback } from "react";
import { useOrders, useSyncOrders } from "@/hooks/useOrders";
import { useEditOrder, useCancelOrder } from "@/hooks/useTrading";
import { OrderTable } from "@/components/features/Orders/OrderTable";
import { OrderFilters } from "@/components/features/Orders/OrderFilters";
import { EditOrderModal } from "@/components/features/Orders/EditOrderModal";
import type { Order, OrderStatus } from "@/types/order";

export function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading, error } = useOrders(status, page, pageSize);
  const syncMutation = useSyncOrders();
  const editMutation = useEditOrder();
  const cancelMutation = useCancelOrder();

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const handleStatusChange = useCallback((newStatus: OrderStatus | undefined) => {
    setStatus(newStatus);
    setPage(1);
  }, []);

  const handleEditOrder = useCallback((order: Order) => {
    setEditingOrder(order);
  }, []);

  const handleCancelOrder = useCallback(
    (orderId: string) => {
      if (window.confirm("Cancel this order?")) {
        cancelMutation.mutate(orderId);
      }
    },
    [cancelMutation],
  );

  const handleEditSubmit = useCallback(
    (orderId: string, newPrice: number) => {
      editMutation.mutate(
        { orderId, newPrice },
        { onSuccess: () => setEditingOrder(null) },
      );
    },
    [editMutation],
  );

  // Auth error
  if (error) {
    const errMsg =
      (error as Error & { response?: { status?: number } }).response?.status === 401
        ? "Connect your wallet to view orders"
        : (error as Error & { response?: { data?: { detail?: string } } }).response
              ?.data?.detail || "Failed to load orders";

    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">
          Orders
        </h2>
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 text-center">
          <p className="text-[var(--text-secondary)]">{errMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Orders
        </h2>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {syncMutation.isPending ? (
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
              Syncing...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Sync Orders
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <OrderFilters
          activeStatus={status}
          onStatusChange={handleStatusChange}
          counts={
            data
              ? {
                  total_live: data.total_live,
                  total_matched: data.total_matched,
                  total_cancelled: data.total_cancelled,
                }
              : undefined
          }
        />
      </div>

      {/* Table */}
      <OrderTable
        orders={data?.orders}
        isLoading={isLoading}
        total={data?.total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onEditOrder={handleEditOrder}
        onCancelOrder={handleCancelOrder}
        isCancelling={cancelMutation.isPending}
      />

      {/* Edit modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingOrder(null)}
          isPending={editMutation.isPending}
        />
      )}
    </div>
  );
}
