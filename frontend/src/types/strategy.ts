/** Strategy types — arbitrage scanner */

export interface BracketInfo {
  market_id: string;
  question: string;
  yes_price: number;
  no_price: number;
  is_tail: boolean;
  profit_pct: number;
  token_id_yes: string | null;
  token_id_no: string | null;
}

export interface ArbitrageOpportunity {
  event_slug: string;
  event_title: string;
  image: string | null;
  brackets: BracketInfo[];
  sum_yes: number;
  overround: number;
  tail_count: number;
  best_tail_profit: number;
  volume: number;
  end_date: string | null;
}

export interface ArbitrageScanResponse {
  opportunities: ArbitrageOpportunity[];
  scanned_events: number;
  tail_threshold: number;
}

export interface ArbitrageScanParams {
  tail_threshold?: number;
  min_brackets?: number;
  min_volume?: number;
  max_days?: number;
}
