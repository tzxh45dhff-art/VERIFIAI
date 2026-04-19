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
  up:   "var(--verified)",
  down: "var(--hallucination)",
  warn: "var(--unverified)",
};

export function StatCard({
  label, value, suffix = "", trend, trendDir = "up",
  icon, height = 120, numberSize = 48, style,
}: Props) {
  return (
    <div
      className="card"
      style={{
        padding: 24,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        ...style,
      }}
    >
      {/* Row 1: label + icon */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 4, minWidth: 0,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.06em", textTransform: "uppercase",
          color: "var(--text-muted)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: "var(--accent-brown)", flexShrink: 0 }} aria-hidden="true">{icon}</span>
        )}
      </div>

      {/* Row 2: number — colored with accent-blue for data values */}
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: 44,
        fontWeight: 700,
        lineHeight: 1,
        color: "var(--text-primary)",
        letterSpacing: "-0.02em",
        marginBottom: 12,
        marginTop: 2,
      }}>
        {value}{suffix}
      </p>

      {/* Row 3: trend */}
      {trend && (
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: 12,
          color: TREND_COLOR[trendDir], fontWeight: 500,
          marginTop: "auto",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {trend}
        </p>
      )}
    </div>
  );
}
