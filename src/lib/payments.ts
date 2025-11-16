import {
  Network,
  PaymentLinkType,
  SubscriptionStatus,
  TipStatus,
} from "@prisma/client";
import { prisma } from "./prisma";
import { transferUSDC } from "./circle";
import { executeGaslessTransaction } from "./arc";
import { bridgeUSDC } from "./cctp";
import { getOrCreateUser } from "./auth";

export async function processTip(params: {
  linkSlug: string;
  userEmail: string;
  walletAddress: string;
  amount?: number;
  network: Network;
}) {
  const link = await prisma.paymentLink.findUnique({
    where: { slug: params.linkSlug },
    include: { creator: { include: { user: { include: { wallets: true } } } } },
  });

  if (!link) {
    throw new Error("Payment link not found");
  }

  if (link.type !== PaymentLinkType.TIP) {
    throw new Error("Link is not configured for tips");
  }

  const amount = params.amount ?? Number(link.amount ?? 0);
  if (!amount || amount <= 0) {
    throw new Error("A positive tip amount is required");
  }

  const user = await getOrCreateUser(params.userEmail);

  // Look up user's modular wallet by address
  const userWallet = await prisma.wallet.findFirst({
    where: {
      userId: user.id,
      address: params.walletAddress,
      network: params.network,
    },
  });

  if (!userWallet) {
    throw new Error(
      `Wallet ${params.walletAddress} not found for user ${params.userEmail} on ${params.network}`,
    );
  }

  // Look up or create creator wallet (for now, use first wallet or create placeholder)
  const creatorWallet =
    link.creator.user.wallets.find((w) => w.network === params.network) ??
    (await prisma.wallet.create({
      data: {
        userId: link.creator.user.id,
        address: `0x${"0".repeat(40)}`, // Placeholder - creator should set up their wallet
        circleWalletId: `0x${"0".repeat(40)}`,
        network: params.network,
      },
    }));

  const tip = await prisma.tip.create({
    data: {
      creatorId: link.creatorId,
      paymentLinkId: link.id,
      fromUserId: user.id,
      amount,
      status: TipStatus.PENDING,
    },
  });

  // CCTP bridging disabled: Arc-only network flow

  const transfer = await transferUSDC({
    fromWallet: {
      id: userWallet.circleWalletId,
      address: userWallet.address,
      network: userWallet.network,
    },
    toWallet: {
      id: creatorWallet.circleWalletId,
      address: creatorWallet.address,
      network: creatorWallet.network,
    },
    amount,
  });

  const { arcSessionId } = await executeGaslessTransaction({
    walletId: creatorWallet.circleWalletId,
    targetNetwork: creatorWallet.network,
  });

  const updated = await prisma.tip.update({
    where: { id: tip.id },
    data: {
      status: TipStatus.SETTLED,
      txHash: transfer.txHash,
      metadata: {
        arcSessionId,
      },
    },
  });

  return updated;
}

export async function processSubscription(params: {
  linkSlug: string;
  userEmail: string;
  walletAddress: string;
  network: Network;
}) {
  const link = await prisma.paymentLink.findUnique({
    where: { slug: params.linkSlug },
    include: {
      tier: true,
      creator: { include: { user: { include: { wallets: true } } } },
    },
  });

  if (!link || link.type !== PaymentLinkType.SUBSCRIPTION) {
    throw new Error("Subscription link not found");
  }

  if (!link.tier) {
    throw new Error("Subscription tier missing");
  }

  const user = await getOrCreateUser(params.userEmail);

  // Look up user's modular wallet by address
  const userWallet = await prisma.wallet.findFirst({
    where: {
      userId: user.id,
      address: params.walletAddress,
      network: params.network,
    },
  });

  if (!userWallet) {
    throw new Error(
      `Wallet ${params.walletAddress} not found for user ${params.userEmail} on ${params.network}`,
    );
  }

  const subscription = await prisma.subscription.upsert({
    where: {
      userId_tierId: {
        userId: user.id,
        tierId: link.tier.id,
      },
    },
    create: {
      userId: user.id,
      tierId: link.tier.id,
      status: SubscriptionStatus.ACTIVE,
      nextBillingAt: new Date(
        Date.now() + link.tier.intervalDays * 24 * 60 * 60 * 1000,
      ),
      lastPaymentAt: new Date(),
    },
    update: {
      status: SubscriptionStatus.ACTIVE,
      nextBillingAt: new Date(
        Date.now() + link.tier.intervalDays * 24 * 60 * 60 * 1000,
      ),
      lastPaymentAt: new Date(),
    },
    include: { tier: true },
  });

  // Look up or create creator wallet (for now, use first wallet or create placeholder)
  const creatorWallet =
    link.creator.user.wallets.find((w) => w.network === params.network) ??
    (await prisma.wallet.create({
      data: {
        userId: link.creator.user.id,
        address: `0x${"0".repeat(40)}`, // Placeholder - creator should set up their wallet
        circleWalletId: `0x${"0".repeat(40)}`,
        network: params.network,
      },
    }));

  // CCTP bridging disabled: Arc-only network flow

  const transfer = await transferUSDC({
    fromWallet: {
      id: userWallet.circleWalletId,
      address: userWallet.address,
      network: userWallet.network,
    },
    toWallet: {
      id: creatorWallet.circleWalletId,
      address: creatorWallet.address,
      network: creatorWallet.network,
    },
    amount: Number(link.tier.amount),
  });

  const { arcSessionId } = await executeGaslessTransaction({
    walletId: creatorWallet.circleWalletId,
    targetNetwork: creatorWallet.network,
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      payments: {
        ...((subscription.payments as Record<string, unknown>) ?? {}),
        [Date.now()]: {
          txHash: transfer.txHash,
          arcSessionId,
        },
      },
    },
  });

  return { subscriptionId: subscription.id, txHash: transfer.txHash, arcSessionId };
}

