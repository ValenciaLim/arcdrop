"use client";

import { Button } from "@/components/ui/button";

type SubscribeButtonProps = {
  linkSlug: string;
};

export function SubscribeButton({ linkSlug }: SubscribeButtonProps) {
  const href = `/subscribe/${linkSlug}`;
  return (
    <Button
      variant="outline"
      type="button"
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
    >
      Subscribe via Arcdrop
    </Button>
  );
}

