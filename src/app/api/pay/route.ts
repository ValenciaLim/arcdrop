import { NextResponse } from "next/server";
import { payRequestSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { processSubscription, processTip } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const payload = payRequestSchema.parse(await request.json());

    const link = await prisma.paymentLink.findUnique({
      where: { slug: payload.linkSlug },
    });

    if (!link) {
      return NextResponse.json(
        { message: "Payment link not found" },
        { status: 404 },
      );
    }

    if (link.type === "TIP") {
      const tip = await processTip({
        linkSlug: payload.linkSlug,
        userEmail: payload.userEmail,
        walletAddress: payload.walletAddress,
        amount: payload.amount,
        network: payload.network,
      });

      return NextResponse.json({ tipId: tip.id, status: tip.status });
    }

    const sub = await processSubscription({
      linkSlug: payload.linkSlug,
      userEmail: payload.userEmail,
      walletAddress: payload.walletAddress,
      network: payload.network,
    });

    return NextResponse.json(sub);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Payment failed",
      },
      { status: 400 },
    );
  }
}

