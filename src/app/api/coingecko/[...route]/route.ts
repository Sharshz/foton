// Complete CoinGecko API proxy using our new handler architecture
import { Coingecko } from "@coingecko/coingecko-typescript";
import { createCoinGeckoApiHandler } from "@/neynar-web-sdk/nextjs";
import { privateConfig } from "@/config/private-config";

// Initialize the CoinGecko client with API key from environment
// Use demo environment for testing (can be switched to "pro" with proAPIKey for production)
const client = new Coingecko({
  demoAPIKey: privateConfig.coingeckoApiKey,
  environment: "demo",
});

// Export Next.js API route handlers
export const { GET, POST, PUT, DELETE, OPTIONS } =
  createCoinGeckoApiHandler(client);
