// src/app/scheduling/layout.tsx
import { SchedulingSidebar } from './sidebar';

export default function SchedulingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 lg:w-72 shrink-0">
          <SchedulingSidebar />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
