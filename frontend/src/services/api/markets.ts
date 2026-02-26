/** Market API service methods */

import { apiClient } from "./client";
import type {
  MarketDetail,
  MarketListResponse,
  MarketSearchParams,
} from "@/types/market";

/** Fetch paginated markets with optional filters */
export async function getMarkets(
  params: MarketSearchParams = {},
): Promise<MarketListResponse> {
  const { data } = await apiClient.get<MarketListResponse>("/markets", {
    params,
  });
  return data;
}

/** Fetch single market detail with live CLOB prices */
export async function getMarketById(marketId: string): Promise<MarketDetail> {
  const { data } = await apiClient.get<MarketDetail>(`/markets/${marketId}`);
  return data;
}

/** Search markets by text query */
export async function searchMarkets(
  q: string,
  page = 1,
  pageSize = 20,
): Promise<MarketListResponse> {
  const { data } = await apiClient.get<MarketListResponse>("/markets/search", {
    params: { q, page, page_size: pageSize },
  });
  return data;
}
