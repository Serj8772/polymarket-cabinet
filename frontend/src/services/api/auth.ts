/** Auth API service */

import { apiClient } from "./client";
import type {
  LoginRequest,
  NonceResponse,
  PolymarketCredsRequest,
  TokenResponse,
  UserResponse,
} from "@/types/api";

export async function getNonce(wallet: string): Promise<NonceResponse> {
  const { data } = await apiClient.get<NonceResponse>("/auth/nonce", {
    params: { wallet },
  });
  return data;
}

export async function login(body: LoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", body);
  return data;
}

export async function getMe(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>("/auth/me");
  return data;
}

export async function savePolymarketCreds(
  body: PolymarketCredsRequest,
): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>(
    "/auth/polymarket-creds",
    body,
  );
  return data;
}
