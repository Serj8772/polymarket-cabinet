/** Modal dialog for editing an order's price */

import { useState, useCallback, useEffect } from "react";
import type { Order } from "@/types/order";

interface EditOrderModalProps {
  order: Order;
  onSubmit: (orderId: string, newPrice: number) => void;
  onClose: () => void;
  isPending: boolean;
}

export function EditOrderModal({
  order,
  onSubmit,
  onClose,
  isPending,
}: EditOrderModalProps) {
  const [priceInput, setPriceInput] = useState(
    (order.price * 100).toFixed(1),
  );
  const [error, setError] = useState("");

  const isStopLoss = order.order_type === "STOP_LOSS";
  const label = isStopLoss ? "Stop Loss Price" : "Limit Price";

  useEffect(() => {
    setPriceInput((order.price * 100).toFixed(1));
    setError("");
  }, [order]);

  const handleSubmit = useCallback(() => {
    const cents = parseFloat(priceInput);
    if (isNaN(cents) || cents <= 0 || cents >= 100) {
      setError("Price must be between 0.1¢ and 99.9¢");
      return;
    }
    const price = cents / 100;
    if (Math.abs(price - order.price) < 0.001) {
      setError("New price must be different");
      return;
    }
    setError("");
    onSubmit(order.id, price);
  }, [priceInput, order, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isPending) handleSubmit();
      if (e.key === "Escape") onClose();
    },
    [handleSubmit, onClose, isPending],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="mx-4 w-full max-w-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Edit Order
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Market info */}
        <div className="mb-4 rounded-lg bg-[var(--bg-secondary)] p-3">
          <p className="text-[12px] text-[var(--text-secondary)]">
            {order.market_question || order.market_id.slice(0, 20) + "..."}
          </p>
          <div className="mt-1 flex gap-2 text-[11px]">
            <span
              className={`font-semibold ${
                order.side === "BUY"
                  ? "text-[var(--accent-green)]"
                  : "text-[var(--accent-red)]"
              }`}
            >
              {order.side}
            </span>
            <span className="text-[var(--text-secondary)]">
              {order.outcome}
            </span>
            <span className="text-[var(--text-secondary)]">
              Size: {order.size.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Price input */}
        <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
          {label} (in cents)
        </label>
        <div className="relative mb-1">
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="99.9"
            value={priceInput}
            onChange={(e) => {
              setPriceInput(e.target.value);
              setError("");
            }}
            autoFocus
            disabled={isPending}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-blue)] focus:outline-none disabled:opacity-50"
            placeholder="e.g. 85.0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">
            ¢
          </span>
        </div>
        <p className="mb-4 text-[11px] text-[var(--text-secondary)]">
          Current: {(order.price * 100).toFixed(1)}¢ →{" "}
          {priceInput ? `${parseFloat(priceInput).toFixed(1)}¢` : "—"}
        </p>

        {error && (
          <p className="mb-3 text-[12px] text-[var(--accent-red)]">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
