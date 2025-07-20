// src/app/scheduling/calendar-view.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Briefcase, Plane } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, setHours, setMinutes, differenceInMinutes, getHours } from 'date-fns';
import { ScheduleEvent, Resource } from './data';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Calendar } from '@/components/ui/calendar';


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
                    <p>Dates: {format(event.start, 'p')} - {format(event.end, 'p')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function DayView({ currentDate, events, resources }: { currentDate: Date, events: ScheduleEvent[], resources: Resource[] }) {
    const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM
    const ROW_HEIGHT = 60;

    const dayEvents = events.filter(event => isSameDay(event.start, currentDate));

    return (
      <div className="grid grid-cols-[auto_1fr] border-t border-l">
        {/* Time column */}
        <div className="border-r">
          <div className="h-10 border-b">&nbsp;</div> {/* Header spacer */}
          {hours.map(hour => (
            <div key={hour} className="h-[60px] text-right pr-2 text-xs text-muted-foreground border-b flex items-center justify-end">
              {format(setMinutes(setHours(new Date(), hour), 0), 'ha')}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-1">
          {/* Day Header */}
          <div className="border-b border-r p-2 text-center font-semibold text-muted-foreground h-10">
              <span className="text-xs">{format(currentDate, 'EEE')}</span>
              <p>{format(currentDate, 'd')}</p>
          </div>
          
          {/* Day Cell */}
          <div className="border-r relative">
            {/* Background hour lines */}
            {hours.map(hour => (
              <div key={`line-${currentDate.toString()}-${hour}`} className="h-[60px] border-b"></div>
            ))}
            
            {/* Events */}
            {dayEvents.map(event => {
                const eventStartMinutes = getHours(event.start) * 60 + event.start.getMinutes() - (7 * 60);
                const eventDurationMinutes = differenceInMinutes(event.end, event.start);

                const top = (eventStartMinutes / 60) * ROW_HEIGHT;
                const height = (eventDurationMinutes / 60) * ROW_HEIGHT;

                if (top < 0) return null; // Don't render events that start before the view

              return (
                 <div
                    key={event.id}
                    className="absolute w-full px-1"
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                    }}
                 >
                     <EventCard event={event} resource={resources.find(r => r.id === event.resourceId)} />
                 </div>
              )
            })}
          </div>
        </div>
      </div>
    );
}

function WeekView({ currentDate, events, resources }: { currentDate: Date, events: ScheduleEvent[], resources: Resource[] }) {
    const weekDays = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    });

    const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(event.start, day));
    };
    
    const ROW_HEIGHT = 60; 

    return (
      <div className="grid grid-cols-[auto_1fr] border-t border-l">
        {/* Time column */}
        <div className="border-r">
          <div className="h-10 border-b">&nbsp;</div> {/* Header spacer */}
          {hours.map(hour => (
            <div key={hour} className="h-[60px] text-right pr-2 text-xs text-muted-foreground border-b flex items-center justify-end">
              {format(setMinutes(setHours(new Date(), hour), 0), 'ha')}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Day Headers */}
          {weekDays.map(day => (
            <div key={`header-${day.toString()}`} className="border-b border-r p-2 text-center font-semibold text-muted-foreground h-10">
              <span className="text-xs">{format(day, 'EEE')}</span>
              <p>{format(day, 'd')}</p>
            </div>
          ))}

          {/* Day Cells */}
          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day.toString()} className="border-r relative">
                {/* Background hour lines */}
                {hours.map(hour => (
                  <div key={`line-${day.toString()}-${hour}`} className="h-[60px] border-b"></div>
                ))}
                
                {/* Events */}
                {dayEvents.map(event => {
                  const eventStartMinutes = getHours(event.start) * 60 + event.start.getMinutes() - (7 * 60);
                  const eventDurationMinutes = differenceInMinutes(event.end, event.start);
                  
                  const top = (eventStartMinutes / 60) * ROW_HEIGHT;
                  const height = (eventDurationMinutes / 60) * ROW_HEIGHT;

                  if (top < 0) return null; // Don't render events that start before the view

                  return (
                     <div
                        key={event.id}
                        className="absolute w-full px-1"
                        style={{
                            top: `${top}px`,
                            height: `${height}px`,
                        }}
                     >
                         <EventCard event={event} resource={resources.find(r => r.id === event.resourceId)} />
                     </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    );
}


export function CalendarView({ events, resources }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');

  const handleDateChange = (direction: 'next' | 'prev') => {
    const amount = direction === 'next' ? 1 : -1;
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, amount));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, amount * 7));
    } else {
      setCurrentDate(addMonths(currentDate, amount));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleDateChange('prev')}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
             <Button variant="outline" size="icon" onClick={() => handleDateChange('next')}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
         <ToggleGroup type="single" value={viewMode} onValueChange={(value: 'month' | 'week' | 'day') => value && setViewMode(value)} >
            <ToggleGroupItem value="month" aria-label="Month view">Month</ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view">Week</ToggleGroupItem>
            <ToggleGroupItem value="day" aria-label="Day view">Day</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {viewMode === 'week' ? (
          <WeekView currentDate={currentDate} events={events} resources={resources} />
        ) : viewMode === 'day' ? (
           <DayView currentDate={currentDate} events={events} resources={resources} />
        ) : (
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && setCurrentDate(date)}
            month={currentDate}
            onMonthChange={setCurrentDate}
            className="rounded-md border p-0"
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 p-3',
              month: 'space-y-4 w-full',
              caption: 'hidden',
            }}
            components={{
              DayContent: ({ date, ...props }) => {
                const dayEvents = events.filter(e => isSameDay(e.start, date));
                return (
                  <div className={cn("flex flex-col h-full w-full justify-start items-stretch p-1 space-y-0.5 overflow-hidden", props.className)}>
                     <span className="self-end pr-2 text-sm">{date.getDate()}</span>
                    <div className="flex flex-col gap-1 overflow-y-auto">
                        {dayEvents.map(event => (
                          <div key={event.id} className="w-full">
                            <EventCard event={event} resource={resources.find(r => r.id === event.resourceId)} />
                          </div>
                        ))}
                    </div>
                  </div>
                );
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
