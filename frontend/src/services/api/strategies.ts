/** Strategies API service */

import { apiClient } from "./client";
import type { ArbitrageScanResponse, ArbitrageScanParams } from "@/types/strategy";

export async function scanArbitrage(
  params: ArbitrageScanParams = {},
): Promise<ArbitrageScanResponse> {
  const { data } = await apiClient.get<ArbitrageScanResponse>(
    "/strategies/arbitrage/scan",
    { params },
  );
  return data;
}
