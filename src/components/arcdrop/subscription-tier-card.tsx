 "use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/utils";
import type { SubscriptionTierSummary } from "@/types/arcdrop";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { QRCode } from "../qr-code";

type SubscriptionTierCardProps = {
  tier: SubscriptionTierSummary;
  linkSlug?: string;
};

export function SubscriptionTierCard({
  tier,
  linkSlug,
}: SubscriptionTierCardProps) {
  const href = linkSlug ? `/subscribe/${linkSlug}` : undefined;
  const [copied, setCopied] = useState(false);
  const fullUrl =
    typeof window !== "undefined" && href
      ? `${window.location.origin}${href}`
      : undefined;

  return (
    <Card className="flex flex-col gap-4 border border-zinc-100 bg-gradient-to-br from-orange-400 to-pink-500 shadow-none dark:border-zinc-800 dark:bg-zinc-900/40">
      <CardHeader>
        <CardTitle className="text-white">{tier.name}</CardTitle>
        <p className="text-sm text-500 text-white">
          {formatUsd(tier.amount)} every {tier.intervalDays} days
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-600 text-white">
          {tier.description ?? "Creator has not added a description yet."}
        </p>
        <Dialog.Root>
          <Dialog.Trigger asChild className="bg-white text-black">
            <Button variant="outline">Details</Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Dialog.Title className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {tier.name} subscription
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-zinc-500">
                    {formatUsd(tier.amount)} every {tier.intervalDays} days
                  </Dialog.Description>
                </div>

                {fullUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <QRCode value={fullUrl} />
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="truncate text-zinc-600">{fullUrl}</p>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          className="px-2 py-1 text-xs"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(fullUrl);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1200);
                            } catch {
                              /* noop */
                            }
                          }}
                        >
                          {copied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    No payment link has been generated for this tier yet.
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <Button
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/tiers/${tier.id}`, {
                          method: "DELETE",
                        });
                        if (!res.ok) throw new Error("Failed to delete tier");
                        window.location.reload();
                      } catch {
                        /* noop */
                      }
                    }}
                  >
                    Delete tier
                  </Button>
                  <Dialog.Close asChild>
                    <Button className="px-3 py-2">Close</Button>
                  </Dialog.Close>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </CardContent>
    </Card>
  );
}

