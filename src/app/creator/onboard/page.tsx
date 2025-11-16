"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function CreatorOnboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email");

  const [status, setStatus] = useState<"idle" | "checking" | "onboarding" | "redirecting">(
    "idle",
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const email = emailFromQuery ?? undefined;

  /**
   * Check if user has a creator profile.
   */
  const checkCreatorProfile = async () => {
    setStatus("checking");
    setStatusMessage("Checking creator profile…");

    if (!email) return null;
    const res = await fetch(`/api/creators?email=${encodeURIComponent(email)}`);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.creator;
  };

  // Auto flow: if email present, try to find creator; otherwise show onboarding
  useEffect(() => {
    (async () => {
      if (status !== "idle") return;
      try {
        if (email) {
          setStatus("checking");
          setStatusMessage("Checking your account…");

          const creator = await checkCreatorProfile();
          if (creator?.handle) {
            setStatus("redirecting");
            setStatusMessage("Redirecting to your creator portal…");
            router.push(`/c/${creator.handle}`);
            return;
          }
          setStatus("onboarding");
          setStatusMessage("Please complete your creator profile");
        } else {
          // No email provided: proceed directly to onboarding form
          setStatus("onboarding");
          setStatusMessage("Please complete your creator profile");
        }
      } catch (e) {
        setStatus("idle");
        setError(e instanceof Error ? e.message : "Failed to continue with social login");
        setStatusMessage(null);
      }
    })();
  }, [email, router, status]);

  if (status === "onboarding") {
    return (
      <CreatorOnboardingForm
        email={email}
        onComplete={(handle) => router.push(`/c/${handle}`)}
      />
    );
  }

  // Authenticated and processing
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
        <p className="text-sm text-zinc-500">{statusMessage ?? "Loading…"}</p>
      </div>
    </div>
  );
}

function CreatorOnboardingForm({
  email,
  onComplete,
}: {
  email?: string;
  onComplete: (handle: string) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [emailInput, setEmailInput] = useState(email ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          {
            displayName,
            handle,
            bio: bio || undefined,
            // Backend requires email to create a user -> ensure we send a value
            email: (email ?? emailInput).trim(),
          },
        ),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.message ?? "Failed to create creator profile");
      }

      const data = await res.json();
      // Ensure embedded wallet is created and attached to this creator
      try {
        let walletAddress: string | null = null;
        const stored = window.localStorage.getItem("arcdrop:lastWallet");
        if (stored) {
          walletAddress = (JSON.parse(stored).address as string) ?? null;
        }
        if (!walletAddress) {
          // Fallback: derive with passkey now
          const cfgRes = await fetch("/api/modular/config");
          if (cfgRes.ok) {
            const configData: { clientUrl: string; clientKey: string } = await cfgRes.json();
            const passkeyTransport = toPasskeyTransport(configData.clientUrl, configData.clientKey);
            let credential;
            try {
              // Prefer registration first to allow QR-based creation from desktop
              credential = await toWebAuthnCredential({
                transport: passkeyTransport,
                mode: WebAuthnMode.Register,
              });
            } catch {
              // Fallback to login if a passkey already exists
              credential = await toWebAuthnCredential({
                transport: passkeyTransport,
                mode: WebAuthnMode.Login,
              });
            }
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
            walletAddress = wallet.address;
            try {
              window.localStorage.setItem(
                "arcdrop:lastWallet",
                JSON.stringify({ address: walletAddress, network: "BASE" }),
              );
            } catch {
              /* noop */
            }
          }
        }
        if (walletAddress) {
          await fetch("/api/modular/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creatorId: data.creator.id,
              walletAddress,
              network: "BASE",
            }),
          });
        }
      } catch {
        // non-blocking
      }
      onComplete(data.creator.handle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-zinc-900">
            Create Creator Profile
          </h1>
          <p className="text-sm text-zinc-500">
            Complete your profile to start receiving tips and subscriptions
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-zinc-100 bg-white p-6 shadow-lg"
        >
          {!email && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              type="text"
              placeholder="yourhandle"
              value={handle}
              onChange={(e) =>
                setHandle(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-_]/g, "")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, ""),
                )
              }
              required
              minLength={2}
            />
            <p className="text-xs text-zinc-500">
              Your creator handle (letters, numbers, hyphens, and underscores)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <textarea
              id="bio"
              className="h-24 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm"
              placeholder="Tell your fans about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating profile…" : "Create Creator Profile"}
          </Button>
        </form>
      </div>
    </main>
  );
}

