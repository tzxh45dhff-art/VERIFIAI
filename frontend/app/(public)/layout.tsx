import PublicNav from "@/components/nav/PublicNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <PublicNav />
      <main id="main-content" style={{ paddingTop: 68 }}>
        {children}
      </main>
    </>
  );
}
