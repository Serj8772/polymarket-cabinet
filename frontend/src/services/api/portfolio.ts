/** Portfolio API service methods */

import { apiClient } from "./client";
import type { PortfolioResponse, SyncResponse } from "@/types/portfolio";

/** Fetch user's portfolio with positions and P&L */
export async function getPortfolio(): Promise<PortfolioResponse> {
  const { data } = await apiClient.get<PortfolioResponse>("/portfolio");
  return data;
}

/** Trigger manual sync from Polymarket API */
export async function syncPositions(): Promise<SyncResponse> {
  const { data } = await apiClient.post<SyncResponse>("/portfolio/sync");
  return data;
}
