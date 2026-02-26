/** React Query hooks for market data */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMarkets, getMarketById, searchMarkets } from "@/services/api/markets";
import type { MarketSearchParams } from "@/types/market";

/** Fetch paginated markets with filters */
export function useMarkets(params: MarketSearchParams = {}) {
  return useQuery({
    queryKey: ["markets", params],
    queryFn: () => getMarkets(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000, // 1 min (data refreshes via background sync)
  });
}

/** Fetch single market detail with live prices */
export function useMarketDetail(marketId: string | undefined) {
  return useQuery({
    queryKey: ["market", marketId],
    queryFn: () => getMarketById(marketId!),
    enabled: !!marketId,
    staleTime: 10_000, // 10 sec (live prices)
  });
}

/** Search markets with debounced query */
export function useMarketSearch(query: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["markets", "search", query, page, pageSize],
    queryFn: () => searchMarkets(query, page, pageSize),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
