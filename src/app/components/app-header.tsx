// src/app/components/app-header.tsx
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, Timer } from 'lucide-react';
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
  const { breadcrumbs } = useBreadcrumb();
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
        const breadcrumbLabel = breadcrumbs[path];
        
        let label = breadcrumbLabel || segment;
        if (!breadcrumbLabel && isLast) {
          const parentPath = `/${segments.slice(0, index).join('/')}`;
          if (breadcrumbs[parentPath]) {
             label = segment; // If parent has a label, show the raw segment for the child
          }
        }


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
  const { timeSpent, isTimerActive, context, logTime } = useTimeTracker();

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
     <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3">
              <Badge variant={isTimerActive ? "default" : "secondary"} className={cn(
                  "transition-colors",
                  isTimerActive && "bg-primary/20 text-primary border-primary/30"
              )}>
                  <Timer className="h-4 w-4 mr-1.5" />
                  {formatTime(timeSpent)}
              </Badge>
              <Button onClick={logTime} size="sm" disabled={!context || timeSpent < 1}>
                  Log Time
              </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
            {context ? (
                <p>Tracking time for: <span className="font-semibold">{context.name}</span></p>
            ) : (
                <p>Navigate to a project or quote to start tracking time.</p>
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
