/** Order types matching backend schemas */

export type OrderStatus = "LIVE" | "MATCHED" | "CANCELLED";
export type OrderSide = "BUY" | "SELL";

export interface Order {
  id: string;
  user_id: string;
  market_id: string;
  token_id: string;
  polymarket_order_id: string;
  side: OrderSide;
  outcome: string;
  order_type: string;
  size: number;
  price: number;
  size_filled: number;
  status: OrderStatus;
  market_question: string | null;
  position_id: string | null;
  placed_at: string | null;
  created_at: string | null;
  // Computed fields
  fill_percent: number;
  total_cost: number;
  filled_cost: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  page_size: number;
  total_live: number;
  total_matched: number;
  total_cancelled: number;
}

export interface OrderSyncResponse {
  synced_count: number;
  message: string;
}

export interface OrderFiltersParams {
  status?: OrderStatus;
  page?: number;
  page_size?: number;
}
