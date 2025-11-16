import type {
  PaymentLinkType,
  SubscriptionStatus,
  Network,
} from "@prisma/client";

export type CreatorResponse = {
  creator: {
    id: string;
    displayName: string;
    handle: string;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  paymentLinks: Array<PaymentLinkSummary>;
  subscriptionTiers: Array<SubscriptionTierSummary>;
};

export type PaymentLinkSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  type: PaymentLinkType;
  amount?: number | null;
  tier?: SubscriptionTierSummary | null;
};

export type SubscriptionTierSummary = {
  id: string;
  name: string;
  description?: string | null;
  amount: number;
  intervalDays: number;
};

export type PaymentLinkDetail = PaymentLinkSummary & {
  creator: CreatorResponse["creator"];
};

export type PaymentIntentPayload = {
  linkSlug: string;
  userEmail: string;
  amount?: number;
  tierId?: string;
  network: Network;
};

export type SubscriptionStatusResponse = {
  subscription: {
    id: string;
    status: SubscriptionStatus;
    nextBillingAt: string;
  };
};

