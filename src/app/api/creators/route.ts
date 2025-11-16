import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCreatorSchema } from "@/lib/validators";
import { sanitizeHandle } from "@/lib/utils";
import { getOrCreateUser } from "@/lib/auth";
import { ensureCircleWallet } from "@/lib/circle";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const walletAddress = searchParams.get("walletAddress");

    if (!email && !walletAddress) {
      return NextResponse.json(
        { message: "Email or walletAddress parameter is required" },
        { status: 400 },
      );
    }

    let user = null as any;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        include: { creatorProfile: true },
      });
    } else if (walletAddress) {
      const wallet = await prisma.wallet.findUnique({
        where: { circleWalletId: walletAddress },
        include: { user: { include: { creatorProfile: true } } },
      });
      user = wallet?.user ?? null;
    }

    if (!user || !user.creatorProfile) {
      return NextResponse.json({ creator: null }, { status: 200 });
    }

    return NextResponse.json({ creator: user.creatorProfile }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to check creator",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = createCreatorSchema.parse(payload);

    const user = await getOrCreateUser(data.email);
    const handle = sanitizeHandle(data.handle);

    const existing = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId: user.id }, { handle }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { creator: existing, message: "Creator already exists" },
        { status: 200 },
      );
    }

    const creator = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        handle,
        displayName: data.displayName,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
      },
    });

    // Demo: automatically create and store a receiving wallet for the creator
    try {
      const circleWallet = await ensureCircleWallet(user.email, "BASE" as any);
      await prisma.wallet.upsert({
        where: { circleWalletId: circleWallet.id },
        update: {
          address: circleWallet.address,
          network: circleWallet.network,
        },
        create: {
          userId: user.id,
          address: circleWallet.address,
          circleWalletId: circleWallet.id,
          network: circleWallet.network,
        },
      });
    } catch {
      // non-blocking for demo
    }

    return NextResponse.json({ creator });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to create creator",
      },
      { status: 400 },
    );
  }
}

