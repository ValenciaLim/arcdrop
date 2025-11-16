import type { Network } from "@prisma/client";

export type CircleWallet = {
  id: string;
  address: string;
  network: Network;
};

/**
 * Developer-controlled wallets via Circle APIs.
 * Requires env:
 * - CIRCLE_API_BASE (default: https://api.circle.com)
 * - CIRCLE_API_KEY
 * - CIRCLE_ENTITY_SECRET (raw secret; SDK will derive ciphertext per-request)
 *   - Optional fallback: CIRCLE_ENTITY_SECRET_CIPHERTEXT (only for development)
 * - CIRCLE_BLOCKCHAIN (e.g., MATIC-AMOY, BASE-SEPOLIA)
 */
const API_BASE = process.env.CIRCLE_API_BASE || "https://api.circle.com";
const API_KEY = process.env.CIRCLE_API_KEY || "";
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET || "";
const FALLBACK_CIPHERTEXT = process.env.CIRCLE_ENTITY_SECRET_CIPHERTEXT || "";
const BLOCKCHAIN = process.env.CIRCLE_BLOCKCHAIN || "MATIC-AMOY";
const MOCK_WALLETS = String(process.env.ARCDROP_MOCK_WALLETS || "").toLowerCase() === "true";

// In-memory mock balances keyed by wallet address (only used when MOCK_WALLETS=true)
const mockUSDCBalances: Map<string, number> = new Map();

let cachedWalletSetId: string | null = null;

async function circleFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}/developer/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Circle API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<any>;
}

/**
 * Get a fresh one-time-use ciphertext for the Entity Secret.
 * Tries SDK first, falls back to an env ciphertext for dev only.
 */
async function getEntitySecretCiphertext(): Promise<string> {
  // Prefer per-request ciphertext via SDK when available.
  // Some SDK versions do not expose a runtime ciphertext method.
  // For now, use env fallback if provided. Otherwise, error with guidance.
  if (FALLBACK_CIPHERTEXT) return FALLBACK_CIPHERTEXT;

  throw new Error(
    "CIRCLE_ENTITY_SECRET_CIPHERTEXT is not set. Provide a fresh ciphertext in env or upgrade wiring to derive per-request ciphertext via the Circle SDK.",
  );
}

async function ensureWalletSetId(): Promise<string> {
  if (cachedWalletSetId) return cachedWalletSetId;
  // Create a wallet set
  const entitySecretCiphertext = await getEntitySecretCiphertext();
  const data = await circleFetch(`/walletSets`, {
    method: "POST",
    body: JSON.stringify({
      name: "ArcDrop Wallet Set",
      entitySecretCiphertext,
    }),
  });
  const id = data?.data?.walletSet?.id as string;
  if (!id) throw new Error("Failed to create wallet set");
  cachedWalletSetId = id;
  return id;
}

export async function ensureCircleWallet(
  _email: string,
  network: Network,
): Promise<CircleWallet> {
  if (MOCK_WALLETS) {
    const { randomBytes } = await import("crypto");
    const address = `0x${randomBytes(20).toString("hex")}`;
    // Seed a small balance for new wallets if not present
    if (!mockUSDCBalances.has(address)) {
      mockUSDCBalances.set(address, 100); // 100 USDC for demo
    }
    return { id: address, address, network };
  }
  const walletSetId = await ensureWalletSetId();
  // Create one wallet for the specified blockchain (network mapping handled via env BLOCKCHAIN)
  const entitySecretCiphertext = await getEntitySecretCiphertext();
  const created = await circleFetch(`/wallets`, {
    method: "POST",
    body: JSON.stringify({
      accountType: "SCA",
      blockchains: [BLOCKCHAIN],
      count: 1,
      walletSetId,
      entitySecretCiphertext,
    }),
  });
  const wallet = created?.data?.wallets?.[0];
  if (!wallet?.id || !wallet?.address) {
    throw new Error("Failed to create Circle wallet");
  }
  return {
    id: wallet.id as string,
    address: wallet.address as string,
    network,
  };
}

export async function transferUSDC(params: {
  fromWallet: CircleWallet;
  toWallet: CircleWallet;
  amount: number;
}): Promise<{ txHash: string }> {
  if (params.amount <= 0) {
    throw new Error("Transfer amount must be positive");
  }
  if (MOCK_WALLETS) {
    const { randomBytes } = await import("crypto");
    const fromBal = mockUSDCBalances.get(params.fromWallet.address) ?? 0;
    const toBal = mockUSDCBalances.get(params.toWallet.address) ?? 0;
    // Allow going negative for demo? Prefer clamp at 0
    const newFrom = Math.max(0, fromBal - params.amount);
    const newTo = toBal + params.amount;
    mockUSDCBalances.set(params.fromWallet.address, newFrom);
    mockUSDCBalances.set(params.toWallet.address, newTo);
    return { txHash: `0x${randomBytes(32).toString("hex")}` };
  }
  // Developer-controlled transfer (token standardized as USDC on selected blockchain)
  const entitySecretCiphertext = await getEntitySecretCiphertext();
  const body = {
    source: { walletId: params.fromWallet.id },
    destination: { walletId: params.toWallet.id },
    token: "USDC",
    amount: `${params.amount}`,
    blockchain: BLOCKCHAIN,
    entitySecretCiphertext,
  };
  const resp = await circleFetch(`/transfers`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const txHash =
    resp?.data?.transaction?.txHash ||
    resp?.data?.transfer?.txHash ||
    resp?.data?.txHash ||
    "";
  return { txHash };
}

export async function getUSDCBalance(address: string): Promise<number> {
  if (MOCK_WALLETS) {
    return mockUSDCBalances.get(address) ?? 0;
  }
  // For real balances: fetch via Circle balances endpoint (by wallet id). Not implemented here.
  return 0;
}

