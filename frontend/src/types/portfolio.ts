/** Portfolio/Position types matching backend schemas */

export interface Position {
  id: string;
  user_id: string;
  market_id: string;
  token_id: string;
  outcome: string;
  size: number;
  avg_price: number;
  current_price: number | null;
  realized_pnl: number;
  synced_at: string | null;
  market_question: string | null;
  market_image: string | null;
  market_slug: string | null;
  // Trading: TP/SL
  take_profit_price: number | null;
  stop_loss_price: number | null;
  tp_order_id: string | null;
  // Computed fields
  cost_basis: number;
  current_value: number;
  unrealized_pnl: number;
  pnl_percent: number;
}

export interface PortfolioResponse {
  positions: Position[];
  total_value: number;
  total_cost: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  total_pnl_percent: number;
  positions_count: number;
  cash_balance: number;
}

export interface SyncResponse {
  synced_count: number;
  message: string;
}
