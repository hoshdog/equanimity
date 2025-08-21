// src/app/settings/timesheets/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

export default function TimesheetsSettingsPage() {
    const [weekStart, setWeekStart] = useState('monday');
    const { toast } = useToast();

    const handleSaveChanges = () => {
        // In a real app, this would save the setting to a database.
        console.log("Saving timesheet settings:", { weekStart });
        toast({
            title: "Settings Saved",
            description: "Your timesheet settings have been updated.",
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Timesheets</CardTitle>
                <CardDescription>
                    Configure what day of the week your timesheets start from and how time is recorded.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="week-start">Timesheet Week Start</Label>
                    <Select value={weekStart} onValueChange={setWeekStart}>
                        <SelectTrigger id="week-start" className="max-w-xs">
                            <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <Button onClick={handleSaveChanges}>Save Changes</Button>
            </CardContent>
        </Card>
    );
}
