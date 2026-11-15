"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "gold"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  offlineDimmed?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-700 text-white hover:bg-indigo-900 border border-transparent",
  secondary:
    "bg-surface-raised text-text-primary border border-border hover:bg-indigo-100/50",
  ghost:
    "bg-transparent text-text-secondary hover:bg-indigo-100/60 hover:text-text-primary border border-transparent",
  gold: "bg-gold-600 text-white hover:bg-gold-600/90 border border-transparent",
  danger:
    "bg-danger-600 text-white hover:bg-danger-600/90 border border-transparent",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-[40px] sm:min-h-[38px] px-3 py-1.5 text-xs rounded-[10px]",
  md: "min-h-[44px] sm:min-h-[44px] px-4 py-2.5 text-sm rounded-[10px]",
  lg: "min-h-[48px] px-6 py-3 text-base rounded-[10px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  offlineDimmed = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled,
  className = "",
  title,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading || offlineDimmed);
  const effectiveTitle =
    offlineDimmed && !title ? "Needs connection" : title;

  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-disabled={isDisabled}
      aria-busy={loading || undefined}
      title={effectiveTitle}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={[
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
        "active:scale-[0.98]",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-40 cursor-not-allowed active:scale-100" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {trailingIcon}
    </button>
  );
}
