/** Main application with routing */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { AppLayout } from "@/components/features/Layout/AppLayout";
import { AuthGuard } from "@/components/features/Auth/AuthGuard";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { MarketsPage } from "@/pages/MarketsPage";
import { PortfolioPage } from "@/pages/PortfolioPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { MarketDetailPage } from "@/pages/MarketDetailPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<AuthPage />} />

          {/* Protected */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/markets/:marketId" element={<MarketDetailPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
