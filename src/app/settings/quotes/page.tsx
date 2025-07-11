// src/app/settings/quotes/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuotesSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Quotes Settings</CardTitle>
                <CardDescription>Configure default settings for quotes.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Quotes settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
