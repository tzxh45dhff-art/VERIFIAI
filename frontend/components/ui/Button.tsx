import { ReactNode, ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  style,
  ...rest
}: Props) {
  const cls = `btn-${variant}`;
  const pad = size === "sm" ? "6px 14px" : "10px 20px";
  const fz  = size === "sm" ? 13 : 15;

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cls}
      style={{ padding: pad, fontSize: fz, ...style }}
    >
      {loading ? (
        <svg
          width="15" height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-spin"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : children}
    </button>
  );
}
