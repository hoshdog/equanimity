// src/app/settings/invoices/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InvoicesSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
                <CardDescription>Configure default settings for invoices.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Invoice settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
