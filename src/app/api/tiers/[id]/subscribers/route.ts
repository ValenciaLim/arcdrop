import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const subscriptions = await prisma.subscription.findMany({
      where: { tierId: id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      subscribers: subscriptions.map((s: any) => ({
        id: s.id as string,
        userEmail: s.user?.email as string,
        status: s.status as string,
        createdAt: (s.createdAt as Date).toISOString(),
        lastPaymentAt: s.lastPaymentAt ? (s.lastPaymentAt as Date).toISOString() : null,
        nextBillingAt: (s.nextBillingAt as Date).toISOString(),
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


