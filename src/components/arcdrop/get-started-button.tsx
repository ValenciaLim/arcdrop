"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { toModularTransport } from "@circle-fin/modular-wallets-core";
import { createClient } from "viem";

export function GetStartedButton() {
  const router = useRouter();
  const { data: configData } = useSWR<{ clientUrl: string; clientKey: string; defaultChain: string }>(
    "/api/modular/config",
    (url: string) => fetch(url).then((r) => r.json()),
  );

  return (
    <Button
      onClick={async () => {
        // Initialize Modular transport before onboarding (preflight)
        if (configData?.clientUrl && configData?.clientKey) {
          const rpc = `${configData.clientUrl}/${configData.defaultChain}`;
          const transport = toModularTransport(rpc, configData.clientKey);
          // Create a viem client to validate transport is usable
          // (no onchain request here to avoid network flakiness on click)
          void createClient({ transport });
        }
        router.push("/creator/onboard");
      }}
      disabled={!configData}
    >
      Get started
    </Button>
  );
}

