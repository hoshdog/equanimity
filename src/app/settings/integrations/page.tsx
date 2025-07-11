// src/app/settings/integrations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Power, PowerOff } from "lucide-react";
import Image from 'next/image';

export default function IntegrationsPage() {
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const checkConnection = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/xero/tenants');
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setIsConnected(true);
                        setTenants(data);
                    }
                }
            } catch (error) {
                console.error("Error checking Xero connection:", error);
            } finally {
                setLoading(false);
            }
        };
        checkConnection();
    }, []);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/xero/connect');
            if (response.ok) {
                const { consentUrl } = await response.json();
                window.location.href = consentUrl;
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to Xero. Please check your API credentials.' });
                setLoading(false);
            }
        } catch (error) {
            console.error("Error initiating Xero connection:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to Xero.' });
            setLoading(false);
        }
    };
    
    const handleDisconnect = () => {
        alert("Disconnect functionality not yet implemented.");
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                    Connect your account to third-party services like Xero.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Image src="https://developer.xero.com/static/images/xero-app-logo.svg" alt="Xero Logo" width={40} height={40} />
                            <div>
                                <CardTitle className="text-xl">Xero</CardTitle>
                                <CardDescription>Sync invoices, bills, contacts, and payroll.</CardDescription>
                            </div>
                        </div>
                         {loading ? (
                            <div className="flex items-center space-x-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : isConnected ? (
                             <Button variant="destructive" onClick={handleDisconnect} size="sm">
                                <PowerOff className="mr-2 h-4 w-4" />
                                Disconnect
                            </Button>
                        ) : (
                            <Button onClick={handleConnect} disabled={loading} size="sm">
                                {loading ? '...' : 'Connect'}
                            </Button>
                        )}
                    </CardHeader>
                    {isConnected && (
                         <CardContent>
                            <div className="flex items-center gap-2 text-sm text-green-600 border-t pt-4 mt-4">
                                <Power className="h-4 w-4"/>
                                <p className="font-semibold">Connected to: {tenants.map(t => t.tenantName).join(', ')}</p>
                            </div>
                         </CardContent>
                    )}
                 </Card>
            </CardContent>
        </Card>
    );
}
