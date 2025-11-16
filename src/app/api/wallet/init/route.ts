import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureCircleWallet } from "@/lib/circle";
import crypto from "crypto";

export type InitWalletRequest = {
  email: string;
  network?: "BASE" | "POLYGON" | "AVALANCHE";
};

export type InitWalletResponse = {
  userId: string;
  wallet: {
    id: string;
    address: string;
    network: "BASE" | "POLYGON" | "AVALANCHE";
  };
};

const schema = z.object({
  email: z.string().email(),
  network: z.enum(["BASE", "POLYGON", "AVALANCHE"]).default("BASE").optional(),
});

export async function POST(request: Request) {
  try {
    const { email, network } = schema.parse(await request.json());

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // If a wallet already exists, return it
    const existing = await prisma.wallet.findFirst({
      where: { userId: user.id, network: (network ?? "BASE") as any },
    });
    if (existing) {
      return NextResponse.json<InitWalletResponse>({
        userId: user.id,
        wallet: {
          id: existing.circleWalletId,
          address: existing.address,
          network: existing.network as any,
        },
      });
    }

    // Try to provision a dev-controlled wallet; if env not set, create a mock
    let address: string;
    let walletId: string;
    try {
      const circle = await ensureCircleWallet(email, (network ?? "BASE") as any);
      address = circle.address;
      walletId = circle.id;
    } catch {
      address = `0x${crypto.randomBytes(20).toString("hex")}`; // 40 hex chars
      walletId = address;
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        address,
        circleWalletId: walletId,
        network: (network ?? "BASE") as any,
      },
    });

    return NextResponse.json<InitWalletResponse>({
      userId: user.id,
      wallet: {
        id: wallet.circleWalletId,
        address: wallet.address,
        network: wallet.network as any,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to initialize wallet",
      },
      { status: 400 },
    );
  }
}


