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
    "bg-indigo-700 text-on-indigo border border-transparent hover:bg-indigo-900 active:bg-indigo-900 active:shadow-[inset_0_2px_0_rgba(0,0,0,0.25)]",
  secondary:
    "bg-surface-raised text-ink border border-border hover:bg-surface-base active:bg-surface-sunken",
  ghost:
    "bg-transparent text-indigo-700 border border-transparent hover:bg-indigo-100 hover:text-indigo-900 active:bg-indigo-100",
  gold: "bg-gold-100 text-ink border border-transparent hover:bg-gold-400/60 active:bg-gold-400/80",
  danger:
    "bg-danger-600 text-on-indigo border border-transparent hover:bg-offline-600",
};

const DISABLED_CLASSES =
  "bg-surface-sunken text-text-muted border border-transparent cursor-not-allowed";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-4 text-sm",
  md: "min-h-[48px] px-5 text-base",
  lg: "min-h-[56px] px-6 text-base",
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
  const showDisabledStyle = Boolean(disabled || offlineDimmed) && !loading;
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
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] font-semibold leading-none transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        showDisabledStyle ? DISABLED_CLASSES : VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className={`tone-loader ${variant === "primary" || variant === "danger" ? "on-indigo" : ""}`}
        >
          <i />
          <i />
          <i />
        </span>
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {trailingIcon}
    </button>
  );
}
