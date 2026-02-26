/** Trading types — market sell, take profit, stop loss */

export interface MarketSellRequest {
  position_id: string;
}

export interface TakeProfitRequest {
  position_id: string;
  price: number;
}

export interface StopLossRequest {
  position_id: string;
  price: number;
}

export interface EditOrderRequest {
  new_price: number;
}

export interface TradingResponse {
  success: boolean;
  message: string;
  order_id?: string;
}
