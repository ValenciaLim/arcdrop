import { Network } from "@prisma/client";
import { z } from "zod";

export const createCreatorSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  handle: z.string().min(2),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().optional(),
});

export const paymentLinkSchema = z.object({
  creatorId: z.string().cuid(),
  type: z.enum(["TIP", "SUBSCRIPTION"]),
  title: z.string().min(2),
  description: z.string().optional(),
  amount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const parsed = typeof val === "number" ? val : Number.parseFloat(val);
      if (Number.isNaN(parsed)) {
        throw new Error("Amount must be numeric");
      }
      return parsed;
    }),
  tierId: z.string().cuid().optional(),
  metadata: z.record(z.any()).optional(),
});

export const payRequestSchema = z.object({
  linkSlug: z.string().min(4),
  userEmail: z.string().email(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.number().positive().optional(),
  tierId: z.string().cuid().optional(),
  network: z.enum(["BASE", "POLYGON", "AVALANCHE"]).default("BASE"),
});

export const subscriptionStatusQuery = z.object({
  id: z.string().cuid(),
});

export const circleSessionRequestSchema = z.object({
  email: z.string().email(),
});

export const circleEnsureWalletSchema = circleSessionRequestSchema.extend({
  network: z.nativeEnum(Network),
});

export type CreateCreatorInput = z.infer<typeof createCreatorSchema>;
export type CreatePaymentLinkInput = z.infer<typeof paymentLinkSchema>;
export type PayRequestInput = z.infer<typeof payRequestSchema>;

