// src/app/settings/plan/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PlanSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Plan & Billing</CardTitle>
                <CardDescription>Manage your subscription and billing details.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Plan & Billing settings.</p>
                <Button className="mt-4">Upgrade Plan</Button>
            </CardContent>
        </Card>
    );
}
