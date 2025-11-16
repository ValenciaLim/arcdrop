import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json(
        { message: "Subscription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        nextBillingAt: subscription.nextBillingAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch subscription",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body?.status as "ACTIVE" | "PAUSED" | "CANCELLED" | undefined;

    if (!status || !["ACTIVE", "PAUSED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid or missing status" },
        { status: 400 },
      );
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      subscription: {
        id: updated.id,
        status: updated.status,
        nextBillingAt: updated.nextBillingAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to update subscription",
      },
      { status: 400 },
    );
  }
}

