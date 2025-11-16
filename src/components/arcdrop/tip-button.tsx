"use client";

import { Button } from "@/components/ui/button";

type TipButtonProps = {
  linkSlug: string;
};

export function TipButton({ linkSlug }: TipButtonProps) {
  const href = `/tip/${linkSlug}`;

  return (
    <Button
      type="button"
      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
    >
      Open Tip Checkout
    </Button>
  );
}

