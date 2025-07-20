// src/app/scheduling/list-view.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScheduleEvent, Resource, Project } from './data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ListViewProps {
  events: ScheduleEvent[];
  resources: Resource[];
  projects: Project[];
}

const getStatusVariant = (status: ScheduleEvent['status']) => {
    switch(status) {
        case 'confirmed': return 'default';
        case 'tentative': return 'secondary';
        case 'pending': return 'destructive';
        case 'approved': return 'default';
        default: return 'outline';
    }
}

export function ListView({ events, resources, projects }: ListViewProps) {
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  
    return (
    <Card>
      <CardHeader>
        <CardTitle>List View</CardTitle>
        <CardDescription>A comprehensive list of all scheduled events.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event / Task</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvents.map(event => {
                const resource = resources.find(r => r.id === event.resourceId);
                const project = projects.find(p => p.id === event.projectId);
                const isLeave = event.type === 'leave';
                return (
                    <TableRow key={event.id}>
                        <TableCell>
                            <div className="font-medium">{event.title}</div>
                            {project && <div className="text-sm text-muted-foreground">{project.title}</div>}
                        </TableCell>
                        <TableCell>{resource?.title}</TableCell>
                        <TableCell>{format(event.start, 'PP')}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(event.status)} className={cn(isLeave && "bg-blue-500 hover:bg-blue-600", event.status === 'pending' && 'bg-yellow-500 hover:bg-yellow-600')}>
                                {isLeave && `Leave: `}{event.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           {isLeave && event.status === 'pending' ? (
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm">Approve</Button>
                                <Button variant="destructive" size="sm">Reject</Button>
                            </div>
                           ) : (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>Edit Event</DropdownMenuItem>
                                    <DropdownMenuItem>Reassign</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                    Cancel Event
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                           )}
                        </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
