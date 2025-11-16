import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentLinkSchema } from "@/lib/validators";
import { generateLinkSlug } from "@/lib/payment-links";

export async function POST(request: Request) {
  try {
    const payload = paymentLinkSchema.parse(await request.json());

    const creator = await prisma.creatorProfile.findUnique({
      where: { id: payload.creatorId },
      include: { paymentLinks: true },
    });

    if (!creator) {
      throw new Error("Creator not found");
    }

    if (payload.type === "SUBSCRIPTION" && !payload.tierId) {
      throw new Error("Subscription tierId is required");
    }

    if (payload.amount && payload.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const tierId = payload.tierId;
    if (tierId) {
      const tier = await prisma.subscriptionTier.findUnique({
        where: { id: tierId },
      });
      if (!tier || tier.creatorId !== creator.id) {
        throw new Error("Tier does not belong to creator");
      }
    }

    const slug = await generateLinkSlug(creator.handle);

    const link = await prisma.paymentLink.create({
      data: {
        slug,
        creatorId: creator.id,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        amount: payload.amount,
        tierId,
        metadata: payload.metadata,
      },
    });

    return NextResponse.json({
      link: {
        id: link.id,
        slug: link.slug,
        type: link.type,
        title: link.title,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create payment link",
      },
      { status: 400 },
    );
  }
}

