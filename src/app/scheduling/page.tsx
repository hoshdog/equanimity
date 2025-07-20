// src/app/scheduling/page.tsx
'use client';

import { CalendarView } from './calendar-view';
import { TimelineView } from './timeline-view';
import { ResourceLoadView } from './resource-load-view';
import { ListView } from './list-view';
import { mockEvents, mockResources, mockProjects } from './data';
import { useSchedulingView } from './layout';

export type ViewMode = 'calendar' | 'timeline' | 'load' | 'list';

export default function SchedulingPage() {
  const { view } = useSchedulingView();

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

  return (
    <div className="w-full">
        {renderView()}
    </div>
  );
}
