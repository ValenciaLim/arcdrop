import { notFound } from "next/navigation";
import { ArcdropModal } from "@/components/arcdrop/arcdrop-modal";
import type { PaymentLinkDetail } from "@/types/arcdrop";
import { getBaseUrl } from "@/lib/base-url";

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

export default async function TipCheckout({ params }: PageProps) {
  const { linkId } = await params;
  const link = await fetchLink(linkId);

  if (!link || link.type !== "TIP") {
    notFound();
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-4xl gap-12 px-6 py-16 md:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-3">
        <p className="text-sm font-semibold text-zinc-500">Arcdrop checkout</p>
        <h1 className="text-4xl font-semibold text-zinc-900">{link.title}</h1>
        <p className="text-sm text-zinc-500">
          {link.description ??
            "Instant USDC tips with Circle Smart Wallets and Arc gasless execution."}
        </p>
        <div className="mt-6 rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl">
          <ArcdropModal linkSlug={link.slug} />
        </div>
      </section>
      <aside className="space-y-6 rounded-3xl border border-zinc-100 bg-white/80 p-6 shadow-xl">
        <p className="text-sm font-semibold text-zinc-600">How it works</p>
        <ol className="space-y-4 text-sm text-zinc-600">
          <li>
            1. Log in with your email. We create a Circle wallet behind the
            scenes.
          </li>
          <li>2. Pick any supported network. Arc handles the gas for you.</li>
          <li>
            3. USDC crosses chains via CCTP and lands in the creator’s wallet.
          </li>
        </ol>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700">
          Every payment is logged in Prisma/Postgres so you can reconcile tips
          and payouts programmatically.
        </div>
      </aside>
    </main>
  );
}

