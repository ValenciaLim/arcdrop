"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GetStartedButton() {
  const router = useRouter();

  const onStart = async () => {
    router.push("/creator/onboard");
  };

  return (
    <Button onClick={onStart}>
      Get started
    </Button>
  );
}

