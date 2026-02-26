/** Web3 authentication hook: MetaMask connect + sign + JWT */

import { useCallback, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { getNonce, login, getMe } from "@/services/api/auth";
import { useAuthStore } from "@/store/authStore";

export function useWeb3Auth() {
  const { address, isConnected: walletConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const { jwt, setWallet, setProxyWallet, setJwt, setHasPolymarketCreds, setHasPrivateKey, logout } =
    useAuthStore();

  // Sync wallet address
  useEffect(() => {
    if (walletConnected && address) {
      setWallet(address);
    } else {
      setWallet(null);
    }
  }, [walletConnected, address, setWallet]);

  // Fetch user info when JWT exists
  useEffect(() => {
    if (!jwt) return;

    getMe()
      .then((user) => {
        setWallet(user.wallet_address);
        setProxyWallet(user.proxy_wallet);
        setHasPolymarketCreds(user.has_polymarket_creds);
        setHasPrivateKey(user.has_private_key);
      })
      .catch(() => {
        // JWT invalid or expired
        logout();
      });
  }, [jwt, setWallet, setProxyWallet, setHasPolymarketCreds, setHasPrivateKey, logout]);

  // Login flow: nonce → sign → JWT
  const authenticate = useCallback(async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    // 1. Get nonce from backend
    const { nonce, message } = await getNonce(address);

    // 2. Sign message with MetaMask
    const signature = await signMessageAsync({ message });

    // 3. Send to backend for verification
    const { access_token } = await login({
      wallet: address,
      signature,
      nonce,
    });

    // 4. Store JWT
    setJwt(access_token);

    return access_token;
  }, [address, signMessageAsync, setJwt]);

  return {
    wallet: address,
    isConnected: walletConnected,
    isAuthenticated: !!jwt,
    authenticate,
    logout,
  };
}
