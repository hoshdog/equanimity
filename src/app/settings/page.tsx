// src/app/settings/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud } from "lucide-react";
import Image from "next/image";

export default function CompanySettingsPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                    <CardDescription>Update your company's core information, addresses, and contact details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="company-name">Company Name</Label>
                            <Input id="company-name" defaultValue="Detron Pty Ltd" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company-phone">Phone</Label>
                            <Input id="company-phone" defaultValue="0407548598" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="company-email">Email</Label>
                            <Input id="company-email" type="email" defaultValue="admin@detron.com.au" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company-website">Website</Label>
                            <Input id="company-website" defaultValue="www.detron.com.au" />
                        </div>
                    </div>
                     <Separator />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-md font-medium">Physical Address</h3>
                            <div className="space-y-2">
                                <Label htmlFor="address-1">Address Line 1</Label>
                                <Input id="address-1" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address-2">Address Line 2</Label>
                                <Input id="address-2" defaultValue="Kangaroo Point, QLD, 4169" />
                            </div>
                        </div>
                         <div className="space-y-4">
                            <h3 className="text-md font-medium">Mailing Address</h3>
                            <div className="space-y-2">
                                <Label htmlFor="mail-address-1">Address Line 1</Label>
                                <Input id="mail-address-1" defaultValue="18 Lockerbie Street" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mail-address-2">Address Line 2</Label>
                                <Input id="mail-address-2" defaultValue="Kangaroo Point, QLD 4169" />
                            </div>
                        </div>
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Identifiers</CardTitle>
                    <CardDescription>Manage your company's legal and regulatory identifiers.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company-abn">ABN</Label>
                        <Input id="company-abn" defaultValue="57 644 008 784" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company-acn">ACN</Label>
                        <Input id="company-acn" defaultValue="644 008 784" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company-licence">Licence #</Label>
                        <Input id="company-licence" defaultValue="87262" />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Bank Account</CardTitle>
                    <CardDescription>Your company's primary bank account details for payments and billing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-name">Bank Name</Label>
                            <Input id="bank-name" defaultValue="Suncorp" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="account-name">Account Name</Label>
                            <Input id="account-name" defaultValue="Detron Pty Ltd" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bsb">BSB</Label>
                            <Input id="bsb" defaultValue="484799" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="account-number">Account #</Label>
                            <Input id="account-number" defaultValue="120331511" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="swift-code">Swift Code</Label>
                            <Input id="swift-code" defaultValue="METWAU4B" />
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>Customize the look of your documents by uploading a logo.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Company Logo</Label>
                        <div className="flex items-center gap-4">
                             <Image src="https://storage.googleapis.com/aifire.appspot.com/images%2FDetron_Logo_2e132049-add5-470a-a13a-a185b3b185b3.png" alt="Company Logo" width={128} height={40} className="rounded-md bg-muted p-2" data-ai-hint="logo company" />
                            <Button variant="outline" asChild>
                                <label htmlFor="logo-upload">Change Logo</label>
                            </Button>
                            <Input id="logo-upload" type="file" className="hidden" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>PDF Background</Label>
                         <div className="flex items-center justify-center w-full">
                            <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                </div>
                                <Input id="pdf-upload" type="file" className="hidden" />
                            </label>
                        </div> 
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button>Save All Changes</Button>
            </div>
        </div>
    );
}
