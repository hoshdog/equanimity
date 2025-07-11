// src/app/settings/security/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SecuritySettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security settings like two-factor authentication.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Security settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
