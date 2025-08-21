// src/app/settings/prices/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PricesSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Price List Settings</CardTitle>
                <CardDescription>Manage your company's price list.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Placeholder for Price List settings.</p>
                <Button className="mt-4">Save</Button>
            </CardContent>
        </Card>
    );
}
