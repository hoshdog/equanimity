// src/app/scheduling/layout.tsx
'use client';

import { createContext, useState, useContext } from 'react';
import { SchedulingSidebar } from './sidebar';
import type { ViewMode } from './page';

interface SchedulingContextType {
  view: ViewMode;
  setView: (view: ViewMode) => void;
}

const SchedulingContext = createContext<SchedulingContextType | null>(null);

export function useSchedulingView() {
    const context = useContext(SchedulingContext);
    if (!context) {
        throw new Error('useSchedulingView must be used within a SchedulingLayout');
    }
    return context;
}

export default function SchedulingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [view, setView] = useState<ViewMode>('calendar');

  return (
    <SchedulingContext.Provider value={{ view, setView }}>
        <div className="flex-1 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-64 lg:w-72 shrink-0">
                <SchedulingSidebar />
                </aside>
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    </SchedulingContext.Provider>
  );
}
