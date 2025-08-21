// src/app/settings/scheduler/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SchedulerSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Scheduler Settings</CardTitle>
                <CardDescription>Configure default settings for the scheduler.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Scheduler settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
