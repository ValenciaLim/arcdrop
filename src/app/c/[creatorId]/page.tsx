import { notFound } from "next/navigation";
import { CreatorCard } from "@/components/arcdrop/creator-card";
import { CreatorActions } from "@/components/arcdrop/creator-actions";
import { SubscriptionTierCard } from "@/components/arcdrop/subscription-tier-card";
import type { CreatorResponse } from "@/types/arcdrop";
import { getBaseUrl } from "@/lib/base-url";

type PageProps = {
  params: Promise<{
    creatorId: string;
  }>;
};

async function fetchCreator(handle: string): Promise<CreatorResponse | null> {
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/creators/${handle}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function CreatorPage({ params }: PageProps) {
  const { creatorId } = await params;
  const data = await fetchCreator(creatorId);

  if (!data) {
    notFound();
  }

  const tipLink = data.paymentLinks.find((link) => link.type === "TIP");
  const subLinks = data.paymentLinks.filter(
    (link) => link.type === "SUBSCRIPTION",
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
      <CreatorCard
        creator={data.creator}
        tipLink={tipLink}
        subscriptionLink={subLinks[0]}
      />

      <CreatorActions creatorId={data.creator.id} />

      {/* Subscription tiers & subscribers are shown inside the Subscriptions tab only */}

    </main>
  );
}

