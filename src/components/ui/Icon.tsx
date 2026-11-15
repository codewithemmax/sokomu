import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "map"
  | "sparkles"
  | "book"
  | "chart"
  | "graduation"
  | "settings"
  | "signal"
  | "database"
  | "arrow-right"
  | "play"
  | "globe"
  | "menu";

const PATHS: Record<IconName, ReactNode> = {
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></>,
  sparkles: <><path d="m12 3-1.2 5.8L5 10l5.8 1.2L12 17l1.2-5.8L19 10l-5.8-1.2L12 3Z" /><path d="m19 16-.5 2.5L16 19l2.5.5L19 22l.5-2.5L22 19l-2.5-.5L19 16Z" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" /><path d="M4 5.5V22M8 7h8M8 11h8" /></>,
  chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /></>,
  graduation: <><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 11.5V16c2.8 2.2 9.2 2.2 12 0v-4.5M21 9v6" /></>,
  settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2A2 2 0 0 0 5.8 18l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 12a2 2 0 1 1 0-4h.2a2 2 0 0 0 1.4-3.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.4.4V.2a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 21 8h.2a2 2 0 1 1 0 4H21a2 2 0 0 0-1.6 3Z" transform="scale(.8) translate(3 3)" /></>,
  signal: <><path d="M3 18h2M8 14h2M13 10h2M18 6h2" /><path d="M3 18V8M8 14V6M13 10V4M18 6V2" /></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></>,
  "arrow-right": <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.2 2.5 3.2 5.5 3.2 9s-1 6.5-3.2 9c-2.2-2.5-3.2-5.5-3.2-9S9.8 5.5 12 3Z" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
