/** React Query hooks for order data */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, syncOrders } from "@/services/api/orders";
import type { OrderStatus } from "@/types/order";
import toast from "react-hot-toast";

/** Fetch orders with optional status filter and pagination */
export function useOrders(
  status?: OrderStatus,
  page: number = 1,
  pageSize: number = 50,
) {
  return useQuery({
    queryKey: ["orders", status, page, pageSize],
    queryFn: () => getOrders({ status, page, page_size: pageSize }),
    staleTime: 60_000, // 1 min
    retry: false, // Don't retry on 401/403
    placeholderData: (prev) => prev, // Keep previous data while loading
  });
}

/** Trigger order history sync from Polymarket */
export function useSyncOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncOrders,
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate orders cache to refetch
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const message =
        error.response?.data?.detail || "Failed to sync orders";
      toast.error(message);
    },
  });
}
