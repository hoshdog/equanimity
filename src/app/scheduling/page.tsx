// src/app/scheduling/page.tsx
'use client';

import { useState } from 'react';
import { CalendarView } from './calendar-view';
import { TimelineView } from './timeline-view';
import { ResourceLoadView } from './resource-load-view';
import { ListView } from './list-view';
import { mockEvents, mockResources, mockProjects } from './data';

export type ViewMode = 'calendar' | 'timeline' | 'load' | 'list';

export default function SchedulingPage() {
  const [view, setView] = useState<ViewMode>('calendar');

  const renderView = () => {
    switch (view) {
      case 'calendar':
        return <CalendarView events={mockEvents} resources={mockResources} />;
      case 'timeline':
        return <TimelineView events={mockEvents} resources={mockResources} projects={mockProjects} />;
      case 'load':
        return <ResourceLoadView events={mockEvents} resources={mockResources} />;
      case 'list':
        return <ListView events={mockEvents} resources={mockResources} projects={mockProjects} />;
      default:
        return <CalendarView events={mockEvents} resources={mockResources} />;
    }
  };

  // This would typically be inside the layout, but for simplicity we pass it down
  // from the page component that controls the state.
  return (
    <div>
        {/* The sidebar would control the view state via a callback */}
        {/* <SchedulingSidebar currentView={view} setView={setView} /> */}
        <div className="w-full">
            {renderView()}
        </div>
    </div>
  );
}
