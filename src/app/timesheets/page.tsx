
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
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TimesheetEntry = {
  date: Date;
  hours: string;
};

function getWeekDays(date: Date): Date[] {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
    return eachDayOfInterval({ start, end });
}

export default function TimesheetsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const weekDays = getWeekDays(currentDate);
    setTimesheetEntries(
      weekDays.map((day) => ({
        date: day,
        hours: '',
      }))
    );
  }, [currentDate]);

  const handleHoursChange = (date: Date, hours: string) => {
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(hours)) {
      setTimesheetEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.date.getTime() === date.getTime() ? { ...entry, hours } : entry
        )
      );
    }
  };

  const totalHours = useMemo(() => {
    return timesheetEntries.reduce((acc, entry) => acc + (parseFloat(entry.hours) || 0), 0);
  }, [timesheetEntries]);

  const handleSubmit = () => {
    // In a real app, this would submit the data to a backend.
    console.log("Submitting timesheet:", {
      period: `${format(timesheetEntries[0].date, 'dd MMM yyyy')} - ${format(timesheetEntries[timesheetEntries.length - 1].date, 'dd MMM yyyy')}`,
      totalHours,
      entries: timesheetEntries,
    });

    toast({
      title: 'Timesheet Submitted',
      description: `You have successfully submitted ${totalHours.toFixed(2)} hours.`,
    });
  };

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right w-32">Hours Worked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheetEntries.map(({ date, hours }) => (
                  <TableRow key={date.toISOString()}>
                    <TableCell className="font-medium">{format(date, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(date, 'EEEE')}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="text"
                        placeholder="0.0"
                        value={hours}
                        onChange={(e) => handleHoursChange(date, e.target.value)}
                        className="max-w-[100px] ml-auto text-right"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-lg">
                <span className="text-muted-foreground">Total Hours:</span>
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
