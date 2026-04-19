import { ReactNode } from "react";

type Variant =
  | "verified" | "hallu" | "unverif" | "web-verified" | "web-contra"
  | "flipped"  | "held"  | "pending" | "approved"     | "denied"
  | "high"     | "medium"| "low"
  | "accent"   | "pro"   | "starter" | "enterprise";

interface Props {
  variant: Variant;
  children: ReactNode;
  icon?: ReactNode;
  style?: React.CSSProperties;
}

const CLASS: Record<Variant, string> = {
  verified:    "badge badge-verified",
  hallu:       "badge badge-hallu",
  unverif:     "badge badge-unverif",
  "web-verified": "badge badge-web-verified",
  "web-contra":   "badge badge-web-contra",
  flipped:     "badge badge-flipped",
  held:        "badge badge-held",
  pending:     "badge badge-pending",
  approved:    "badge badge-approved",
  denied:      "badge badge-denied",
  high:        "badge badge-high",
  medium:      "badge badge-medium",
  low:         "badge badge-low",
  accent:      "badge badge-accent",
  pro:         "badge badge-pro",
  starter:     "badge badge-starter",
  enterprise:  "badge badge-enterprise",
};

export function Badge({ variant, children, icon, style }: Props) {
  return (
    <span className={CLASS[variant]} style={style}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
