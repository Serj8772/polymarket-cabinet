/** Application entry point with wagmi Web3 provider */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, polygon } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { App } from "./App";
import "./styles/globals.css";

// Wagmi configuration
const wagmiConfig = createConfig({
  chains: [polygon, mainnet],
  transports: {
    [polygon.id]: http(),
    [mainnet.id]: http(),
  },
});

// Separate query client for wagmi (App has its own for API calls)
const wagmiQueryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={wagmiQueryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
