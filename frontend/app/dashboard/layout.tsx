import DashboardSidebar from "@/components/nav/DashboardSidebar";
import DashboardTopBar from "@/components/nav/DashboardTopBar";
import { AIChatWidget } from "@/components/chat/AIChatWidget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <DashboardSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <DashboardTopBar />
        <main id="main-content" style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
      <AIChatWidget />
    </div>
  );
}
