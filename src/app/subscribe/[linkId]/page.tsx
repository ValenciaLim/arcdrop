import { notFound } from "next/navigation";
import { ArcdropModal } from "@/components/arcdrop/arcdrop-modal";
import type { PaymentLinkDetail } from "@/types/arcdrop";
import { getBaseUrl } from "@/lib/base-url";
import { formatUsd } from "@/lib/utils";

type PageProps = {
  params: Promise<{
    linkId: string;
  }>;
};

async function fetchLink(slug: string): Promise<PaymentLinkDetail | null> {
  const res = await fetch(`${getBaseUrl()}/api/payment-link/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.link;
}

export default async function SubscribeCheckout({ params }: PageProps) {
  const { linkId } = await params;
  const link = await fetchLink(linkId);

  if (!link || link.type !== "SUBSCRIPTION") {
    notFound();
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl gap-12 px-6 py-16 md:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-3">
        <p className="text-sm font-semibold text-zinc-500">
          Arcdrop subscription checkout
        </p>
        <h1 className="text-4xl font-semibold text-zinc-900">{link.title}</h1>
        <p className="text-sm text-zinc-500">
          {link.description ?? "Recurring membership on Arcdrop."}
        </p>
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm font-semibold text-emerald-700">
          {link.tier
            ? `${formatUsd(link.tier.amount)} every ${link.tier.intervalDays} days`
            : "Recurring USDC payment"}
        </div>
        <div className="mt-6 rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl">
          <ArcdropModal linkSlug={link.slug} />
        </div>
      </section>
      <aside className="space-y-6 rounded-3xl border border-zinc-100 bg-white/80 p-6 shadow-xl">
        <p className="text-sm font-semibold text-zinc-600">Why Arc + Circle</p>
        <ul className="space-y-3 text-sm text-zinc-600">
          <li>• One email login = Circle Smart Wallet provisioning.</li>
          <li>• Arc session keeps gas abstracted for every renewal.</li>
          <li>• USDC can originate on any supported chain via CCTP.</li>
        </ul>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-600">
          Creator back office receives a `Subscription` record with next billing
          timestamps so you can trigger renewals via cron or webhooks.
        </div>
      </aside>
    </main>
  );
}

