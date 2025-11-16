import Link from "next/link";
import { ArrowRight, CreditCard, Coins, QrCode, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Launch in minutes",
    body: "Create a profile, share your payment link, and start receiving USDC.",
    icon: CreditCard,
  },
  {
    title: "Circle Modular Wallets",
    body: "Passkey-authenticated smart wallets for your fans and your payouts.",
    icon: Shield,
  },
  {
    title: "Arc gasless execution",
    body: "We abstract gas and orchestration for seamless payments.",
    icon: Coins,
  },
  {
    title: "QR-ready for IRL",
    body: "Dynamic QR codes for events, merch booths, and in-person flows.",
    icon: QrCode,
  },
];

export default function CreatorHome() {
  return (
    <div className="min-h-screen bg-indigo-50">
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-20">
      <section className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 shadow-sm">
            Creator Portal
          </p>
          <div className="space-y-6">
            <h1 className="text-5xl font-semibold leading-tight text-indigo-950">
              Manage your Arcdrop links, tiers, and payouts.
            </h1>
            <p className="text-lg text-slate-600">
              Set up your profile, create tip or subscription links, and share
              them anywhere. Authentication happens when you take action.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/creator/onboard">Get started</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/c/demo" className="inline-flex items-center gap-2">
                View demo portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-slate-500">
            Powered by Circle Modular Wallets, Arc gasless execution, and CCTP
            bridge contracts.
          </p>
        </div>

        <Card className="h-fit space-y-6 border-indigo-100 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(49,46,129,0.4)]">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">Creator view</p>
            <h2 className="text-2xl font-semibold text-slate-900">Your tools</h2>
          </div>
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6">
            <p className="text-sm font-semibold text-indigo-700">Tip link</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-28 w-28 place-items-center rounded-2xl bg-white shadow-inner ring-1 ring-indigo-100">
                <QrCode className="h-12 w-12 text-indigo-600" />
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-slate-900">your.link/tip</p>
                <p className="text-slate-500">Share anywhere, scan IRL.</p>
              </div>
            </div>
          </div>
          <CardContent className="space-y-4 p-0">
            {features.slice(0, 2).map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <feature.icon className="mt-1 h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {feature.title}
                  </p>
                    <p className="text-sm text-slate-500">{feature.body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            What you can do
          </p>
          <h2 className="text-3xl font-semibold text-indigo-900">
            Create links, share QR codes, track payouts.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="space-y-4 border-indigo-100">
              <feature.icon className="h-6 w-6 text-indigo-400" />
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
    </div>
  );
}


