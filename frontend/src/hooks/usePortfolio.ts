/** React Query hooks for portfolio data */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPortfolio, syncPositions } from "@/services/api/portfolio";
import toast from "react-hot-toast";

/** Fetch portfolio with positions and P&L */
export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
    staleTime: 60_000, // 1 min
    retry: false, // Don't retry on 401/403
  });
}

/** Trigger portfolio sync from Polymarket */
export function useSyncPositions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncPositions,
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate portfolio cache to refetch
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const message =
        error.response?.data?.detail || "Failed to sync positions";
      toast.error(message);
    },
  });
}
