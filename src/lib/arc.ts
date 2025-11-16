import { nanoid } from "nanoid";
import type { Network } from "@prisma/client";

export async function executeGaslessTransaction(params: {
  walletId: string;
  targetNetwork: Network;
}): Promise<{ arcSessionId: string }> {
  return {
    arcSessionId: `arc-session-${params.walletId}-${params.targetNetwork}-${nanoid(
      6,
    )}`,
  };
}

