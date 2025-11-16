 "use client";
 
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { QRCode } from "../qr-code";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useSWR from "swr";
import {
  toPasskeyTransport,
  toModularTransport,
  toCircleModularWalletClient,
  toWebAuthnCredential,
  getModularWalletAddress,
  WebAuthnMode,
} from "@circle-fin/modular-wallets-core";
import { createClient } from "viem";
import { networkToModularChain, buildModularRpcUrl } from "@/lib/modular/config";
import type { SubscriptionTierSummary, PaymentLinkSummary } from "@/types/arcdrop";
import { SubscriptionTierCard } from "./subscription-tier-card";

type Props = {
  creatorId: string;
};

type Panel = "subscriptions" | "content" | "wallet";

export function CreatorActions({ creatorId }: Props) {
  const [panel, setPanel] = useState<Panel>("subscriptions");

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge>Creator tools</Badge>
        <p className="text-sm text-zinc-500">
          Manage links, subscriptions, wallet, and content
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton
          active={panel === "subscriptions"}
          onClick={() => setPanel("subscriptions")}
        >
          Subscriptions
        </TabButton>
        <TabButton
          active={panel === "content"}
          onClick={() => setPanel("content")}
        >
          Content & Shop
        </TabButton>
        <TabButton
          active={panel === "wallet"}
          onClick={() => setPanel("wallet")}
        >
          Wallet
        </TabButton>
      </div>

      {panel === "subscriptions" && <SubscriptionsPanel creatorId={creatorId} />}
      {panel === "content" && <ContentPanel creatorId={creatorId} />}
      {panel === "wallet" && <WalletPanel creatorId={creatorId} />}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      className={cn("h-9 px-3 text-sm", !active && "bg-white")}
      onClick={onClick}
      type="button"
    >
      {children}
    </Button>
  );
}

