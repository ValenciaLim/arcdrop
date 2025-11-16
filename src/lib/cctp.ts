import type { Network } from "@prisma/client";

type BridgeParams = {
  amount: number;
  sourceNetwork: Network;
  destinationNetwork: Network;
};

export async function bridgeUSDC({
  amount,
  sourceNetwork,
  destinationNetwork,
}: BridgeParams) {
  if (sourceNetwork === destinationNetwork) {
    return { bridgeTxHash: null };
  }

  return {
    bridgeTxHash: `cctp-${sourceNetwork}-${destinationNetwork}-${amount}`,
  };
}

