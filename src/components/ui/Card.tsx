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
  const surfaceClass = sunken
    ? "bg-surface-sunken border border-border"
    : "bg-surface-raised border border-ink/25";
  const shadowClass = elevated ? "shadow-[var(--shadow-1)]" : "";

  return (
    <div
      className={[
        "rounded-none p-4 lg:p-6",
        surfaceClass,
        shadowClass,
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
      className={`font-display text-[1.3rem] leading-[1.2] text-text-primary ${className}`}
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
