import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { z } from "zod";

const syncWalletSchema = z.object({
  email: z.string().email(),
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
    const { email, walletAddress, network } = syncWalletSchema.parse(body);

    const user = await getOrCreateUser(email);

    await prisma.wallet.upsert({
      where: {
        circleWalletId: walletAddress,
      },
      create: {
        userId: user.id,
        address: walletAddress,
        circleWalletId: walletAddress,
        network,
      },
      update: {
        address: walletAddress,
        network,
      },
    });

    return NextResponse.json({ success: true });
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

