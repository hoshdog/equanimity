// src/app/settings/jobs/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function JobsSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Job Settings</CardTitle>
                <CardDescription>Configure default settings for jobs.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Job settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
