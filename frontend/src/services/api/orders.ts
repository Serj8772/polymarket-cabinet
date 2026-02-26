/** Orders API service methods */

import { apiClient } from "./client";
import type {
  OrderListResponse,
  OrderSyncResponse,
  OrderFiltersParams,
} from "@/types/order";

/** Fetch user's orders with optional filters */
export async function getOrders(
  params?: OrderFiltersParams,
): Promise<OrderListResponse> {
  const { data } = await apiClient.get<OrderListResponse>("/orders", {
    params,
  });
  return data;
}

/** Trigger manual sync of orders from Polymarket API */
export async function syncOrders(): Promise<OrderSyncResponse> {
  const { data } = await apiClient.post<OrderSyncResponse>("/orders/sync");
  return data;
}
