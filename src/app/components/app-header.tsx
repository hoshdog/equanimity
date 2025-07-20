// src/app/components/app-header.tsx
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, Timer, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimeTracker } from '@/context/time-tracker-context';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useBreadcrumb } from '@/context/breadcrumb-context';

function Breadcrumbs() {
  const pathname = usePathname();
  const { dynamicTitle } = useBreadcrumb();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Home className="h-4 w-4" />
        <span className="font-semibold">Dashboard</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-sm font-medium text-muted-foreground">
      <Link href="/" className="hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4 mx-1" />
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        
        // If it's the last segment, use the dynamic title from context if it exists, otherwise use the segment itself.
        const label = isLast ? dynamicTitle || segment : segment;

        return (
          <React.Fragment key={path}>
            {isLast ? (
              <span className="text-foreground capitalize">{label}</span>
            ) : (
              <Link href={path} className="hover:text-foreground capitalize">
                {segment}
              </Link>
            )}
            {!isLast && <ChevronRight className="h-4 w-4 mx-1" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function GlobalTimeTracker() {
    const {
        timeSpent,
        isTimerActive,
        context,
        logTime,
    } = useTimeTracker();

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleLogTime = () => {
        logTime();
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-3">
                        {context && (
                             <div className="text-right">
                                <p className="text-sm font-medium leading-none">{context.name}</p>
                                <p className="text-xs text-muted-foreground">Tracking time</p>
                            </div>
                        )}
                        <Badge
                            variant={isTimerActive ? 'default' : 'secondary'}
                            className={cn(
                                'transition-colors w-28 justify-center',
                                isTimerActive && 'bg-primary/20 text-primary border-primary/30'
                            )}
                        >
                            <Timer className="h-4 w-4 mr-1.5" />
                            {formatTime(timeSpent)}
                        </Badge>
                        
                        {context && (
                           <Button onClick={handleLogTime} size="sm" disabled={timeSpent < 1}>
                                Log Time
                            </Button>
                        )}
                        
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    {context ? (
                        <div>
                            <p>
                                Automatically tracking time for: <span className="font-semibold">{context.name}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isTimerActive 
                                    ? "Timer is active. It will pause after 5 mins of inactivity."
                                    : "Timer is paused. Move your mouse or type to resume."
                                }
                            </p>
                        </div>
                    ) : (
                        <p>Navigate to a project, job, or quote to start tracking time.</p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-4">
      <Breadcrumbs />
      <GlobalTimeTracker />
    </header>
  );
}
