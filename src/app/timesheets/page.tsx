// src/app/timesheets/page.tsx
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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isEqual, addMinutes, parse, differenceInMinutes, isValid } from 'date-fns';
import { Save, PlusCircle, Trash2, Banknote, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getJobs } from '@/lib/jobs';
import type { Job, OptionType } from '@/lib/types';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useOrg } from '@/components/auth-provider';

const nonBillableTasks: OptionType[] = [
    { value: 'nonbill-travel', label: 'Travel Time' },
    { value: 'nonbill-workshop', label: 'Workshop / Office' },
    { value: 'nonbill-training', label: 'Training / Development' },
    { value: 'nonbill-meetings', label: 'Internal Meetings' },
];

type TaskEntry = {
  id: string; // Unique ID for React key
  jobId: string; // Can be a job ID or a non-billable task value
  startTime: string; // e.g., "09:00"
  finishTime: string; // e.g., "17:00"
  duration: string; // duration in hours, e.g., "8.0"
  note: string; // User-added notes for the task
};

type DailyTimesheet = {
  date: Date;
  tasks: TaskEntry[];
  bankOvertime: boolean;
};

// For this demo, we'll assume a standard 8-hour day before OT.
const OT_THRESHOLD = 8;

function getWeekDays(date: Date): Date[] {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
    return eachDayOfInterval({ start, end });
}

