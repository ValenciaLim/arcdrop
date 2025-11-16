import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const creator = await prisma.creatorProfile.findFirst({
      where: {
        OR: [
          { id },
          { handle: id.toLowerCase() },
        ],
      },
      include: {
        paymentLinks: {
          include: {
            tier: true,
          },
        },
        subscriptionTiers: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { message: "Creator not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      creator: {
        id: creator.id,
        displayName: creator.displayName,
        handle: creator.handle,
        bio: creator.bio,
        avatarUrl: creator.avatarUrl,
      },
      paymentLinks: creator.paymentLinks.map((link) => ({
        id: link.id,
        slug: link.slug,
        title: link.title,
        description: link.description,
        type: link.type,
        amount: decimalToNumber(link.amount),
        tier: link.tier
          ? {
              id: link.tier.id,
              name: link.tier.name,
              description: link.tier.description,
              amount: Number(link.tier.amount),
              intervalDays: link.tier.intervalDays,
            }
          : null,
      })),
      subscriptionTiers: creator.subscriptionTiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        amount: Number(tier.amount),
        intervalDays: tier.intervalDays,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to load creator",
      },
      { status: 500 },
    );
  }
}

