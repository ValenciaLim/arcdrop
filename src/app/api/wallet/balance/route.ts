import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUSDCBalance } from "@/lib/circle";

type Body = {
  email?: string;
  walletAddress?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const { email, walletAddress } = body || {};

    if (!email && !walletAddress) {
      return NextResponse.json(
        { message: "Provide email or walletAddress" },
        { status: 400 },
      );
    }

    if (walletAddress) {
      const wallet = await prisma.wallet.findFirst({
        where: { address: walletAddress },
        include: { user: { include: { creatorProfile: true } } },
      });
      const wallets = wallet
        ? [{ address: wallet.address, network: wallet.network }]
        : [];
      let usdc = await getUSDCBalance(walletAddress);

      // Fallback: derive from settled tips if mock balance not tracked or zero
      if (usdc === 0 && wallet?.user?.creatorProfile) {
        const agg = await prisma.tip.aggregate({
          _sum: { amount: true },
          where: { creatorId: wallet.user.creatorProfile.id, status: "SETTLED" as any },
        });
        usdc = Number(agg._sum.amount ?? 0);
      }
      return NextResponse.json({
        walletAddress,
        balances: { USDC: usdc },
        totalUsd: usdc,
        wallets,
      });
    }

    // Email path preserved for compatibility
    const user = await prisma.user.findUnique({
      where: { email: email! },
      include: { wallets: true },
    });
    const wallets =
      user?.wallets.map((w) => ({ address: w.address, network: w.network })) ??
      [];
    const firstAddress = wallets[0]?.address;
    const usdc = firstAddress ? await getUSDCBalance(firstAddress) : 0;
    return NextResponse.json({
      email,
      balances: { USDC: usdc },
      totalUsd: usdc,
      wallets,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to fetch balance",
      },
      { status: 500 },
    );
  }
}
