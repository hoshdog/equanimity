// src/app/scheduling/leave-request-modal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface LeaveRequestModalProps {
    children: React.ReactNode;
}

export function LeaveRequestModal({ children }: LeaveRequestModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 4),
    });
    const { toast } = useToast();
    
    const handleSubmit = () => {
        // Here you would call a function to save the leave request to your database
        console.log("Submitting leave request...");
        toast({
            title: "Leave Request Submitted",
            description: "Your leave request has been sent for approval.",
        });
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                    <DialogDescription>
                        Fill out the form below to submit a leave request.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Leave Type</Label>
                            <Select defaultValue="annual">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select leave type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="annual">Annual Leave</SelectItem>
                                    <SelectItem value="sick">Sick Leave</SelectItem>
                                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Dates</Label>
                             <Input
                                id="date"
                                value={
                                  date?.from
                                    ? date.to
                                      ? `${format(date.from, "LLL dd, y")} - ${format(
                                          date.to,
                                          "LLL dd, y"
                                        )}`
                                      : format(date.from, "LLL dd, y")
                                    : "Pick a date range"
                                }
                                readOnly
                              />
                        </div>
                    </div>
                     <Calendar
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={1}
                        className="rounded-md border"
                    />
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea id="notes" placeholder="e.g., Family vacation" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Submit Request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
