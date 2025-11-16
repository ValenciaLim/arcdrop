/**
 * Modular Wallet configuration helper.
 * Reads environment variables for Circle Modular Wallets integration.
 */

export function getModularConfig() {
  const clientUrl = process.env.MODULAR_CLIENT_URL;
  const clientKey = process.env.MODULAR_CLIENT_KEY;
  const defaultChain = process.env.MODULAR_DEFAULT_CHAIN ?? "base-sepolia";

  if (!clientUrl || !clientKey) {
    throw new Error(
      "Missing MODULAR_CLIENT_URL or MODULAR_CLIENT_KEY environment variables",
    );
  }

  return { clientUrl, clientKey, defaultChain };
}

/**
 * Maps Prisma Network enum to Circle Modular Wallet chain identifier.
 */
export function networkToModularChain(network: string): string {
  const mapping: Record<string, string> = {
    BASE: "base-sepolia",
    POLYGON: "polygon-amoy",
    AVALANCHE: "avalanche-fuji",
  };

  return mapping[network] ?? "base-sepolia";
}

