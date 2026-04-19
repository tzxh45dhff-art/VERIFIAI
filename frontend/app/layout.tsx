import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: { default: "VerifiAI — AI Accountability Platform", template: "%s | VerifiAI" },
  description: "The world's first end-to-end AI Accountability Operating System. Detect hallucinations, map dataset bias, and contest automated decisions.",
  keywords: ["AI accountability", "hallucination detection", "bias cartography", "EU AI Act compliance"],
  openGraph: {
    title: "VerifiAI — AI Accountability Platform",
    description: "Detect hallucinations. Map dataset bias. Contest automated decisions.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only"
            style={{
              position: "fixed", top: 8, left: 8, zIndex: 9999,
              background: "var(--accent-blue)", color: "#fff",
              padding: "8px 16px", borderRadius: 8, fontFamily: "Syne, sans-serif",
            }}
          >
            Skip to main content
          </a>
          {children}
          <Toaster
            theme="dark"
            richColors
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                color: "var(--text-primary)",
                fontFamily: "Syne, sans-serif",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
