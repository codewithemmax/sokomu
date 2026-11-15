"use client";

import type { ReactNode } from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  items: readonly TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function Tabs<T extends string = string>({
  items,
  activeTab,
  onChange,
  ariaLabel = "Section tabs",
  className = "",
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-surface-sunken p-1 ${className}`}
    >
      {items.map((item) => {
        const isActive = item.id === activeTab;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${item.id}`}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={[
              "inline-flex min-h-[40px] items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
              isActive
                ? "bg-surface-raised text-indigo-900 shadow-[var(--shadow-1)] font-semibold"
                : "text-text-secondary hover:text-text-primary",
              item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            <span>{item.label}</span>
            {item.badge !== undefined ? (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-mono text-indigo-700">
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  tabId: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({
  tabId,
  activeTab,
  children,
  className = "",
}: TabPanelProps) {
  if (tabId !== activeTab) {
    return null;
  }
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      className={className}
    >
      {children}
    </div>
  );
}
