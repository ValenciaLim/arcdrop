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

/**
 * Build the correct Modular RPC URL for a given chain from the configured clientUrl.
 * If the URL already ends with a known chain (e.g. `/base-sepolia`), return as-is.
 * Otherwise, append `/<chain>` to the base clientUrl.
 */
export function buildModularRpcUrl(clientUrl: string, chain: string): string {
  const base = (clientUrl || "").replace(/\/+$/, "");
  const knownChains = [
    "base-sepolia",
    "polygon-amoy",
    "avalanche-fuji",
    "base",
    "polygon",
    "avalanche",
  ];

  const endsWithKnownChain = knownChains.some((c) =>
    new RegExp(`/${c}$`, "i").test(base),
  );

  return endsWithKnownChain ? base : `${base}/${chain}`;
}

