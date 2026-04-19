import PublicNav from "@/components/nav/PublicNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main id="main-content" style={{ paddingTop: 68 }}>
        {children}
      </main>
    </>
  );
}
