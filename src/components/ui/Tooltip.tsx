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
            "pointer-events-none absolute left-1/2 z-50 w-max max-w-xs -translate-x-1/2 rounded-lg bg-indigo-900 px-3 py-1.5 text-xs font-normal text-white shadow-[var(--shadow-2)]",
            placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
          ].join(" ")}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
