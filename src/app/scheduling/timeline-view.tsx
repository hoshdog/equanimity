// src/app/scheduling/timeline-view.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScheduleEvent, Resource, Project } from './data';
import { format, differenceInDays, startOfWeek, addDays, eachDayOfInterval, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TimelineViewProps {
  events: ScheduleEvent[];
  resources: Resource[];
  projects: Project[];
}

type TimelineViewMode = 'week' | 'month';

const getEventTypeClass = (event: ScheduleEvent) => {
  if (event.type === 'leave') {
    return 'bg-blue-500/80 hover:bg-blue-600';
  }
  if (event.status === 'tentative') {
    return 'bg-gray-400/80 hover:bg-gray-500';
  }
  return 'bg-primary/80 hover:bg-primary';
};

export function TimelineView({ events, resources, projects }: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<TimelineViewMode>('week');

  const handleDateChange = (amount: number) => {
    if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, amount * 7));
    } else {
      setCurrentDate(prev => addMonths(prev, amount));
    }
  };

  const { intervalStart, dateHeaders } = React.useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      const headers = eachDayOfInterval({ start, end }).map(day => ({
        key: day.toISOString(),
        label: format(day, 'EEE d'),
      }));
      return { intervalStart: start, dateHeaders: headers };
    } else { // month view
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const headers = eachDayOfInterval({ start, end }).map(day => ({
        key: day.toISOString(),
        label: format(day, 'd'),
      }));
      return { intervalStart: start, dateHeaders: headers };
    }
  }, [currentDate, viewMode]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
             <Button variant="outline" size="icon" onClick={() => handleDateChange(1)}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
         <ToggleGroup type="single" value={viewMode} onValueChange={(value: TimelineViewMode) => value && setViewMode(value)} >
            <ToggleGroupItem value="month" aria-label="Month view">Month</ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view">Week</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
           <div className="grid" style={{ gridTemplateColumns: `200px repeat(${dateHeaders.length}, 1fr)` }}>
              <div className="font-semibold p-2 border-b border-r bg-muted/50 sticky left-0 z-10">Project / Resource</div>
              {dateHeaders.map(header => (
                <div key={header.key} className="text-center font-semibold p-2 border-b border-r last:border-r-0 bg-muted/50 text-xs">
                    {header.label}
                </div>
              ))}
           </div>
           <div className="divide-y max-h-[60vh] overflow-auto">
            {projects.map(project => {
                const projectEvents = events.filter(e => e.projectId === project.id);
                if (projectEvents.length === 0) return null;

                const projectResources = [...new Set(projectEvents.map(e => e.resourceId))];

                return (
                    <div key={project.id} className="grid group" style={{ gridTemplateColumns: `200px repeat(${dateHeaders.length}, 1fr)`}}>
                        {/* Project Row */}
                        <div className="font-bold p-2 border-r bg-secondary/20 group-hover:bg-accent/50 sticky left-0 z-10 col-span-1">
                            {project.title}
                        </div>
                        <div className="col-span-1 border-r-0 bg-secondary/20 group-hover:bg-accent/50" style={{ gridColumn: `span ${dateHeaders.length}`}}>&nbsp;</div>

                        {/* Resource Rows */}
                        {projectResources.map(resourceId => {
                            const resource = resources.find(r => r.id === resourceId);
                            const resourceEvents = projectEvents.filter(e => e.resourceId === resourceId);

                            return (
                                <React.Fragment key={resourceId}>
                                    <div className="p-2 border-r text-sm text-muted-foreground pl-6 sticky left-0 z-10 bg-background group-hover:bg-accent/20">
                                        {resource?.title}
                                    </div>
                                    <div className="relative col-span-1 h-10" style={{ gridColumn: `span ${dateHeaders.length}`}}>
                                        {resourceEvents.map(event => {
                                            const offset = differenceInDays(event.start, intervalStart);
                                            const duration = differenceInDays(event.end, event.start) + 1;
                                            
                                            // Basic filtering to not render events completely outside the current view
                                            if (offset >= dateHeaders.length || (offset + duration) <= 0) return null;

                                            const displayOffset = Math.max(0, offset);
                                            const displayDuration = (offset < 0) 
                                                ? duration + offset 
                                                : Math.min(duration, dateHeaders.length - displayOffset);

                                            if (displayDuration <= 0) return null;

                                            return (
                                                <TooltipProvider key={event.id}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div 
                                                                className={cn("absolute my-2 rounded-sm text-white text-xs p-1 cursor-pointer truncate", getEventTypeClass(event))}
                                                                style={{
                                                                    left: `calc(${(100 / dateHeaders.length) * displayOffset}% + 2px)`,
                                                                    width: `calc(${(100 / dateHeaders.length) * displayDuration}% - 4px)`,
                                                                }}
                                                            >
                                                                {event.title}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-bold">{event.title}</p>
                                                            <p>Resource: {resource?.title}</p>
                                                            <p>Status: <span className="capitalize">{event.status}</span></p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )
                                        })}
                                    </div>
                                </React.Fragment>
                            )
                        })}
                    </div>
                )
            })}
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
