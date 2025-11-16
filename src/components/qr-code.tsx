"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const QRCodeCanvas = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { ssr: false },
);

type QRCodeProps = {
  value: string;
  className?: string;
};

export function QRCode({ value, className }: QRCodeProps) {
  return (
    <div
      className={cn(
        "grid h-40 w-40 place-items-center rounded-3xl border border-zinc-100 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <QRCodeCanvas value={value} size={160} bgColor="transparent" />
    </div>
  );
}

