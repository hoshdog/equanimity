// src/app/settings/timesheets/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TimesheetsSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Timesheets Settings</CardTitle>
                <CardDescription>Configure default settings for timesheets.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Timesheets settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
