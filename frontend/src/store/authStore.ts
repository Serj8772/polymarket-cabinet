/** Auth state management with Zustand */

import { create } from "zustand";

interface AuthState {
  wallet: string | null;
  jwt: string | null;
  isConnected: boolean;
  hasPolymarketCreds: boolean;

  setWallet: (wallet: string | null) => void;
  setJwt: (jwt: string | null) => void;
  setHasPolymarketCreds: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  wallet: null,
  jwt: localStorage.getItem("jwt_token"),
  isConnected: false,
  hasPolymarketCreds: false,

  setWallet: (wallet) => set({ wallet, isConnected: !!wallet }),

  setJwt: (jwt) => {
    if (jwt) {
      localStorage.setItem("jwt_token", jwt);
    } else {
      localStorage.removeItem("jwt_token");
    }
    set({ jwt });
  },

  setHasPolymarketCreds: (value) => set({ hasPolymarketCreds: value }),

  logout: () => {
    localStorage.removeItem("jwt_token");
    set({
      wallet: null,
      jwt: null,
      isConnected: false,
      hasPolymarketCreds: false,
    });
  },
}));
