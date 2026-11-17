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
      className={`inline-flex flex-wrap items-end gap-x-5 gap-y-1 border-b border-ink/30 ${className}`}
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
              "-mb-px inline-flex min-h-[44px] items-center gap-2 border-b-[3px] px-0.5 pt-2 pb-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
              isActive
                ? "border-ink text-text-primary font-semibold"
                : "border-transparent text-text-secondary hover:border-ink/30 hover:text-text-primary",
              item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            <span>{item.label}</span>
            {item.badge !== undefined ? (
              <span className="bg-ink px-1.5 py-px text-[11px] font-mono text-surface-base">
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
