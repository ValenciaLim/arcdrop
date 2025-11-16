 "use client";
 
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type BalanceResponse =
  | {
      walletAddress: string;
      totalUsd: number;
      wallets: { address: string; network: string }[];
    }
  | {
      email: string;
      totalUsd: number;
      wallets: { address: string; network: string }[];
    };

export function WalletBalanceChecker() {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BalanceResponse | null>(null);

  const onCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/wallet/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message ?? "Failed to fetch balance");
      setResult(payload as BalanceResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="wallet-address">Wallet address</Label>
          <Input
            id="wallet-address"
            type="text"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            onClick={onCheck}
            disabled={
              loading || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())
            }
          >
            {loading ? "Checking…" : "Check balance"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">
            {"walletAddress" in result ? result.walletAddress : ""}
          </p>
          <p className="text-zinc-600">
            Estimated USDC (Gateway): ${result.totalUsd.toFixed(2)}
          </p>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Wallets</p>
            {result.wallets.length === 0 ? (
              <p className="text-xs text-zinc-500">No wallets found.</p>
            ) : (
              <ul className="grid gap-2 md:grid-cols-2">
                {result.wallets.map((w) => (
                  <li
                    key={`${w.address}-${w.network}`}
                    className="rounded-xl border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <p className="truncate font-medium text-zinc-700 dark:text-zinc-200">
                      {w.address}
                    </p>
                    <p className="text-zinc-500">{w.network}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


