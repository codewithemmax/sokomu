"use client";

import type { Dialect, DialectId } from "@/types/domain";

export type RegionStampState = "locked" | "in-progress" | "earned";

export interface RegionGeometry {
  dialectId: DialectId;
  mapRegionId: string;
  pathData: string;
  labelX: number;
  labelY: number;
  shortLabel: string;
}

export const NIGERIA_DIALECT_REGIONS: readonly RegionGeometry[] = [
  {
    dialectId: "ha-kano",
    mapRegionId: "region-ha-kano",
    pathData: "M278 82L388 82L408 162L302 172L262 126L278 82Z",
    labelX: 338,
    labelY: 132,
    shortLabel: "Kano",
  },
  {
    dialectId: "yo-ekiti",
    mapRegionId: "region-yo-ekiti",
    pathData: "M196 276L254 274L256 318L194 320L196 276Z",
    labelX: 225,
    labelY: 302,
    shortLabel: "Ekiti",
  },
  {
    dialectId: "yo-ondo",
    mapRegionId: "region-yo-ondo",
    pathData: "M192 324L248 322L252 374L196 376L192 324Z",
    labelX: 222,
    labelY: 353,
    shortLabel: "Ondo",
  },
  {
    dialectId: "yo-ijebu",
    mapRegionId: "region-yo-ijebu",
    pathData: "M136 336L188 332L194 378L140 382L136 336Z",
    labelX: 164,
    labelY: 360,
    shortLabel: "Ijebu",
  },
  {
    dialectId: "pcm-lagos",
    mapRegionId: "region-pcm-lagos",
    pathData: "M84 352L134 350L138 388L92 390L84 352Z",
    labelX: 111,
    labelY: 374,
    shortLabel: "Lagos",
  },
  {
    dialectId: "ig-onitsha",
    mapRegionId: "region-ig-onitsha",
    pathData: "M304 326L358 322L362 364L306 368L304 326Z",
    labelX: 332,
    labelY: 349,
    shortLabel: "Onitsha",
  },
  {
    dialectId: "ig-owerri",
    mapRegionId: "region-ig-owerri",
    pathData: "M316 372L376 368L380 412L318 416L316 372Z",
    labelX: 348,
    labelY: 396,
    shortLabel: "Owerri",
  },
  {
    dialectId: "ig-ikwerre",
    mapRegionId: "region-ig-ikwerre",
    pathData: "M298 420L366 418L362 458L294 456L298 420Z",
    labelX: 330,
    labelY: 442,
    shortLabel: "Ikwerre",
  },
];

export interface NigeriaMapProps {
  dialects: readonly Dialect[];
  selectedDialectId: DialectId;
  regionStates: Partial<Record<DialectId, RegionStampState>>;
  onSelectDialect: (dialectId: DialectId) => void;
}

export function NigeriaMap({
  dialects,
  selectedDialectId,
  regionStates,
  onSelectDialect,
}: NigeriaMapProps) {
  const dialectById = new Map(dialects.map((d) => [d.dialectId, d]));

  const renderSvgLayers = (accessibleInteractive: boolean) => (
    <>
      <path
        d="M88 148L142 86L238 64L348 56L458 68L554 92L584 166L542 258L496 346L424 416L324 468L244 462L186 408L102 388L78 312L88 148Z"
        fill="#F7F5F0"
        stroke="#121A3F"
        strokeWidth="2"
      />
      <path
        d="M118 164C188 212 248 256 306 296M532 238C452 262 376 280 306 296M306 296C304 352 292 410 278 462"
        stroke="#0369A1"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity="0.4"
      />

      {NIGERIA_DIALECT_REGIONS.map((region) => {
        const dialect = dialectById.get(region.dialectId);
        const state: RegionStampState =
          regionStates[region.dialectId] ?? "locked";
        const isSelected = selectedDialectId === region.dialectId;

        const fillColor =
          state === "earned"
            ? "#E0A93B"
            : state === "in-progress"
              ? "#E3E7FB"
              : "#FFFFFF";
        const strokeColor = isSelected
          ? "#4457C4"
          : state === "earned"
            ? "#B7791F"
            : "#121A3F";
        const strokeWidth = isSelected ? 3 : 1.75;

        return (
          <g
            key={region.dialectId}
            id={accessibleInteractive ? region.mapRegionId : undefined}
            role={accessibleInteractive ? "button" : undefined}
            tabIndex={accessibleInteractive ? 0 : undefined}
            aria-label={
              accessibleInteractive
                ? `${dialect?.name ?? region.shortLabel} (${dialect?.region ?? ""}), stamp ${state}`
                : undefined
            }
            aria-pressed={accessibleInteractive ? isSelected : undefined}
            onClick={() => onSelectDialect(region.dialectId)}
            onKeyDown={
              accessibleInteractive
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectDialect(region.dialectId);
                    }
                  }
                : undefined
            }
            className="cursor-pointer transition-opacity hover:opacity-90 focus:outline-none"
          >
            <path
              d={region.pathData}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="transition-colors duration-300"
            />
            <text
              x={region.labelX}
              y={region.labelY}
              textAnchor="middle"
              fill="#121A3F"
              fontSize="12"
              fontWeight="700"
            >
              {region.shortLabel}
            </text>
          </g>
        );
      })}
    </>
  );

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface-base p-3 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-text-primary">
          Interactive Dialect Regions (8)
        </span>
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-xs bg-gold-400 border border-gold-600" />
            Earned stamp
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-xs bg-indigo-100 border border-indigo-500" />
            In progress
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-xs bg-surface-raised border border-indigo-900" />
            Available
          </span>
        </div>
      </div>

      <svg
        viewBox="0 0 640 520"
        className="hidden sm:block w-full h-auto max-h-[420px]"
        role="img"
        aria-label="Interactive cultural dialect map of Nigeria"
      >
        <title>Nigeria Cultural Dialect Regions</title>
        {renderSvgLayers(true)}
      </svg>

      <svg
        viewBox="0 0 640 520"
        className="sm:hidden w-full h-auto max-h-[260px]"
        aria-hidden="true"
      >
        {renderSvgLayers(false)}
      </svg>

      <div
        className="mt-3 grid grid-cols-2 gap-2 sm:hidden"
        role="group"
        aria-label="Select a dialect region"
      >
        {NIGERIA_DIALECT_REGIONS.map((region) => {
          const dialect = dialectById.get(region.dialectId);
          const state: RegionStampState =
            regionStates[region.dialectId] ?? "locked";
          const isSelected = selectedDialectId === region.dialectId;
          return (
            <button
              key={region.dialectId}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectDialect(region.dialectId)}
              className={[
                "flex min-h-[44px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer",
                "focus-visible:outline-2 focus-visible:outline-focus",
                isSelected
                  ? "border-2 border-indigo-500 bg-surface-raised text-indigo-900"
                  : "border-border bg-surface-raised/85 text-text-primary hover:bg-surface-base",
              ].join(" ")}
            >
              <span className="truncate">{dialect?.name ?? region.shortLabel}</span>
              <span
                aria-hidden="true"
                className={[
                  "size-2.5 shrink-0 rounded-full border",
                  state === "earned"
                    ? "bg-gold-400 border-gold-600"
                    : state === "in-progress"
                      ? "bg-indigo-100 border-indigo-500"
                      : "bg-surface-base border-indigo-900/50",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
