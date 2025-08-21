// src/app/scheduling/resource-load-view.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScheduleEvent, Resource } from './data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfWeek, eachDayOfInterval, format, isWithinInterval } from 'date-fns';

interface ResourceLoadViewProps {
  events: ScheduleEvent[];
  resources: Resource[];
}

const processDataForChart = (events: ScheduleEvent[], resources: Resource[]) => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: new Date(weekStart).setDate(weekStart.getDate() + 6) });
    
    const data = resources.map(resource => {
        const dailyLoad = { name: resource.title };
        weekDays.forEach(day => {
            const dayKey = format(day, 'EEE');
            const todaysEvents = events.filter(e => 
                e.resourceId === resource.id &&
                e.type === 'work' && 
                isWithinInterval(day, { start: e.start, end: e.end })
            );
            // Assuming each event is 8 hours for simplicity
            const totalHours = todaysEvents.length * 8;
            (dailyLoad as any)[dayKey] = totalHours;
        });
        return dailyLoad;
    });

    return data;
}

export function ResourceLoadView({ events, resources }: ResourceLoadViewProps) {
  const chartData = processDataForChart(events, resources);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Load</CardTitle>
        <CardDescription>Weekly workload distribution for each team member (in hours).</CardDescription>
      </CardHeader>
      <CardContent>
         <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Mon" stackId="a" fill="hsl(var(--chart-1))" />
            <Bar dataKey="Tue" stackId="a" fill="hsl(var(--chart-2))" />
            <Bar dataKey="Wed" stackId="a" fill="hsl(var(--chart-3))" />
            <Bar dataKey="Thu" stackId="a" fill="hsl(var(--chart-4))" />
            <Bar dataKey="Fri" stackId="a" fill="hsl(var(--chart-5))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
