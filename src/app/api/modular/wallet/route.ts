import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const syncWalletSchema = z.object({
  email: z.string().email().optional(),
  creatorId: z.string().cuid().optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  network: z.enum(["BASE", "POLYGON", "AVALANCHE"]),
});

/**
 * POST /api/modular/wallet
 * Syncs a modular wallet address from the client to the database.
 * Called after passkey login/wallet creation completes.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, walletAddress, network, creatorId } = syncWalletSchema.parse(body);

    // Resolve user:
    // Priority: creatorId → email → existing wallet mapping → synthetic email fallback
    let user = null as null | { id: string };
    if (creatorId) {
      const creator = await prisma.creatorProfile.findUnique({
        where: { id: creatorId },
        select: { userId: true },
      });
      if (creator?.userId) {
        user = { id: creator.userId };
      }
    }
    if (!user && email) {
      user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
        select: { id: true },
      });
    }
    if (!user) {
      const existingWallet = await prisma.wallet.findUnique({
        where: { circleWalletId: walletAddress },
        select: { userId: true },
      });
      if (existingWallet) {
        user = { id: existingWallet.userId };
      } else if (!email && !creatorId) {
        const syntheticEmail = `${walletAddress.toLowerCase()}@arcdrop.local`;
        user = await prisma.user.create({
          data: { email: syntheticEmail },
          select: { id: true },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { message: "Unable to resolve user for wallet sync" },
        { status: 400 },
      );
    }

    const wallet = await prisma.wallet.upsert({
      where: {
        circleWalletId: walletAddress,
      },
      create: {
        userId: user!.id,
        address: walletAddress,
        circleWalletId: walletAddress,
        network,
      },
      update: {
        address: walletAddress,
        network,
      },
    });

    return NextResponse.json({ wallet: { address: wallet.address, network: wallet.network } });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to sync wallet",
      },
      { status: 400 },
    );
  }
}

