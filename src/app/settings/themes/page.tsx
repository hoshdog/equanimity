// src/app/settings/themes/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ThemesSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Document Themes</CardTitle>
                <CardDescription>Customize the look and feel of your documents.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Document Themes settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
