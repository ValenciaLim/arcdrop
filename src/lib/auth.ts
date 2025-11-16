import { prisma } from "./prisma";

/**
 * Simplified auth helper that creates a User record on demand.
 */
export async function getOrCreateUser(email: string) {
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { wallets: true },
  });

  if (existing) return existing;

  return prisma.user.create({
    data: {
      email,
    },
    include: { wallets: true },
  });
}

