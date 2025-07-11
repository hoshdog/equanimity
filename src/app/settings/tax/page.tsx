// src/app/settings/tax/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TaxSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>Configure tax rates and settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Tax settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
