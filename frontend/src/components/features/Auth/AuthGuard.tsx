/** Route guard: redirects to auth if not authenticated */

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function AuthGuard() {
  const jwt = useAuthStore((s) => s.jwt);

  if (!jwt) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
