/** Auth state management with Zustand */

import { create } from "zustand";

interface AuthState {
  wallet: string | null;
  proxyWallet: string | null;
  jwt: string | null;
  isConnected: boolean;
  hasPolymarketCreds: boolean;
  hasPrivateKey: boolean;
  autoSLPercent: number | null;

  setWallet: (wallet: string | null) => void;
  setProxyWallet: (proxyWallet: string | null) => void;
  setJwt: (jwt: string | null) => void;
  setHasPolymarketCreds: (value: boolean) => void;
  setHasPrivateKey: (value: boolean) => void;
  setAutoSLPercent: (value: number | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  wallet: null,
  proxyWallet: null,
  jwt: localStorage.getItem("jwt_token"),
  isConnected: false,
  hasPolymarketCreds: false,
  hasPrivateKey: false,
  autoSLPercent: null,

  setWallet: (wallet) => set({ wallet, isConnected: !!wallet }),

  setProxyWallet: (proxyWallet) => set({ proxyWallet }),

  setJwt: (jwt) => {
    if (jwt) {
      localStorage.setItem("jwt_token", jwt);
    } else {
      localStorage.removeItem("jwt_token");
    }
    set({ jwt });
  },

  setHasPolymarketCreds: (value) => set({ hasPolymarketCreds: value }),

  setHasPrivateKey: (value) => set({ hasPrivateKey: value }),

  setAutoSLPercent: (value) => set({ autoSLPercent: value }),

  logout: () => {
    localStorage.removeItem("jwt_token");
    set({
      wallet: null,
      proxyWallet: null,
      jwt: null,
      isConnected: false,
      hasPolymarketCreds: false,
      hasPrivateKey: false,
      autoSLPercent: null,
    });
  },
}));
