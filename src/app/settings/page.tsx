
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Power, PowerOff } from "lucide-react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        // Check connection status when the component mounts
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
    
    // In a real app, you'd also have a disconnect/logout function
    const handleDisconnect = () => {
        // This would involve clearing tokens on the server
        alert("Disconnect functionality not yet implemented.");
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Xero Integration</CardTitle>
                    <CardDescription>
                        Connect your Xero account to sync invoices, customers, and more.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Checking connection status...</span>
                        </div>
                    ) : isConnected ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <Power className="h-5 w-5"/>
                                <p className="font-semibold">Connected to Xero</p>
                            </div>
                             <p className="text-sm text-muted-foreground">
                                Connected to organization(s): {tenants.map(t => t.tenantName).join(', ')}
                            </p>
                            <Button variant="destructive" onClick={handleDisconnect}>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Disconnect from Xero
                            </Button>
                        </div>
                    ) : (
                         <Button onClick={handleConnect} disabled={loading}>
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Connecting...</>
                            ) : (
                                "Connect to Xero"
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
