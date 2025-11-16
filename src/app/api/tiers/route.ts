import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTierSchema = z.object({
  creatorId: z.string().cuid(),
  name: z.string().min(2),
  amount: z.number().positive(),
  intervalDays: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const payload = createTierSchema.parse(await request.json());

    const creator = await prisma.creatorProfile.findUnique({
      where: { id: payload.creatorId },
    });
    if (!creator) {
      return NextResponse.json(
        { message: "Creator not found" },
        { status: 404 },
      );
    }

    const tier = await prisma.subscriptionTier.create({
      data: {
        creatorId: payload.creatorId,
        name: payload.name,
        description: null,
        amount: payload.amount,
        intervalDays: payload.intervalDays,
      },
    });

    return NextResponse.json({ tier });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create subscription tier",
      },
      { status: 400 },
    );
  }
}


