import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { tierId: params.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      subscribers: subscriptions.map((s) => ({
        id: s.id,
        userEmail: s.user.email,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        lastPaymentAt: s.lastPaymentAt?.toISOString() ?? null,
        nextBillingAt: s.nextBillingAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch subscribers",
      },
      { status: 400 },
    );
  }
}


