import { nanoid } from "nanoid";
import type { Network } from "@prisma/client";

export type CircleWallet = {
  id: string;
  address: string;
  network: Network;
};

const inMemoryWallets = new Map<string, CircleWallet>();

/**
 * Mocks Circle Smart Wallet provisioning.
 */
export async function ensureCircleWallet(
  email: string,
  network: Network,
): Promise<CircleWallet> {
  const cacheKey = `${email}-${network}`;
  const cached = inMemoryWallets.get(cacheKey);
  if (cached) return cached;

  const wallet: CircleWallet = {
    id: `circle-${nanoid(12)}`,
    address: `0x${nanoid(32)}`,
    network,
  };
  inMemoryWallets.set(cacheKey, wallet);
  return wallet;
}

export async function transferUSDC(params: {
  fromWallet: CircleWallet;
  toWallet: CircleWallet;
  amount: number;
}): Promise<{ txHash: string }> {
  if (params.amount <= 0) {
    throw new Error("Transfer amount must be positive");
  }

  return {
    txHash: `0x${nanoid(32)}`,
  };
}

