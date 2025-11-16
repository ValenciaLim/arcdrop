import Link from "next/link";
import { ArrowRight, CreditCard, Coins, QrCode, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletBalanceChecker } from "../components/arcdrop/wallet-balance-checker";
import { GetStartedButton } from "@/components/arcdrop/get-started-button";

const features = [
  {
    title: "Universal checkout",
    body: "Create one link and receive tips or subscriptions anywhere. Works across social profiles, streams, or websites.",
    icon: CreditCard,
  },
  {
    title: "Circle Smart Wallets",
    body: "Users log in with passkey, we auto-provision wallets and custody USDC with Circle.",
    icon: Shield,
  },
  {
    title: "Arc gasless execution",
    body: "Sign once to let Arc abstract gas and orchestration for every payment.",
    icon: Coins,
  },
  {
    title: "QR-ready for IRL",
    body: "Download dynamic QR codes for merch booths, events, or printed menus.",
    icon: QrCode,
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-20">
      <section className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
            Gasless USDC payouts
          </p>
          <div className="space-y-6">
            <h1 className="text-5xl font-semibold leading-tight text-zinc-950">
              Arcdrop embeds USDC tips & subscriptions anywhere a link fits.
            </h1>
            <p className="text-lg text-zinc-600">
              Share a payment link or QR, let fans pay with Circle wallets, and
              route funds cross-chain via CCTP. No embedded widget, no gas,
              fully portable.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <GetStartedButton />
          </div>
          <p className="text-sm text-zinc-500">
            Powered by Circle Smart Wallets, Arc gasless execution, and CCTP
            bridge contracts.
          </p>
        </div>

        <Card className="h-fit space-y-6 border-white/60 bg-white/95 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.5)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-500">Live example</p>
            <h2 className="text-2xl font-semibold text-zinc-900">Checkout link</h2>
          </div>
          <div className="rounded-3xl border border-zinc-100 bg-gradient-to-br from-emerald-50 to-white p-6">
            <p className="text-sm font-semibold text-emerald-700">Scan to tip</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-28 w-28 place-items-center rounded-2xl bg-white shadow-inner">
                <QrCode className="h-12 w-12 text-emerald-600" />
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-zinc-900">socials.link/arcdrop</p>
                <p className="text-zinc-500">Works on mobile and desktop.</p>
              </div>
            </div>
          </div>
          <CardContent className="space-y-4 p-0">
            {features.slice(0, 2).map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <feature.icon className="mt-1 h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    {feature.title}
                  </p>
                  <p className="text-sm text-zinc-500">{feature.body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Wallet tools
          </p>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Check your embedded wallet balance
          </h2>
          <p className="text-sm text-zinc-500">
            Enter your wallet address to preview balances for your embedded wallet.
          </p>
        </div>
        <Card className="p-4">
          <WalletBalanceChecker />
        </Card>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Why creators switch
          </p>
          <h2 className="text-3xl font-semibold text-zinc-900">
            Portable payment links that feel like native checkout.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="space-y-4">
              <feature.icon className="h-6 w-6 text-zinc-400" />
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm text-zinc-500">{feature.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
