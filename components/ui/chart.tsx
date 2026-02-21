"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

// =========================
// Chart Container
// =========================

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground " +
            "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 " +
            "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border " +
            "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border " +
            "[&_.recharts-radial-bar-background-sector]:fill-muted " +
            "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted " +
            "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border " +
            "flex aspect-video justify-center text-xs " +
            "[&_.recharts-dot[stroke='#fff']]:stroke-transparent " +
            "[&_.recharts-layer]:outline-hidden " +
            "[&_.recharts-sector]:outline-hidden " +
            "[&_.recharts-sector[stroke='#fff']]:stroke-transparent " +
            "[&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, c]) => c.theme || c.color);
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => {
            const vars = colorConfig
              .map(([key, itemConfig]) => {
                const color =
                  itemConfig.theme?.[theme as keyof typeof THEMES] ?? itemConfig.color;
                return color ? `  --color-${key}: ${color};` : "";
              })
              .filter(Boolean)
              .join("\n");

            return `${prefix} [data-chart=${id}] {\n${vars}\n}\n`;
          })
          .join("\n"),
      }}
    />
  );
}

// =========================
// Tooltip
// =========================

const ChartTooltip = Tooltip;

function ChartTooltipContent(
  props: React.ComponentProps<typeof Tooltip> &
    React.HTMLAttributes<HTMLDivElement> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
      labelClassName?: string;
      color?: string;
    }
) {
  const {
    active,
    className,
    indicator = "dot",
    hideLabel = false,
    hideIndicator = false,
    labelClassName,
    formatter,
    color,
    nameKey,
    labelKey,
  } = props;

  const label = (props as any).label;
  const labelFormatter = (props as any).labelFormatter;

  const { config } = useChart();

  // ✅ No payload typing. Normalize safely at runtime.
  const safePayload = Array.isArray((props as any).payload)
    ? ((props as any).payload as any[])
    : [];

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || safePayload.length === 0) return null;

    const first = safePayload[0] as any;
    const key = `${labelKey || first?.dataKey || first?.name || "value"}`;

    const itemConfig = getPayloadConfigFromPayload(config, first, key);

    const computedLabel =
      !labelKey && typeof label === "string"
        ? config[label]?.label || label
        : itemConfig?.label;

    if (!computedLabel) return null;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(computedLabel as any, safePayload as any)}
        </div>
      );
    }

    return <div className={cn("font-medium", labelClassName)}>{computedLabel}</div>;
  }, [hideLabel, safePayload, labelKey, config, label, labelFormatter, labelClassName]);

  if (!active || safePayload.length === 0) return null;

  const nestLabel = safePayload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}

      <div className="grid gap-1.5">
        {safePayload.map((item: any, index: number) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          const indicatorColor =
            color || item?.payload?.fill || item?.color || item?.fill;

          return (
            <div
              key={`${String(item.dataKey ?? item.name ?? "k")}-${index}`}
              className={cn(
                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item?.name ? (
                (formatter as any)(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          }
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}

                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>

                    {item?.value !== undefined && item?.value !== null && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {Number(item.value).toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================
// Legend
// =========================

const ChartLegend = Legend;

function ChartLegendContent(
  props: React.ComponentProps<typeof Legend> &
    React.HTMLAttributes<HTMLDivElement> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
) {
  const { className, hideIcon = false, nameKey, verticalAlign = "bottom" } =
    props as any;

  const { config } = useChart();

  // ✅ No payload typing. Normalize safely at runtime.
  const safePayload = Array.isArray((props as any).payload)
    ? ((props as any).payload as any[])
    : [];

  if (safePayload.length === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {safePayload.map((item: any, index: number) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div
            key={`${String(item.value ?? "v")}-${index}`}
            className={cn(
              "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span>{itemConfig?.label ?? item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

// =========================
// Helper
// =========================

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined;

  const p = payload as Record<string, unknown>;

  const payloadPayload =
    typeof p.payload === "object" && p.payload !== null
      ? (p.payload as Record<string, unknown>)
      : undefined;

  let configLabelKey: string = key;

  if (typeof p[key] === "string") {
    configLabelKey = p[key] as string;
  } else if (payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};