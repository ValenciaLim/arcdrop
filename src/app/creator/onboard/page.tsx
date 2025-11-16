"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toModularTransport } from "@circle-fin/modular-wallets-core";
import { createClient } from "viem";
import { networkToModularChain } from "@/lib/modular/config";
import useSWR from "swr";

type ModularConfig = {
  clientUrl: string;
  clientKey: string;
  defaultChain: string;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to load config");
    return res.json();
  });

export default function CreatorOnboard() {
  const router = useRouter();
  const { data: configData } = useSWR<ModularConfig>(
    "/api/modular/config",
    fetcher,
  );

  const [email, setEmail] = useState("");
  const [network, setNetwork] = useState<"BASE" | "POLYGON" | "AVALANCHE">(
    "BASE",
  );
  const [status, setStatus] = useState<"idle" | "checking" | "onboarding" | "redirecting">(
    "idle",
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress] = useState<string | null>(null);

  // Preflight modular transport (no passkey, no owner auth)
  const preflightModular = async (config: ModularConfig) => {
    setStatusMessage("Initializing wallet transport…");
    const modularChain = networkToModularChain(network);
    const rpc = `${config.clientUrl}/${modularChain}`;
    const transport = toModularTransport(rpc, config.clientKey);
    // Creates a client instance; no network call required here
    void createClient({ transport });
  };

  /**
   * Check if user has a creator profile.
   */
  const checkCreatorProfile = async () => {
    setStatus("checking");
    setStatusMessage("Checking creator profile…");

    const res = await fetch(`/api/creators?email=${encodeURIComponent(email)}`);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.creator;
  };

  const handleAuthenticate = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setError(null);
      // Step 1: Initialize modular transport (no passkey)
      if (configData) {
        await preflightModular(configData);
      }

      // Step 2: Check if user has creator profile
      const creator = await checkCreatorProfile();

      if (creator) {
        // User has creator profile, redirect to their portal
        setStatus("redirecting");
        setStatusMessage("Redirecting to your creator portal…");
        router.push(`/c/${creator.handle}`);
      } else {
        // User needs to create creator profile
        setStatus("onboarding");
        setStatusMessage("Please complete your creator profile");
      }
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Authentication failed");
      setStatusMessage(null);
    }
  };

  if (!configData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "onboarding") {
    return (
      <CreatorOnboardingForm
        email={email}
        walletAddress={walletAddress!}
        onComplete={(handle) => router.push(`/c/${handle}`)}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-zinc-900">
            Creator Portal
          </h1>
          <p className="text-sm text-zinc-500">
            Sign in with your embedded wallet to access your creator dashboard
          </p>
        </div>

        <div className="space-y-4 rounded-3xl border border-zinc-100 bg-white p-6 shadow-lg">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status !== "idle"}
              required
            />
          </div>

        {/* Network selection removed: Arc-only path */}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {statusMessage}
            </div>
          )}

          <Button
            onClick={handleAuthenticate}
            disabled={!email || status !== "idle"}
            className="w-full"
          >
            {status === "idle"
              ? "Continue"
              : status === "checking"
                ? "Checking profile…"
                : "Redirecting…"}
          </Button>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Wallet creation will occur later in the flow. No passkey is required on this step.
        </p>
      </div>
    </main>
  );
}

function CreatorOnboardingForm({
  email,
  walletAddress,
  onComplete,
}: {
  email: string;
  walletAddress: string;
  onComplete: (handle: string) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
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
        body: JSON.stringify({
          email,
          displayName,
          handle,
          bio: bio || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.message ?? "Failed to create creator profile");
      }

      const data = await res.json();
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

