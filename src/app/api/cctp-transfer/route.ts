import { NextResponse } from "next/server";
import { z } from "zod";
import { bridgeUSDC } from "@/lib/cctp";

export type CctpRequest = {
  amount: number;
  sourceNetwork: "BASE" | "POLYGON" | "AVALANCHE";
  destinationNetwork: "BASE" | "POLYGON" | "AVALANCHE";
};

export type CctpResponse = {
  steps: Array<{ status: "BURNED" | "ATTESTED" | "MINTED"; txHash?: string }>;
};

const schema = z.object({
  amount: z.number().positive(),
  sourceNetwork: z.enum(["BASE", "POLYGON", "AVALANCHE"]),
  destinationNetwork: z.enum(["BASE", "POLYGON", "AVALANCHE"]),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const { bridgeTxHash } = await bridgeUSDC(payload as any);

    const steps: CctpResponse["steps"] = [
      { status: "BURNED", txHash: bridgeTxHash ?? undefined },
      { status: "ATTESTED" },
      { status: "MINTED" },
    ];

    return NextResponse.json<CctpResponse>({ steps });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to bridge via CCTP",
      },
      { status: 400 },
    );
  }
}


