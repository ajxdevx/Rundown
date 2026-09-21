"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { WaitlistSource } from "@/lib/waitlist/types";
import { Cta } from "../Cta";
import { useWaitlist } from "./WaitlistProvider";

type JoinWaitlistButtonProps = {
  source: WaitlistSource;
  variant?: "accent" | "secondary" | "ghost" | "ink";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children">;

export function JoinWaitlistButton({
  source,
  variant = "accent",
  size = "md",
  className = "",
  children = "Join Waitlist",
  ...rest
}: JoinWaitlistButtonProps) {
  const { openWaitlist } = useWaitlist();

  return (
    <Cta
      variant={variant}
      size={size}
      className={className}
      onClick={() => openWaitlist(source)}
      {...rest}
    >
      {children}
    </Cta>
  );
}
