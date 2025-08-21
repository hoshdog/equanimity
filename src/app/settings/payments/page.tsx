// src/app/settings/payments/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentsSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payments Settings</CardTitle>
                <CardDescription>Configure default settings for payments.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Payments settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
