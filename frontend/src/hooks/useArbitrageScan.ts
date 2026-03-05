/** React Query hook for arbitrage scanner */

import { useQuery } from "@tanstack/react-query";
import { scanArbitrage } from "@/services/api/strategies";
import type { ArbitrageScanParams } from "@/types/strategy";

export function useArbitrageScan(params: ArbitrageScanParams, enabled = true) {
  return useQuery({
    queryKey: ["arbitrage-scan", params],
    queryFn: () => scanArbitrage(params),
    enabled,
    staleTime: 60_000,
  });
}
