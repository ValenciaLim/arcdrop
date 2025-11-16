import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: {
    id: string;
  };
};

export async function DELETE(_request: Request, { params }: Params) {
  try {
    // Remove payment links tied to this tier, then the tier itself
    await prisma.paymentLink.deleteMany({
      where: { tierId: params.id },
    });

    const deleted = await prisma.subscriptionTier.delete({
      where: { id: params.id },
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


