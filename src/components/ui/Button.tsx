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
    "bg-indigo-900 text-on-indigo border-2 border-indigo-900 hover:bg-indigo-700 hover:border-indigo-700",
  secondary:
    "bg-transparent text-text-primary border-2 border-ink hover:bg-ink hover:text-surface-base",
  ghost:
    "bg-transparent text-text-secondary border-2 border-transparent underline-offset-4 hover:text-text-primary hover:underline",
  gold: "bg-gold-400 text-indigo-900 border-2 border-gold-400 hover:bg-gold-600 hover:border-gold-600 hover:text-white",
  danger:
    "bg-danger-600 text-white border-2 border-danger-600 hover:bg-transparent hover:text-danger-600",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-[40px] sm:min-h-[38px] px-3 py-1.5 text-xs rounded-sm",
  md: "min-h-[44px] sm:min-h-[44px] px-4 py-2.5 text-sm rounded-sm",
  lg: "min-h-[48px] px-6 py-3 text-base rounded-sm",
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
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
        "active:translate-y-px",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-40 cursor-not-allowed active:translate-y-0" : "cursor-pointer",
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
