// src/app/scheduling/page.tsx
'use client';

import { useState } from 'react';
import { CalendarView } from './calendar-view';
import { TimelineView } from './timeline-view';
import { ResourceLoadView } from './resource-load-view';
import { ListView } from './list-view';
import { mockEvents as initialMockEvents, mockResources, mockProjects } from './data';
import { useSchedulingView } from './layout';
import type { ScheduleEvent } from './data';


export type ViewMode = 'calendar' | 'timeline' | 'load' | 'list';

export default function SchedulingPage() {
  const { view } = useSchedulingView();
  const [events, setEvents] = useState<ScheduleEvent[]>(initialMockEvents);

  const handleEventUpdate = (updatedEvent: ScheduleEvent) => {
    setEvents(prevEvents =>
      prevEvents.map(e => (e.id === updatedEvent.id ? updatedEvent : e))
    );
  };

  const renderView = () => {
    switch (view) {
      case 'calendar':
        return <CalendarView events={events} resources={mockResources} onEventUpdate={handleEventUpdate} />;
      case 'timeline':
        return <TimelineView events={events} resources={mockResources} projects={mockProjects} onEventUpdate={handleEventUpdate} />;
      case 'load':
        return <ResourceLoadView events={events} resources={mockResources} />;
      case 'list':
        return <ListView events={events} resources={mockResources} projects={mockProjects} />;
      default:
        return <CalendarView events={events} resources={mockResources} onEventUpdate={handleEventUpdate} />;
    }
  };

  return (
    <div className="w-full">
        {renderView()}
    </div>
  );
}
