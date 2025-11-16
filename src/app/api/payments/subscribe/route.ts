import { NextResponse } from "next/server";
import { z } from "zod";
import { processSubscription } from "@/lib/payments";

export type SubscribeRequest = {
  linkSlug: string;
  userEmail: string;
  walletAddress?: string;
  network: "BASE" | "POLYGON" | "AVALANCHE";
};

export type SubscribeResponse = {
  subscriptionId: string;
  txHash: string;
  arcSessionId: string;
};

const schema = z.object({
  linkSlug: z.string().min(4),
  userEmail: z.string().email(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  network: z.enum(["BASE", "POLYGON", "AVALANCHE"]).default("BASE"),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const res = await processSubscription(payload as any);
    return NextResponse.json<SubscribeResponse>(res as any);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Subscription failed",
      },
      { status: 400 },
    );
  }
}


