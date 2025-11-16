import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    // Remove dependent records tied to this tier, then the tier itself
    await prisma.subscription.deleteMany({
      where: { tierId: id },
    });
    await prisma.paymentLink.deleteMany({
      where: { tierId: id },
    });

    const deleted = await prisma.subscriptionTier.delete({
      where: { id },
    });

    return NextResponse.json({ deleted: { id: deleted.id } });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete subscription tier",
      },
      { status: 400 },
    );
  }
}


