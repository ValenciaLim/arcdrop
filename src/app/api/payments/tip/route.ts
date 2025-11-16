import { NextResponse } from "next/server";
import { z } from "zod";
import { processTip } from "@/lib/payments";

export type TipRequest = {
  linkSlug: string;
  userEmail: string;
  walletAddress?: string;
  amount?: number;
  network: "BASE" | "POLYGON" | "AVALANCHE";
};

export type TipResponse = {
  tipId: string;
  status: string;
};

const schema = z.object({
  linkSlug: z.string().min(4),
  userEmail: z.string().email(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  amount: z.number().positive().optional(),
  network: z.enum(["BASE", "POLYGON", "AVALANCHE"]).default("BASE"),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const tip = await processTip(payload as any);
    return NextResponse.json<TipResponse>({ tipId: tip.id, status: tip.status });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Payment failed",
      },
      { status: 400 },
    );
  }
}


