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
  proxy_wallet: string | null;
  has_polymarket_creds: boolean;
  has_private_key: boolean;
}

export interface ProxyWalletRequest {
  proxy_wallet: string;
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