export default function TimesheetsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timesheet, setTimesheet] = useState<DailyTimesheet[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { orgId } = useOrg();

  useEffect(() => {
    async function fetchData() {
        if (!orgId) return;
        setLoading(true);
        try {
            const jobsData = await getJobs(orgId);
            setJobs(jobsData);
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load jobs for timesheet.' });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [toast, orgId]);
  
  const jobOptions: OptionType[] = useMemo(() => {
    return [
      ...nonBillableTasks,
      ...jobs.map(job => ({
        value: job.id,
        label: `${job.code} - ${job.title}`
      }))
    ];
  }, [jobs]);

  useEffect(() => {
    const weekDays = getWeekDays(currentDate);
    setTimesheet(
      weekDays.map((day) => ({
        date: day,
        tasks: [{
          id: `task-${day.getTime()}-0`,
          jobId: '',
          startTime: '08:00',
          finishTime: '16:00',
          duration: '8.0',
          note: ''
        }],
        bankOvertime: false,
      }))
    );
  }, [currentDate]);

  const handleTaskChange = (date: Date, taskId: string, field: 'jobId' | 'startTime' | 'finishTime' | 'duration' | 'note', value: string) => {
    setTimesheet((prevTimesheet) =>
      prevTimesheet.map((dailyEntry) => {
        if (isEqual(dailyEntry.date, date)) {
          const newTasks = dailyEntry.tasks.map((task) => {
            if (task.id === taskId) {
              const updatedTask = { ...task, [field]: value };

              const start = parse(updatedTask.startTime, 'HH:mm', date);
              const finish = parse(updatedTask.finishTime, 'HH:mm', date);

              if (field === 'startTime' || field === 'duration') {
                if (isValid(start) && !isNaN(parseFloat(updatedTask.duration))) {
                  const newFinish = addMinutes(start, parseFloat(updatedTask.duration) * 60);
                  updatedTask.finishTime = format(newFinish, 'HH:mm');
                }
              } else if (field === 'finishTime') {
                 if (isValid(start) && isValid(finish)) {
                    let diff = differenceInMinutes(finish, start);
                    if (diff < 0) diff += 24 * 60; // Handle overnight case
                    updatedTask.duration = (diff / 60).toFixed(2);
                 }
              }
              return updatedTask;
            }
            return task;
          });
          return { ...dailyEntry, tasks: newTasks };
        }
        return dailyEntry;
      })
    );
  };
  
  const handleBankOvertimeChange = (date: Date, checked: boolean) => {
      setTimesheet(prev => prev.map(d => isEqual(d.date, date) ? { ...d, bankOvertime: checked } : d));
  }

  const addTask = (date: Date) => {
      setTimesheet((prevTimesheet) => 
        prevTimesheet.map((dailyEntry) => {
            if(isEqual(dailyEntry.date, date)) {
                const lastTask = dailyEntry.tasks[dailyEntry.tasks.length - 1];
                let nextStartTime = '08:00';
                if (lastTask) {
                  nextStartTime = lastTask.finishTime; // Start next task when the last one finished
                }

                const newTaskId = `task-${date.getTime()}-${dailyEntry.tasks.length}`;
                return {
                    ...dailyEntry,
                    tasks: [...dailyEntry.tasks, { id: newTaskId, jobId: '', startTime: nextStartTime, finishTime: nextStartTime, duration: '0.0', note: '' }]
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

  const weeklyTotals = useMemo(() => {
    let regular = 0;
    let overtime = 0;
    let banked = 0;

    timesheet.forEach(day => {
        const dailyTotal = day.tasks.reduce((acc, task) => acc + (parseFloat(task.duration) || 0), 0);
        if (dailyTotal > OT_THRESHOLD) {
            const ot = dailyTotal - OT_THRESHOLD;
            regular += OT_THRESHOLD;
            if (day.bankOvertime) {
                banked += ot;
            } else {
                overtime += ot;
            }
        } else {
            regular += dailyTotal;
        }
    });

    return { regular, overtime, banked, total: regular + overtime + banked };
  }, [timesheet]);


  const handleSubmit = () => {
    if (!orgId) return;
    console.log("Submitting timesheet:", {
      orgId,
      period: `${format(timesheet[0].date, 'dd MMM yyyy')} - ${format(timesheet[timesheet.length - 1].date, 'dd MMM yyyy')}`,
      totals: weeklyTotals,
      entries: timesheet,
    });

    toast({
      title: 'Timesheet Submitted',
      description: `You have successfully submitted ${weeklyTotals.total.toFixed(2)} hours.`,
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
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Accordion type="single" collapsible defaultValue={defaultOpenValue} className="w-full">
                    {timesheet.map(({ date, tasks, bankOvertime }) => {
                        const dailyTotal = tasks.reduce((acc, task) => acc + (parseFloat(task.duration) || 0), 0);
                        const dailyOT = Math.max(0, dailyTotal - OT_THRESHOLD);

                        return (
                            <AccordionItem value={format(date, 'yyyy-MM-dd')} key={date.toISOString()}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span>{format(date, 'EEEE, MMM dd')}</span>
                                        <div className="flex items-center gap-4 text-sm">
                                            {dailyOT > 0 && <span className="font-semibold text-yellow-500">{dailyOT.toFixed(2)} hrs OT</span>}
                                            <span className="text-muted-foreground">{dailyTotal > 0 ? `${dailyTotal.toFixed(2)} hrs` : 'No hours'}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 p-2 bg-secondary/30 rounded-md">
                                        {tasks.map((task, index) => (
                                            <div key={task.id} className="space-y-2 border-b border-border/20 pb-2 last:border-b-0 last:pb-0">
                                                <div className="grid grid-cols-12 gap-2 items-end">
                                                    <div className="col-span-12 md:col-span-6 space-y-1">
                                                        {index === 0 && <Label className="text-xs ml-1">Job/Task</Label>}
                                                        <SearchableCombobox
                                                            options={jobOptions}
                                                            value={task.jobId}
                                                            onChange={(value) => handleTaskChange(date, task.id, 'jobId', value)}
                                                            placeholder="Search jobs or select non-billable..."
                                                        />
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2 space-y-1">
                                                        {index === 0 && <Label className="text-xs ml-1">Start</Label>}
                                                        <Input
                                                            type="time"
                                                            value={task.startTime}
                                                            onChange={(e) => handleTaskChange(date, task.id, 'startTime', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2 space-y-1">
                                                        {index === 0 && <Label className="text-xs ml-1">Finish</Label>}
                                                        <Input
                                                            type="time"
                                                            value={task.finishTime}
                                                            onChange={(e) => handleTaskChange(date, task.id, 'finishTime', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-span-4 md:col-span-1 space-y-1">
                                                        {index === 0 && <Label className="text-xs ml-1">Hrs</Label>}
                                                        <Input
                                                            type="text"
                                                            placeholder="Hrs"
                                                            value={task.duration}
                                                            onChange={(e) => handleTaskChange(date, task.id, 'duration', e.target.value)}
                                                            className="text-right"
                                                        />
                                                    </div>
                                                    <div className="col-span-12 md:col-span-1 flex justify-end">
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
                                                <div className="space-y-1 px-1">
                                                     {index === 0 && tasks.length === 1 && <Label className="text-xs ml-1">Notes</Label>}
                                                    <Input
                                                        type="text"
                                                        placeholder="Add notes for this task..."
                                                        value={task.note}
                                                        onChange={(e) => handleTaskChange(date, task.id, 'note', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <Separator className="my-3"/>
                                        <div className="flex items-center justify-between pt-2">
                                            <Button variant="outline" size="sm" onClick={() => addTask(date)}>
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add Task
                                            </Button>
                                            {dailyOT > 0 && (
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id={`bank-ot-${date.toISOString()}`}
                                                        checked={bankOvertime}
                                                        onCheckedChange={(checked) => handleBankOvertimeChange(date, checked)}
                                                    />
                                                    <Label htmlFor={`bank-ot-${date.toISOString()}`}>Bank Overtime</Label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-center text-sm">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground"/>
                    <div>
                        <span className="font-bold">{weeklyTotals.regular.toFixed(2)}</span>
                        <span className="text-muted-foreground"> hrs</span>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-yellow-500">OT</span>
                    <div>
                        <span className="font-bold">{weeklyTotals.overtime.toFixed(2)}</span>
                        <span className="text-muted-foreground"> hrs</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-muted-foreground"/>
                     <div>
                        <span className="font-bold">{weeklyTotals.banked.toFixed(2)}</span>
                        <span className="text-muted-foreground"> hrs</span>
                    </div>
                </div>
                 <div className="font-bold text-lg">
                    <span className="text-muted-foreground">Total: </span>
                    <span>{weeklyTotals.total.toFixed(2)}</span>
                 </div>
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
