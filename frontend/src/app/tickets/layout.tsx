import { AppHeader } from "@/components/app-header";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="container mx-auto py-6 px-6">{children}</main>
    </div>
  );
}