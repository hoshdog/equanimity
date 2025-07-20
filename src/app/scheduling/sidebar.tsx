// src/app/scheduling/sidebar.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { Calendar, GanttChartSquare, BarChart3, List, PlusCircle, Filter } from 'lucide-react';
import { mockProjects, mockResources } from './data';
import { LeaveRequestModal } from './leave-request-modal';

// Mock data for filters
const projectOptions: OptionType[] = mockProjects.map(p => ({ value: p.id, label: p.title }));
const resourceOptions: OptionType[] = mockResources.map(r => ({ value: r.id, label: r.title }));
const statusOptions: OptionType[] = [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'tentative', label: 'Tentative' },
    { value: 'pending', label: 'Pending Leave' },
    { value: 'approved', label: 'Approved Leave' },
];


export function SchedulingSidebar() {
  const [selectedProjects, setSelectedProjects] = useState<OptionType[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<OptionType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<OptionType[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Actions</h4>
            <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                    <PlusCircle className="mr-2 h-4 w-4" /> New Project
                </Button>
                 <Button variant="outline" className="w-full justify-start">
                    <PlusCircle className="mr-2 h-4 w-4" /> New Job
                </Button>
                <LeaveRequestModal>
                    <Button variant="outline" className="w-full justify-start">
                        <PlusCircle className="mr-2 h-4 w-4" /> Request Leave
                    </Button>
                </LeaveRequestModal>
            </div>
        </div>
        
        <Separator />

        <div className="space-y-2">
            <h4 className="text-sm font-medium">View</h4>
             <ToggleGroup type="single" defaultValue="calendar" className="w-full grid grid-cols-4">
                <ToggleGroupItem value="calendar" aria-label="Calendar view">
                    <Calendar className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="timeline" aria-label="Timeline view">
                    <GanttChartSquare className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="load" aria-label="Resource load view">
                    <BarChart3 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>

        <Separator />

        <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
            </h4>
            <div className="space-y-4">
                <MultiSelect
                    options={projectOptions}
                    selected={selectedProjects}
                    onChange={setSelectedProjects}
                    placeholder="Filter projects..."
                />
                <MultiSelect
                    options={resourceOptions}
                    selected={selectedStaff}
                    onChange={setSelectedStaff}
                    placeholder="Filter staff..."
                />
                <MultiSelect
                    options={statusOptions}
                    selected={selectedStatuses}
                    onChange={setSelectedStatuses}
                    placeholder="Filter by status..."
                />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
