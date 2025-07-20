// src/app/scheduling/timeline-view.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScheduleEvent, Resource, Project } from './data';
import { format, differenceInDays, startOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
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
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => format(new Date(weekStart).setDate(weekStart.getDate() + i), 'EEE d'));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>Weekly timeline view of projects and assigned resources.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
           <div className="grid grid-cols-[200px_1fr]">
              <div className="font-semibold p-2 border-b border-r bg-muted/50">Project / Resource</div>
              <div className="grid grid-cols-7 border-b bg-muted/50">
                {weekDays.map(day => (
                    <div key={day} className="text-center font-semibold p-2 border-r last:border-r-0">{day}</div>
                ))}
              </div>
           </div>
           <div className="divide-y">
            {projects.map(project => {
                const projectEvents = events.filter(e => e.projectId === project.id);
                const projectResources = [...new Set(projectEvents.map(e => e.resourceId))];

                return (
                    <div key={project.id} className="grid grid-cols-[200px_1fr] group">
                        <div className="font-bold p-2 border-r bg-muted/20 group-hover:bg-accent/50">
                            {project.title}
                        </div>
                         <div className="grid grid-cols-7 relative h-10 border-r-0">
                             {/* Placeholder for project-level bar if needed */}
                         </div>

                        {projectResources.map(resourceId => {
                            const resource = resources.find(r => r.id === resourceId);
                            const resourceEvents = projectEvents.filter(e => e.resourceId === resourceId);

                            return (
                                <div key={resourceId} className="grid grid-cols-[200px_1fr] col-span-2 group-hover:bg-accent/20">
                                    <div className="p-2 border-r text-sm text-muted-foreground pl-6">{resource?.title}</div>
                                    <div className="grid grid-cols-7 relative h-10">
                                        {resourceEvents.map(event => {
                                            const offset = differenceInDays(event.start, weekStart);
                                            const duration = differenceInDays(event.end, event.start) + 1;
                                            
                                            if (offset < 0 && (offset + duration) <= 0) return null; // Event is before this week
                                            if (offset >= 7) return null; // Event is after this week

                                            const displayOffset = Math.max(0, offset);
                                            const displayDuration = (offset < 0) 
                                                ? duration + offset 
                                                : Math.min(duration, 7 - displayOffset);

                                            return (
                                                <TooltipProvider key={event.id}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div 
                                                                className={cn("absolute my-2 rounded-sm text-white text-xs p-1 cursor-pointer truncate", getEventTypeClass(event))}
                                                                style={{
                                                                    gridColumnStart: displayOffset + 1,
                                                                    gridColumnEnd: `span ${displayDuration}`,
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
                                </div>
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
