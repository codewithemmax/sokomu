"use client";

import { useId, useState, type ReactNode } from "react";

export interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
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
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 rounded-lg bg-indigo-900 px-3 py-1.5 text-xs font-normal text-white shadow-[var(--shadow-2)]"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
