import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-subtle)] text-[var(--text)] min-h-screen">
      <Sidebar />
      <div className="ml-56 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
