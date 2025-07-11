// src/app/settings/email/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmailSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>Configure outgoing email settings and templates.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Email settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
