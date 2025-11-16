"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsd } from "@/lib/utils";
import type { PaymentLinkDetail } from "@/types/arcdrop";
import {
  toPasskeyTransport,
  toModularTransport,
  toCircleModularWalletClient,
  toWebAuthnCredential,
  getModularWalletAddress,
  WebAuthnMode,
} from "@circle-fin/modular-wallets-core";
import { createClient } from "viem";
import { networkToModularChain } from "@/lib/modular/config";

type ModalState = "idle" | "loading" | "success" | "error";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to load payment link");
    return res.json();
  });

type Network = "BASE";
const NETWORKS: Network[] = ["BASE"];

type ModularConfig = {
  clientUrl: string;
  clientKey: string;
  defaultChain: string;
};

type ArcdropModalProps = {
  linkSlug: string;
};

export function ArcdropModal({ linkSlug }: ArcdropModalProps) {
  const { data, isLoading, error, mutate } = useSWR<{ link: PaymentLinkDetail }>(
    `/api/payment-link/${linkSlug}`,
    fetcher,
  );

  const { data: configData } = useSWR<ModularConfig>(
    "/api/modular/config",
    fetcher,
  );

  const [email, setEmail] = useState("");
  const [network] = useState<Network>("BASE");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<ModalState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (data?.link?.amount) {
      setAmount(`${data.link.amount}`);
    }
  }, [data]);

  const readyToPay =
    !!email &&
    !!configData &&
    (data?.link.type === "SUBSCRIPTION" || Number(amount) > 0) &&
    status !== "loading" &&
    !isAuthenticating;

  /**
   * Authenticate user with passkey (login or register).
   */
  const authenticateWithPasskey = async (config: ModularConfig) => {
    setIsAuthenticating(true);
    setStatusMessage("Authenticating with passkey…");

    try {
      const passkeyTransport = toPasskeyTransport(config.clientUrl, config.clientKey);

      // Try login first
      try {
        const credential = await toWebAuthnCredential({
          transport: passkeyTransport,
          mode: WebAuthnMode.Login,
        });
        setStatusMessage("Passkey login successful");
        return credential;
      } catch (loginError) {
        // If login fails, try registration
        setStatusMessage("Creating new passkey…");
        const credential = await toWebAuthnCredential({
          transport: passkeyTransport,
          username: email,
          mode: WebAuthnMode.Register,
        });
        setStatusMessage("Passkey created successfully");
        return credential;
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Get or create modular wallet address for the authenticated user.
   */
  const ensureModularWallet = async (
    config: ModularConfig,
    credential: Awaited<ReturnType<typeof toWebAuthnCredential>>,
  ) => {
    setStatusMessage("Setting up modular wallet…");

    const modularChain = networkToModularChain(network);
    const modularTransport = toModularTransport(
      `${config.clientUrl}/${modularChain}`,
      config.clientKey,
    );

    const viemClient = createClient({ transport: modularTransport });
    const modularClient = toCircleModularWalletClient({ client: viemClient });

    // Create WebAuthn account from credential
    const { toWebAuthnAccount } = await import("viem/account-abstraction");
    const webAuthnAccount = toWebAuthnAccount({ credential });

    // Get or create wallet address
    const wallet = await getModularWalletAddress({
      client: modularClient,
      owner: webAuthnAccount,
      name: `Arcdrop-${network}`,
    });

    return wallet.address;
  };

  /**
   * Sync wallet address to backend.
   */
  const syncWalletToBackend = async (address: string) => {
    const res = await fetch("/api/modular/wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        walletAddress: address,
        network,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body?.message ?? "Failed to sync wallet");
    }
  };

  const handlePay = async () => {
    if (!readyToPay || !configData) return;

    try {
      setStatus("loading");
      setStatusMessage("Authenticating with passkey…");

      // Step 1: Authenticate with passkey
      const credential = await authenticateWithPasskey(configData);

      // Step 2: Get or create modular wallet
      const address = await ensureModularWallet(configData, credential);
      setWalletAddress(address);

      // Step 3: Sync wallet to backend
      await syncWalletToBackend(address);

      // Step 4: Process payment
      setStatusMessage("Processing gasless transfer via Arc…");

      const payload = {
        linkSlug,
        userEmail: email,
        walletAddress: address,
        amount:
          data?.link.type === "TIP"
            ? Number(amount || data.link.amount || 0)
            : undefined,
        tierId: data?.link.tier?.id,
        network,
      };

      const res = await fetch("/api/pay", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.message ?? "Unable to process payment");
      }

      setStatus("success");
      setStatusMessage(
        data?.link.type === "TIP"
          ? "Tip settled via Circle + Arc"
          : "Subscription activated",
      );
      mutate();
    } catch (err) {
      setStatus("error");
      setStatusMessage(err instanceof Error ? err.message : "Payment failed");
    }
  };

  if (isLoading || !configData) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
        <div className="h-32 w-full animate-pulse rounded-3xl bg-zinc-100" />
      </div>
    );
  }

  if (error || !data?.link) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Unable to load checkout. This payment link might be expired.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="success">
          {data.link.type === "TIP" ? "USDC Tip" : "Subscription"}
        </Badge>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            {data.link.title}
          </h2>
          <p className="text-sm text-zinc-500">{data.link.description}</p>
        </div>
      </header>

      <section className="space-y-4 rounded-3xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">Circle Modular Wallet</span>
          <span className="font-semibold text-zinc-900">Embedded</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">Arc Gasless Execution</span>
          <span className="font-semibold text-zinc-900">Included</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">Network</span>
          <span className="font-semibold text-zinc-900">Arc (auto)</span>
        </div>
      </section>

      <form
        className="space-y-4"
        onSubmit={(evt) => {
          evt.preventDefault();
          handlePay();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@wallet.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        {data.link.type === "TIP" ? (
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="25"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {data.link.tier?.name} •{" "}
            {formatUsd(data.link.tier?.amount ?? data.link.amount ?? 0)} /{" "}
            {data.link.tier
              ? `${data.link.tier.intervalDays}-day`
              : "monthly"}
          </div>
        )}

        {/* Network selection disabled: Arc only */}

        {statusMessage && (
          <div
            className={`rounded-2xl border p-3 text-sm ${
              status === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {statusMessage}
          </div>
        )}

        <Button type="submit" disabled={!readyToPay}>
          {status === "loading" || isAuthenticating
            ? "Processing via Arc…"
            : data.link.type === "TIP"
              ? `Send ${formatUsd(
                  Number(amount || data.link.amount || 0),
                )}`
              : `Activate · ${formatUsd(
                  data.link.tier?.amount ?? data.link.amount ?? 0,
                )}`}
        </Button>
      </form>
    </div>
  );
}
