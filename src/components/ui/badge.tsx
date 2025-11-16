import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "outline";
}

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:
    "bg-zinc-900 text-white dark:bg-white dark:text-black",
  success: "bg-lime-500/20 text-lime-700 dark:text-lime-200",
  outline:
    "border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-200",
};

export const Badge = ({
  className,
  variant = "default",
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
      variantStyles[variant],
      className,
    )}
    {...props}
  />
);