function SubscriptionsPanel({ creatorId }: { creatorId: string }) {
  const [name, setName] = useState("Gold");
  const [amount, setAmount] = useState("10");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly">(
    "monthly",
  );
  const [isCreating, setIsCreating] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data, mutate } = useSWR<{
    creator: { id: string };
    paymentLinks: PaymentLinkSummary[];
    subscriptionTiers: SubscriptionTierSummary[];
  }>(`/api/creators/${creatorId}`, fetcher);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [subs, setSubs] = useState<
    { id: string; userEmail: string; status: string; nextBillingAt: string }[]
  >([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);

  const frequencyToDays = (f: "weekly" | "monthly" | "quarterly") =>
    f === "weekly" ? 7 : f === "monthly" ? 30 : 90;

  const onCreateTierAndLink = async () => {
    setIsCreating(true);
    try {
      // 1) Create tier
      const tierRes = await fetch("/api/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          name,
          amount: Number(amount || "0"),
          intervalDays: frequencyToDays(frequency),
        }),
      });
      if (!tierRes.ok) {
        throw new Error("Failed to create tier");
      }
      const tierData = await tierRes.json();
      const tierId = tierData.tier.id as string;

      // 2) Create subscription link for this tier
      const linkRes = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          type: "SUBSCRIPTION",
          title: `${name} tier`,
          tierId,
        }),
      });
      if (!linkRes.ok) {
        throw new Error("Failed to create subscription link");
      }
      const linkData = await linkRes.json();
      const href = `${baseUrl}/subscribe/${linkData.link.slug}`;
      setLink(href);
      setQr(href);
      // refresh list
      mutate();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
    <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Create a subscription tier
      </h3>
      <div className="mt-3 grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="tier-name">Tier name</Label>
          <Input
            id="tier-name"
            placeholder="Gold"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tier-amount">Amount (USDC)</Label>
          <Input
            id="tier-amount"
            type="number"
            min="1"
            step="0.01"
            placeholder="10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tier-frequency">Frequency</Label>
          <select
            id="tier-frequency"
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            value={frequency}
            onChange={(e) =>
              setFrequency(e.target.value as "weekly" | "monthly" | "quarterly")
            }
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <div className="space-y-2">
            <br />
            <Button onClick={onCreateTierAndLink} disabled={isCreating}>
                {isCreating ? "Creating…" : "Create tier"}
            </Button>
        </div>
      </div>

      {link && (
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="truncate text-zinc-600">{link}</p>
            <div className="mt-2">
              <Button
                variant="outline"
                className="px-2 py-1 text-xs"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                  } catch {
                    /* noop */
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </div>
          {qr && (
            <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
              <QRCode value={qr} />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Subscription tiers
        </h4>
        {!data || data.subscriptionTiers.length === 0 ? (
          <p className="text-xs text-zinc-500">No tiers yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {data.subscriptionTiers.map((tier) => {
              const tierLink = data.paymentLinks.find(
                (pl) => pl.tier?.id === tier.id,
              );
              return (
                <SubscriptionTierCard
                  key={tier.id}
                  tier={tier}
                  linkSlug={tierLink?.slug}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
    
    <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Subscribers
        </h3>
      <div className="mt-6 space-y-3">
        {!data || data.subscriptionTiers.length === 0 ? (
          <p className="text-xs text-zinc-500">Create a tier to see subscribers.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="tier-select">Tier</Label>
              <select
                id="tier-select"
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                value={selectedTierId ?? ""}
                onChange={async (e) => {
                  const tierId = e.target.value || null;
                  setSelectedTierId(tierId);
                  if (!tierId) {
                    setSubs([]);
                    return;
                  }
                  setIsLoadingSubs(true);
                  try {
                    const res = await fetch(`/api/tiers/${tierId}/subscribers`);
                    const payload = await res.json();
                    setSubs(payload.subscribers ?? []);
                  } finally {
                    setIsLoadingSubs(false);
                  }
                }}
              >
                <option value="">Select a tier</option>
                {data.subscriptionTiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            {isLoadingSubs ? (
              <p className="text-xs text-zinc-500">Loading subscribers…</p>
            ) : subs.length === 0 ? (
              <p className="text-xs text-zinc-500">No subscribers found.</p>
            ) : (
              <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white text-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {subs.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-800 dark:text-zinc-100">
                        {s.userEmail}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5",
                            s.status === "ACTIVE" && "bg-emerald-100 text-emerald-700",
                            s.status === "PAUSED" && "bg-amber-100 text-amber-700",
                            s.status === "CANCELLED" && "bg-red-100 text-red-700",
                          )}
                        >
                          {s.status}
                        </span>
                        <span className="text-zinc-500">
                          Next: {new Date(s.nextBillingAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs"
                        onClick={async () => {
                          await fetch(`/api/subscription/${s.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "ACTIVE" }),
                          });
                          if (selectedTierId) {
                            const res = await fetch(
                              `/api/tiers/${selectedTierId}/subscribers`,
                            );
                            const payload = await res.json();
                            setSubs(payload.subscribers ?? []);
                          }
                        }}
                      >
                        Resume
                      </Button>
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs"
                        onClick={async () => {
                          await fetch(`/api/subscription/${s.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "PAUSED" }),
                          });
                          if (selectedTierId) {
                            const res = await fetch(
                              `/api/tiers/${selectedTierId}/subscribers`,
                            );
                            const payload = await res.json();
                            setSubs(payload.subscribers ?? []);
                          }
                        }}
                      >
                        Pause
                      </Button>
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs"
                        onClick={async () => {
                          await fetch(`/api/subscription/${s.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "CANCELLED" }),
                          });
                          if (selectedTierId) {
                            const res = await fetch(
                              `/api/tiers/${selectedTierId}/subscribers`,
                            );
                            const payload = await res.json();
                            setSubs(payload.subscribers ?? []);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

function ContentPanel({ creatorId }: { creatorId: string }) {
  const [itemName, setItemName] = useState("Digital Download");
  const [price, setPrice] = useState("5");
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const onCreateItem = async () => {
    setIsCreating(true);
    try {
      // For now, model one-time purchase as a TIP link with a fixed amount.
      // Include uploaded file URL in metadata if present.
      const res = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          type: "TIP",
          title: itemName || "Digital Item",
          amount: Number(price || "0"),
          metadata: uploadUrl ? { fileUrl: uploadUrl } : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create item link");
      const data = await res.json();
      const href = `${baseUrl}/tip/${data.link.slug}`;
      setLink(href);
      setQr(href);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
    <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Content
      </h3>
      <p className="mt-2 text-sm text-zinc-500">
        Create a one-time purchase link. Uploading a file will attach its URL as metadata.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="item-name">Item name</Label>
          <Input id="item-name" placeholder="Sticker pack" value={itemName} onChange={(e) => setItemName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-price">Price (USDC)</Label>
          <Input id="item-price" type="number" min="1" step="0.01" placeholder="5" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="upload-file">Upload file (optional)</Label>
          <Input
            id="upload-file"
            type="file"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const form = new FormData();
                form.append("file", file);
                const res = await fetch("/api/uploads", {
                  method: "POST",
                  body: form,
                });
                if (!res.ok) throw new Error("Upload failed");
                const payload = await res.json();
                setUploadUrl(payload.url as string);
              } finally {
                setUploading(false);
              }
            }}
          />
          {uploadUrl && (
            <p className="truncate text-xs text-zinc-500">Uploaded: {uploadUrl}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <div className="inline-flex">
            <Button onClick={onCreateItem} disabled={isCreating || uploading}>
            {isCreating ? "Creating…" : uploading ? "Uploading…" : "Create item link"}
            </Button>
        </div>
        <div className="inline-flex">
            <Button disabled={true}>
                Attach to tier (coming soon)
            </Button>
        </div>
      </div>

      {link && (
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="truncate text-zinc-600">{link}</p>
            <div className="mt-2">
              <Button
                variant="outline"
                className="px-2 py-1 text-xs"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                  } catch {
                    /* noop */
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </div>
          {qr && (
            <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
              <QRCode value={qr} />
            </div>
          )}
        </div>
      )}
    </div>

    <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Shop
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
            Merchandise shop (coming soon)
        </p>
    </div>
    </>
  );
}


function WalletPanel({ creatorId }: { creatorId: string }) {
  const [amount, setAmount] = useState("0");
  const [withdrawing, setWithdrawing] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [dstNetwork, setDstNetwork] = useState<"BASE" | "POLYGON" | "AVALANCHE">("BASE");
  const [withdrawStatus, setWithdrawStatus] = useState<null | { steps: { status: "BURNED" | "ATTESTED" | "MINTED"; txHash?: string }[] }>(null);
  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  // Fetch wallets by creator DB id
  const {
    data,
    isLoading,
    mutate: reloadWallets,
  } = useSWR<{
    wallets: { address: string; network: string }[];
  }>(`/api/creators/id/${creatorId}/wallets`, fetcher);

  const primary = data?.wallets?.[0];

  // Config for passkey + modular
  const { data: configData } = useSWR<{ clientUrl: string; clientKey: string }>(
    "/api/modular/config",
    fetcher,
  );

  const { data: balanceData, isLoading: balLoading, mutate: reloadBal } = useSWR<{
    walletAddress?: string;
    totalUsd?: number;
    balances?: { USDC?: number };
    wallets?: { address: string; network: string }[];
  }>(
    primary?.address ? ["/api/wallet/balance", primary.address] : null,
    ([url, addr]) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: addr }),
      }).then(async (r) => (r.ok ? r.json() : null)),
  );

  const onEnsureWallet = async () => {
    if (!configData) return;
    setInitializing(true);
    try {
      // 1) Passkey login or register
      const passkeyTransport = toPasskeyTransport(
        configData.clientUrl,
        configData.clientKey,
      );
      let credential;
      try {
        credential = await toWebAuthnCredential({
          transport: passkeyTransport,
          mode: WebAuthnMode.Login,
        });
      } catch {
        credential = await toWebAuthnCredential({
          transport: passkeyTransport,
          mode: WebAuthnMode.Register,
        });
      }

      // 2) Derive modular wallet with passkey owner
      const chain = networkToModularChain("BASE");
      const rpc = buildModularRpcUrl(configData.clientUrl, chain);
      const transport = toModularTransport(rpc, configData.clientKey);
      const client = createClient({ transport });
      const mw = toCircleModularWalletClient({ client });
      const { toWebAuthnAccount } = await import("viem/account-abstraction");
      const owner = toWebAuthnAccount({ credential });
      const wallet = await getModularWalletAddress({
        client: mw,
        owner,
        name: `Arcdrop-BASE`,
      } as any);

      // 3) Sync wallet to backend
      await fetch("/api/modular/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: wallet.address,
          network: "BASE",
        }),
      });

      // 4) Reload wallet list
      await reloadWallets();
    } finally {
      setInitializing(false);
    }
  };

  const onWithdraw = async () => {
    if (!primary?.address) return;
    setShowWithdraw(true);
  };

  const confirmWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawStatus(null);
    try {
      const res = await fetch("/api/cctp-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount || "0"),
          sourceNetwork: (primary?.network as "BASE" | "POLYGON" | "AVALANCHE") ?? "BASE",
          destinationNetwork: dstNetwork,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message ?? "CCTP transfer failed");
      }
      setWithdrawStatus(payload);
      await reloadBal();
    } catch (e) {
      setWithdrawStatus({ steps: [{ status: "BURNED" } as any] });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Wallet
      </h3>
      {isLoading ? (
        <p className="mt-2 text-sm text-zinc-500">Loading wallet…</p>
      ) : !primary ? (
        <p className="mt-2 text-sm text-zinc-500">No wallet found for this creator.</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <p className="truncate text-zinc-700 dark:text-zinc-200">
              {primary.address}
            </p>
            <p className="text-zinc-500">{primary.network}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">
              Balance:{" "}
              {balLoading || !balanceData
                ? "…"
                : Number(
                    (typeof balanceData.totalUsd === "number"
                      ? balanceData.totalUsd
                      : balanceData.balances?.USDC ?? 0),
                  ).toFixed(2)}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Withdraw amount (USDC)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={onWithdraw} disabled={withdrawing || !amount}>
                {withdrawing ? "Withdrawing…" : "Withdraw"}
              </Button>
            </div>
          </div>

          <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>CCTP Withdraw</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="truncate">{primary?.address ?? ""}</p>
                    <p className="text-zinc-500">{primary?.network ?? ""}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dst-network">Destination Network</Label>
                    <select
                      id="dst-network"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                      value={dstNetwork}
                      onChange={(e) =>
                        setDstNetwork(e.target.value as "BASE" | "POLYGON" | "AVALANCHE")
                      }
                    >
                      <option value="BASE">BASE</option>
                      <option value="POLYGON">POLYGON</option>
                      <option value="AVALANCHE">AVALANCHE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dst-amount">Amount (USDC)</Label>
                    <Input
                      id="dst-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                {withdrawStatus && (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">
                      Transfer Progress
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-xs text-zinc-600">
                      {withdrawStatus.steps.map((s, i) => (
                        <li key={i}>
                          {s.status}
                          {s.txHash ? ` • ${s.txHash}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                  <Button onClick={confirmWithdraw} disabled={withdrawing || !amount}>
                    {withdrawing ? "Transferring…" : "Confirm Withdraw"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

 