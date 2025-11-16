import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const link = await prisma.paymentLink.findUnique({
      where: { slug },
      include: {
        creator: true,
        tier: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { message: "Payment link not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      link: {
        id: link.id,
        slug: link.slug,
        type: link.type,
        title: link.title,
        description: link.description,
        amount: decimalToNumber(link.amount),
        creator: {
          id: link.creator.id,
          displayName: link.creator.displayName,
          handle: link.creator.handle,
          bio: link.creator.bio,
          avatarUrl: link.creator.avatarUrl,
        },
        tier: link.tier
          ? {
              id: link.tier.id,
              name: link.tier.name,
              description: link.tier.description,
              amount: Number(link.tier.amount),
              intervalDays: link.tier.intervalDays,
            }
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch payment link",
      },
      { status: 500 },
    );
  }
}

