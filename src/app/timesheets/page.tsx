
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isEqual, addMinutes, parse } from 'date-fns';
import { Save, PlusCircle, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type TaskEntry = {
  id: string; // Unique ID for React key
  task: string;
  startTime: string; // e.g., "09:00"
  hours: string; // duration
};

type DailyTimesheet = {
  date: Date;
  tasks: TaskEntry[];
};

function getWeekDays(date: Date): Date[] {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
    return eachDayOfInterval({ start, end });
}

export default function TimesheetsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timesheet, setTimesheet] = useState<DailyTimesheet[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const weekDays = getWeekDays(currentDate);
    setTimesheet(
      weekDays.map((day) => ({
        date: day,
        tasks: [{ id: `task-${day.getTime()}-0`, task: '', startTime: '08:00', hours: '8' }],
      }))
    );
  }, [currentDate]);

  const handleTaskChange = (date: Date, taskId: string, field: 'task' | 'startTime' | 'hours', value: string) => {
    if (field === 'hours' && !/^\d*\.?\d*$/.test(value)) {
        return;
    }
    
    setTimesheet((prevTimesheet) =>
      prevTimesheet.map((dailyEntry) => {
        if (isEqual(dailyEntry.date, date)) {
          return {
            ...dailyEntry,
            tasks: dailyEntry.tasks.map((task) =>
              task.id === taskId ? { ...task, [field]: value } : task
            ),
          };
        }
        return dailyEntry;
      })
    );
  };
  
  const addTask = (date: Date) => {
      setTimesheet((prevTimesheet) => 
        prevTimesheet.map((dailyEntry) => {
            if(isEqual(dailyEntry.date, date)) {
                const lastTask = dailyEntry.tasks[dailyEntry.tasks.length - 1];
                let nextStartTime = '08:00';
                if (lastTask && lastTask.startTime && lastTask.hours) {
                    try {
                        const lastStart = parse(lastTask.startTime, 'HH:mm', dailyEntry.date);
                        const lastDurationMinutes = parseFloat(lastTask.hours) * 60;
                        if (!isNaN(lastDurationMinutes)) {
                           const lastEnd = addMinutes(lastStart, lastDurationMinutes);
                           nextStartTime = format(lastEnd, 'HH:mm');
                        }
                    } catch (e) { /* ignore parse errors */ }
                }

                const newTaskId = `task-${date.getTime()}-${dailyEntry.tasks.length}`;
                return {
                    ...dailyEntry,
                    tasks: [...dailyEntry.tasks, { id: newTaskId, task: '', startTime: nextStartTime, hours: '0'}]
                }
            }
            return dailyEntry;
        })
      )
  };

  const removeTask = (date: Date, taskId: string) => {
    setTimesheet((prevTimesheet) => 
        prevTimesheet.map((dailyEntry) => {
            if(isEqual(dailyEntry.date, date)) {
                if (dailyEntry.tasks.length <= 1) return dailyEntry;
                return {
                    ...dailyEntry,
                    tasks: dailyEntry.tasks.filter(task => task.id !== taskId)
                }
            }
            return dailyEntry;
        })
      )
  }

  const calculateEndTime = (date: Date, startTime: string, duration: string) => {
      if (!startTime || !duration) return '--:--';
      try {
        const start = parse(startTime, 'HH:mm', date);
        const durationMinutes = parseFloat(duration) * 60;
        if (isNaN(durationMinutes)) return '--:--';

        const end = addMinutes(start, durationMinutes);
        return format(end, 'HH:mm');
      } catch (e) {
        return '--:--';
      }
  }

  const totalHours = useMemo(() => {
    return timesheet.reduce((total, dailyEntry) => {
        const dailyTotal = dailyEntry.tasks.reduce((acc, task) => acc + (parseFloat(task.hours) || 0), 0);
        return total + dailyTotal;
    }, 0);
  }, [timesheet]);

  const handleSubmit = () => {
    console.log("Submitting timesheet:", {
      period: `${format(timesheet[0].date, 'dd MMM yyyy')} - ${format(timesheet[timesheet.length - 1].date, 'dd MMM yyyy')}`,
      totalHours,
      entries: timesheet,
    });

    toast({
      title: 'Timesheet Submitted',
      description: `You have successfully submitted ${totalHours.toFixed(2)} hours.`,
    });
  };

  const today = new Date();
  const defaultOpenValue = timesheet.find(d => isEqual(new Date(d.date.toDateString()), new Date(today.toDateString()))) ? format(today, 'yyyy-MM-dd') : undefined;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Timesheet</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Timesheet</CardTitle>
          <CardDescription>
            Enter your hours worked for the week of {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMMM do, yyyy')}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue={defaultOpenValue} className="w-full">
            {timesheet.map(({ date, tasks }) => {
                const dayTotal = tasks.reduce((acc, task) => acc + (parseFloat(task.hours) || 0), 0);
                return (
                    <AccordionItem value={format(date, 'yyyy-MM-dd')} key={date.toISOString()}>
                        <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4">
                                <span>{format(date, 'EEEE, MMM dd')}</span>
                                <span className="text-muted-foreground">{dayTotal > 0 ? `${dayTotal.toFixed(2)} hrs` : 'No hours'}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-2 p-2 bg-secondary/30 rounded-md">
                             {tasks.map((task, index) => (
                                <div key={task.id} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-12 md:col-span-6">
                                        <Input 
                                            placeholder="Job or task description"
                                            value={task.task}
                                            onChange={(e) => handleTaskChange(date, task.id, 'task', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <Input
                                            type="time"
                                            value={task.startTime}
                                            onChange={(e) => handleTaskChange(date, task.id, 'startTime', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <Input
                                            type="text"
                                            placeholder="Duration"
                                            value={task.hours}
                                            onChange={(e) => handleTaskChange(date, task.id, 'hours', e.target.value)}
                                            className="text-right"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex items-center justify-center text-muted-foreground font-mono text-sm">
                                        {calculateEndTime(date, task.startTime, task.hours)}
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex justify-end">
                                         <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeTask(date, task.id)}
                                            disabled={tasks.length <= 1}
                                            aria-label="Remove task"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                             ))}
                             <div className="pt-2">
                                <Button variant="outline" size="sm" onClick={() => addTask(date)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Task
                                </Button>
                             </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
          </Accordion>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-lg">
                <span className="text-muted-foreground">Total Weekly Hours:</span>
                <span className="font-bold ml-2">{totalHours.toFixed(2)}</span>
            </div>
            <Button onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" />
                Submit Timesheet
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
