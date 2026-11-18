"use client";

import { useId, useState, type ReactNode } from "react";

export interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
  placement?: "top" | "bottom";
}

export function Tooltip({
  content,
  children,
  className = "",
  placement = "top",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={[
            "pointer-events-none absolute left-1/2 z-50 w-max max-w-xs -translate-x-1/2 rounded-[var(--radius-button)] bg-ink px-3 py-2 text-sm font-medium leading-snug text-on-indigo shadow-[var(--shadow-float)]",
            placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
          ].join(" ")}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
