"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type CtaVariant = "accent" | "secondary" | "ghost" | "ink";
type CtaSize = "sm" | "md" | "lg";

const variantClass: Record<CtaVariant, string> = {
  accent: "btn-accent",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  ink: "btn-secondary",
};

const sizeClass: Record<CtaSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

type CtaProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: CtaVariant;
  size?: CtaSize;
  children: ReactNode;
};

export function Cta({
  variant = "accent",
  size = "md",
  className = "",
  children,
  type = "button",
  ...rest
}: CtaProps) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center font-medium disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
