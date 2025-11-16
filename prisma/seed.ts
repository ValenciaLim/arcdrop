import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@arcdrop.app" },
    update: {},
    create: {
      email: "demo@arcdrop.app",
      name: "Demo Creator",
    },
  });

  // Create demo creator profile
  const demoCreator = await prisma.creatorProfile.upsert({
    where: { handle: "demo" },
    update: {},
    create: {
      userId: demoUser.id,
      handle: "demo",
      displayName: "Demo Creator",
      bio: "This is a demo creator profile for testing Arcdrop.",
    },
  });

  // Create demo tip link
  const demoTipLink = await prisma.paymentLink.upsert({
    where: { slug: "demo-tip" },
    update: {},
    create: {
      slug: "demo-tip",
      creatorId: demoCreator.id,
      type: "TIP",
      title: "Support Demo Creator",
      description: "Send a tip to support this demo creator!",
      amount: 10,
    },
  });

  // Create demo subscription tier
  let demoTier = await prisma.subscriptionTier.findFirst({
    where: {
      creatorId: demoCreator.id,
      name: "Basic Support",
    },
  });

  if (!demoTier) {
    demoTier = await prisma.subscriptionTier.create({
      data: {
        creatorId: demoCreator.id,
        name: "Basic Support",
        description: "Basic subscription tier for demo purposes",
        amount: 25,
        intervalDays: 30,
      },
    });
  }

  // Create demo subscription link
  const demoSubLink = await prisma.paymentLink.upsert({
    where: { slug: "demo-subscription" },
    update: {},
    create: {
      slug: "demo-subscription",
      creatorId: demoCreator.id,
      type: "SUBSCRIPTION",
      title: "Subscribe to Demo Creator",
      description: "Monthly subscription to support the demo creator",
      tierId: demoTier.id,
    },
  });

  console.log("✅ Seeded demo creator:", {
    handle: demoCreator.handle,
    tipLink: demoTipLink.slug,
    subscriptionLink: demoSubLink.slug,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

