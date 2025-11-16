import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Decimal } from "@prisma/client/runtime/library";

/**
 * Tailwind-first class name merger.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number or decimal string into USDC display text.
 */
export function formatUsd(value: number | string) {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(value ?? "0");
  return new Intl.NumberFormat("en-US", {
    style: "decimal", 
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Safely serialize Prisma Decimal values for API responses.
 */
export function decimalToNumber(value?: Decimal | null) {
  if (!value) return null;
  return Number(value);
}

export function sanitizeHandle(handle: string) {
  return handle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-");
}

export function shortAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

