/** Trading API service — market sell, take profit, stop loss */

import { apiClient } from "./client";
import type {
  EditOrderRequest,
  MarketSellRequest,
  TakeProfitRequest,
  StopLossRequest,
  TradingResponse,
} from "@/types/trading";

/** Sell entire position at market price */
export async function marketSell(
  body: MarketSellRequest,
): Promise<TradingResponse> {
  const { data } = await apiClient.post<TradingResponse>(
    "/trading/market-sell",
    body,
  );
  return data;
}

/** Set take profit — places GTC limit sell order */
export async function setTakeProfit(
  body: TakeProfitRequest,
): Promise<TradingResponse> {
  const { data } = await apiClient.post<TradingResponse>(
    "/trading/take-profit",
    body,
  );
  return data;
}

/** Cancel take profit — cancels GTC order on CLOB */
export async function cancelTakeProfit(
  positionId: string,
): Promise<TradingResponse> {
  const { data } = await apiClient.delete<TradingResponse>(
    `/trading/take-profit/${positionId}`,
  );
  return data;
}

/** Set stop loss — backend monitors price, auto-sells when triggered */
export async function setStopLoss(
  body: StopLossRequest,
): Promise<TradingResponse> {
  const { data } = await apiClient.post<TradingResponse>(
    "/trading/stop-loss",
    body,
  );
  return data;
}

/** Remove stop loss monitoring */
export async function removeStopLoss(
  positionId: string,
): Promise<TradingResponse> {
  const { data } = await apiClient.delete<TradingResponse>(
    `/trading/stop-loss/${positionId}`,
  );
  return data;
}

/** Edit an order's price */
export async function editOrder(
  orderId: string,
  body: EditOrderRequest,
): Promise<TradingResponse> {
  const { data } = await apiClient.put<TradingResponse>(
    `/trading/orders/${orderId}`,
    body,
  );
  return data;
}

/** Cancel a LIVE order */
export async function cancelOrder(
  orderId: string,
): Promise<TradingResponse> {
  const { data } = await apiClient.delete<TradingResponse>(
    `/trading/orders/${orderId}`,
  );
  return data;
}
