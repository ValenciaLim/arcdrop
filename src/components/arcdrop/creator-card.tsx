 "use client";
 
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PaymentLinkSummary } from "@/types/arcdrop";
import { TipButton } from "./tip-button";
import { QRCode } from "../qr-code";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import useSWR from "swr";

type CreatorCardProps = {
  creator: {
    id: string;
    handle: string;
    displayName: string;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  tipLink?: PaymentLinkSummary;
  subscriptionLink?: PaymentLinkSummary;
};

export function CreatorCard({
  creator,
  tipLink,
  subscriptionLink,
}: CreatorCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const tipUrl = tipLink ? `${baseUrl}/tip/${tipLink.slug}` : null;
  const subUrl = subscriptionLink
    ? `${baseUrl}/subscribe/${subscriptionLink.slug}`
    : null;
  const qrValue = tipUrl ?? subUrl ?? "";

  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data: walletsData } = useSWR<{ wallets: { address: string; network: string }[] }>(
    `/api/creators/id/${creator.id}/wallets`,
    fetcher,
  );
  const primaryWallet = walletsData?.wallets?.[0]?.address;

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // noop
    }
  };

  const createDefaultTipLink = async () => {
    try {
      const res = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          type: "TIP",
          title: `Support ${creator.displayName}`,
          description: "USDC tip via Arcdrop",
          amount: 5,
        }),
      });
      if (!res.ok) return;
      window.location.reload();
    } catch {
      // noop
    }
  };

  return (
    <Card className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500">
              {creator.avatarUrl ? (
                <Image
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                  {creator.displayName.slice(0, 1)}
                </div>
              )}
            </div>
            <div>
              <CardTitle>{creator.displayName}</CardTitle>
              <CardDescription>@{creator.handle}</CardDescription>
              {primaryWallet && (
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="truncate text-zinc-500">
                    {primaryWallet}
                  </span>
                  <Button
                    className="px-2 py-1 text-xs"
                    variant="outline"
                    onClick={() => copy(primaryWallet, "wallet")}
                  >
                    {copiedKey === "wallet" ? "Copied" : "Copy"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {creator.bio ?? "Creator on Arcdrop"}
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">USDC tips</Badge>
            <Badge variant="outline">Arc gasless</Badge>
            <Badge variant="outline">CCTP cross-chain</Badge>
          </div>

          {tipLink && (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <p className="text-sm font-semibold text-zinc-700">
                Tip link
              </p>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                <p className="truncate text-zinc-600">{tipUrl}</p>
                {tipUrl && (
                  <Button
                    className="px-2 py-1 text-xs"
                    variant="outline"
                    onClick={() => copy(tipUrl, "tip")}
                  >
                    {copiedKey === "tip" ? "Copied" : "Copy"}
                  </Button>
                )}
              </div>
              <div className="mt-3 flex gap-3">
                <TipButton linkSlug={tipLink.slug} />
              </div>
            </div>
          )}

          {/* Subscription panel removed here to avoid duplication; subscriptions are shown below */}

          {!tipLink && !subscriptionLink && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                No payment links yet
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Create a tip link to share and generate a QR.
              </p>
              <div className="mt-3">
                <Button onClick={createDefaultTipLink}>Create tip link</Button>
              </div>
            </div>
          )}
        </CardContent>
      </div>

      <div className="space-y-4 rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm font-semibold text-zinc-700">Share via QR</p>
        {qrValue ? (
          <>
            <QRCode value={qrValue} />
            <p className="text-xs text-zinc-500">
              Scan to open the universal checkout modal.
            </p>
          </>
        ) : (
          <p className="text-xs text-zinc-500">
            Create a tip or subscription link to generate a QR and shareable URL.
          </p>
        )}
      </div>
    </Card>
  );
}

