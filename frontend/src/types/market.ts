/** Market data types matching backend schemas */

export interface TokenInfo {
  token_id: string;
  outcome: string;
  price: number | null;
}

export interface Market {
  id: string;
  question: string;
  slug: string | null;
  category: string | null;
  end_date: string | null;
  active: boolean;
  closed: boolean;
  tokens: TokenInfo[] | null;
  volume: number | null;
  liquidity: number | null;
  description: string | null;
  image: string | null;
  synced_at: string;
}

export interface MarketDetail extends Market {
  best_bid: number | null;
  best_ask: number | null;
  midpoint: number | null;
}

export interface MarketListResponse {
  markets: Market[];
  total: number;
  page: number;
  page_size: number;
}

export interface MarketSearchParams {
  q?: string;
  category?: string;
  active?: boolean;
  closed?: boolean;
  page?: number;
  page_size?: number;
}
