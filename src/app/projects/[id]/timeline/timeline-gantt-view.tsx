// src/app/projects/[id]/timeline/timeline-gantt-view.tsx
'use client';

import * as React from 'react';
import { TimelineItem } from '@/lib/types';
import { differenceInDays, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, Circle, CheckCircle, Package, GanttChartSquare } from 'lucide-react';
import { ItemFormDialog } from './item-form-dialog';

interface TimelineGanttViewProps {
  items: TimelineItem[];
  projectId: string;
}

const getProjectDateRange = (items: TimelineItem[]) => {
  if (items.length === 0) {
    const today = new Date();
    return { start: today, end: new Date(today.setDate(today.getDate() + 30)) };
  }
  const startDates = items.map(item => parseISO(item.startDate));
  const endDates = items.map(item => parseISO(item.endDate));
  return {
    start: new Date(Math.min(...startDates.map(d => d.getTime()))),
    end: new Date(Math.max(...endDates.map(d => d.getTime()))),
  };
};

// Simplified Dependency Arrows (SVG)
function DependencyArrows({ items, projectStart, totalDays }: { items: TimelineItem[], projectStart: Date, totalDays: number }) {
  const itemPositions = new Map<string, { top: number, left: number, width: number }>();
  
  items.forEach((item, index) => {
    const offset = differenceInDays(parseISO(item.startDate), projectStart);
    const duration = differenceInDays(parseISO(item.endDate), parseISO(item.startDate)) || 1;
    const left = (offset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    itemPositions.set(item.id, { top: index * 44 + 22, left, width });
  });

  return (
    <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      {items.map(item => {
        if (!item.dependencies || item.dependencies.length === 0) return null;
        
        const toPos = itemPositions.get(item.id);
        if (!toPos) return null;

        return item.dependencies.map(depId => {
          const fromPos = itemPositions.get(depId);
          if (!fromPos) return null;

          const x1 = fromPos.left + fromPos.width;
          const y1 = fromPos.top;
          const x2 = toPos.left;
          const y2 = toPos.top;

          return (
            <path
              key={`${depId}-${item.id}`}
              d={`M ${x1}% ${y1} C ${x1 + 4}% ${y1}, ${x2 - 4}% ${y2}, ${x2}% ${y2}`}
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          );
        });
      })}
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="hsl(var(--primary))" />
        </marker>
      </defs>
    </svg>
  );
}


export function TimelineGanttView({ items, projectId }: TimelineGanttViewProps) {
  const { start: projectStart, end: projectEnd } = getProjectDateRange(items);
  const totalDays = differenceInDays(projectEnd, projectStart) + 1;

  if (totalDays <= 0 || items.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-96">
              <GanttChartSquare className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">No items in the timeline yet. Add a job or task to get started.</p>
          </div>
      )
  }

  return (
    <div className="relative overflow-x-auto border rounded-lg">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-12 bg-muted/50 font-semibold">
          <div className="col-span-3 border-r p-2">Task Name</div>
          <div className="col-span-9 relative grid" style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}>
            {Array.from({ length: totalDays }).map((_, i) => (
              <div key={i} className="border-r text-xs text-center p-2">
                {format(new Date(projectStart).setDate(projectStart.getDate() + i), 'd')}
              </div>
            ))}
          </div>
        </div>
        
        {/* Body */}
        <div className="relative">
          <DependencyArrows items={items} projectStart={projectStart} totalDays={totalDays} />
          {items.map((item, index) => {
            const offset = differenceInDays(parseISO(item.startDate), projectStart);
            const duration = differenceInDays(parseISO(item.endDate), parseISO(item.startDate)) || 1;

            return (
              <div key={item.id} className="grid grid-cols-12 hover:bg-accent/50">
                <div className="col-span-3 border-r border-t p-2 flex items-center gap-2 truncate">
                  {item.isCritical ? <ArrowRight className="h-4 w-4 text-destructive shrink-0"/> : item.type === 'job' ? <Package className="h-4 w-4 text-muted-foreground shrink-0"/> : <Circle className="h-3 w-3 ml-1 text-muted-foreground shrink-0"/>}
                  <ItemFormDialog projectId={projectId} allItems={items} itemToEdit={item}>
                    <button className="truncate text-left font-medium hover:underline">{item.name}</button>
                  </ItemFormDialog>
                </div>
                <div className="col-span-9 relative border-t h-11">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'absolute h-8 my-1.5 rounded-md flex items-center px-2 text-white text-xs',
                            item.isCritical ? 'bg-destructive/80' : 'bg-primary/80',
                            item.type === 'task' && 'opacity-75'
                          )}
                          style={{
                            left: `calc(${(offset / totalDays) * 100}% + 2px)`,
                            width: `calc(${(duration / totalDays) * 100}% - 4px)`,
                          }}
                        >
                          <span className="truncate">{item.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-bold">{item.name}</p>
                        <p>Duration: {duration} day{duration > 1 && 's'}</p>
                        <p>Dates: {format(parseISO(item.startDate), 'MMM d')} - {format(parseISO(item.endDate), 'MMM d')}</p>
                        {item.isCritical && <p className="font-bold text-destructive">On Critical Path</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
