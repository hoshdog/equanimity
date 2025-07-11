// src/app/settings/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function CompanySettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Update your company's information here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" placeholder="Your Company Pty Ltd" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="company-address">Address</Label>
                    <Input id="company-address" placeholder="123 Example St, Sydney NSW 2000" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="company-abn">ABN</Label>
                    <Input id="company-abn" placeholder="00 000 000 000" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="company-phone">Phone Number</Label>
                    <Input id="company-phone" placeholder="02 9999 8888" />
                </div>
                <Button>Save Changes</Button>
            </CardContent>
        </Card>
    );
}
