// src/app/scheduling/calendar-view.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Briefcase, Plane, CircleHelp } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { ScheduleEvent, Resource } from './data';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CalendarViewProps {
  events: ScheduleEvent[];
  resources: Resource[];
}

const getEventColor = (event: ScheduleEvent) => {
  if (event.type === 'leave') {
    if (event.status === 'pending') return 'bg-yellow-500/20 border-yellow-500 text-yellow-700';
    return 'bg-blue-500/20 border-blue-500 text-blue-700';
  }
  if (event.status === 'tentative') return 'bg-gray-500/20 border-gray-500 text-gray-700 opacity-75';
  return 'bg-primary/20 border-primary text-primary-foreground';
}

function EventCard({ event, resource }: { event: ScheduleEvent, resource?: Resource }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("rounded-md p-2 text-xs border w-full overflow-hidden truncate", getEventColor(event))}>
                       <div className="flex items-center gap-1.5 font-semibold">
                            {event.type === 'leave' ? <Plane className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                            <span>{event.title}</span>
                       </div>
                       {resource && <p className="text-xs text-muted-foreground">{resource.title}</p>}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-bold">{event.title}</p>
                    <p>Resource: {resource?.title}</p>
                    <p>Status: <span className="capitalize">{event.status}</span></p>
                    <p>Dates: {format(event.start, 'PP')} - {format(event.end, 'PP')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}


export function CalendarView({ events, resources }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
             <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
         <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as any)} >
            <ToggleGroupItem value="month" aria-label="Month view">Month</ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view">Week</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 border-t border-l">
            {weekDays.map(day => (
                <div key={day.toString()} className="border-b border-r p-2 min-h-48">
                    <div className="font-semibold text-right">{format(day, 'd')}</div>
                    <div className="space-y-1 mt-1">
                        {getEventsForDay(day).map(event => (
                           <EventCard key={event.id} event={event} resource={resources.find(r => r.id === event.resourceId)} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
