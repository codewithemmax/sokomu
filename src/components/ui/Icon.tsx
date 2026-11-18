import type { SVGProps } from "react";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesColumn,
  Database,
  Globe,
  GraduationCap,
  Map,
  Menu,
  Play,
  Settings,
  Signal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

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

const ICONS: Record<IconName, LucideIcon> = {
  map: Map,
  sparkles: Sparkles,
  book: BookOpen,
  chart: ChartNoAxesColumn,
  graduation: GraduationCap,
  settings: Settings,
  signal: Signal,
  database: Database,
  "arrow-right": ArrowRight,
  play: Play,
  globe: Globe,
  menu: Menu,
};

/** Lucide icons at the design system's 1.5px stroke. */
export function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "ref"> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const Component = ICONS[name];
  return (
    <Component
      aria-hidden="true"
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
