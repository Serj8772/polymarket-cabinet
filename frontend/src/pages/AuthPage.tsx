/** Authentication page */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectWallet } from "@/components/features/Auth/ConnectWallet";
import { useAuthStore } from "@/store/authStore";

export function AuthPage() {
  const jwt = useAuthStore((s) => s.jwt);
  const navigate = useNavigate();

  useEffect(() => {
    if (jwt) {
      navigate("/dashboard", { replace: true });
    }
  }, [jwt, navigate]);

  return <ConnectWallet />;
}
