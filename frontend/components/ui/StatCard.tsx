import { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: string;
  trendDir?: "up" | "down" | "warn";
  icon?: ReactNode;
  /** Override card height — enables deliberate size differentiation */
  height?: number;
  /** Override number font size */
  numberSize?: number;
  style?: React.CSSProperties;
}

const TREND_COLOR = {
  up:   "#10B981",
  down: "#EF4444",
  warn: "#F59E0B",
};

export function StatCard({
  label, value, suffix = "", trend, trendDir = "up",
  icon, height = 120, numberSize = 48, style,
}: Props) {
  return (
    <div
      className="card"
      style={{ padding: 24, height, display: "flex", flexDirection: "column", ...style }}
    >
      {/* Row 1: label + icon — 4px gap to number below */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 4,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.06em", textTransform: "uppercase",
          color: "var(--text-muted)",
        }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: "var(--text-muted)" }} aria-hidden="true">{icon}</span>
        )}
      </div>

      {/* Row 2: number — sized by prop */}
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: numberSize,
        fontWeight: 700,
        lineHeight: 1,
        color: "var(--text-primary)",
        letterSpacing: "-0.02em",
        marginBottom: 12, /* 12px gap before trend */
        marginTop: 2,
      }}>
        {value}{suffix}
      </p>

      {/* Row 3: trend — plain colored text */}
      {trend && (
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: 12,
          color: TREND_COLOR[trendDir], fontWeight: 500,
          marginTop: "auto",
        }}>
          {trend}
        </p>
      )}
    </div>
  );
}
