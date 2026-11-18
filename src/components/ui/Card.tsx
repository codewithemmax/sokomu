import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  sunken?: boolean;
  children: ReactNode;
}

export function Card({
  elevated = true,
  sunken = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  // v2: cards are flat (one hairline border); wells are borderless tints.
  void elevated;
  const surfaceClass = sunken
    ? "bg-surface-base"
    : "bg-surface-raised border border-border";

  return (
    <div
      className={[
        "rounded-[var(--radius-card)] p-4 lg:p-6",
        surfaceClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-3 flex items-start justify-between gap-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-display text-lg font-semibold leading-tight text-text-primary ${className}`}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-text-secondary ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-4 pt-3 border-t border-border flex items-center justify-between gap-3 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
