/** API response and request types */

export interface NonceResponse {
  nonce: string;
  message: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  wallet_address: string;
  has_polymarket_creds: boolean;
}

export interface LoginRequest {
  wallet: string;
  signature: string;
  nonce: string;
}

export interface PolymarketCredsRequest {
  api_key: string;
  api_secret: string;
  passphrase: string;
}

export interface ApiError {
  detail: string;
}
