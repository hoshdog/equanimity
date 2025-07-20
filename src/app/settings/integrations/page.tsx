// src/app/settings/integrations/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Power, PowerOff, CheckCircle, AlertTriangle, Settings, TestTube2, ChevronsRight } from "lucide-react";
import Image from 'next/image';
import { getProjects } from '@/lib/projects';
import type { Project } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

function XeroIntegrationCard() {
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
    )
}

function TeamsIntegrationCard() {
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [teams, setTeams] = useState<{ id: string, displayName: string }[]>([]);
    const [channels, setChannels] = useState<{ id: string, displayName: string }[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState({ projects: false, teams: false, channels: false, save: false, test: false });

    // Fetch all projects on mount
    useEffect(() => {
        async function fetchProjects() {
            setLoading(p => ({ ...p, projects: true }));
            try {
                const projectsData = await getProjects();
                setProjects(projectsData);
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not load projects." });
            } finally {
                setLoading(p => ({ ...p, projects: false }));
            }
        }
        fetchProjects();
    }, [toast]);

    // Fetch teams when a project is selected
    useEffect(() => {
        if (selectedProject) {
            async function fetchTeams() {
                setLoading(p => ({ ...p, teams: true }));
                try {
                    const res = await fetch('/api/teams/list');
                    if (!res.ok) throw new Error('Failed to fetch teams');
                    const teamsData = await res.json();
                    setTeams(teamsData);
                } catch (error: any) {
                    toast({ variant: "destructive", title: "Error fetching Teams", description: error.message });
                } finally {
                    setLoading(p => ({ ...p, teams: false }));
                }
            }
            fetchTeams();
        }
    }, [selectedProject, toast]);

    // Fetch channels when a team is selected
    useEffect(() => {
        if (selectedTeamId) {
            async function fetchChannels() {
                setLoading(p => ({ ...p, channels: true }));
                try {
                    const res = await fetch(`/api/teams/channels?teamId=${selectedTeamId}`);
                    if (!res.ok) throw new Error('Failed to fetch channels');
                    const channelsData = await res.json();
                    setChannels(channelsData);
                } catch (error: any) {
                    toast({ variant: "destructive", title: "Error fetching Channels", description: error.message });
                } finally {
                    setLoading(p => ({ ...p, channels: false }));
                }
            }
            fetchChannels();
        }
    }, [selectedTeamId, toast]);

    const handleProjectSelect = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setSelectedProject(project);
            // @ts-ignore - settings might not exist
            const settings = project.settings?.teamsIntegration;
            setIsEnabled(settings?.enabled || false);
            setSelectedTeamId(settings?.teamId || '');
            setSelectedChannelId(settings?.channelId || '');
        }
    }
    
    const handleSave = async () => {
        if (!selectedProject) return;
        setLoading(p => ({ ...p, save: true }));
        try {
            const res = await fetch('/api/teams/save-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: selectedProject.id,
                    enabled: isEnabled,
                    teamId: selectedTeamId,
                    channelId: selectedChannelId,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save settings');
            toast({ title: "Settings Saved", description: "Your Teams integration settings have been saved.", icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error Saving", description: error.message });
        } finally {
            setLoading(p => ({ ...p, save: false }));
        }
    }
    
    const handleTest = async () => {
        if (!selectedProject || !selectedTeamId || !selectedChannelId) return;
        setLoading(p => ({ ...p, test: true }));
        try {
            const res = await fetch('/api/teams/test-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName: selectedProject.name,
                    teamId: selectedTeamId,
                    channelId: selectedChannelId,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Test failed');
            toast({ title: "Test Successful!", description: `Test folder created successfully.`, icon: <CheckCircle className="h-5 w-5 text-green-500" /> });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Test Failed", description: error.message, icon: <AlertTriangle className="h-5 w-5" /> });
        } finally {
            setLoading(p => ({ ...p, test: false }));
        }
    }
    

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <svg width="40" height="40" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M120.687 18.25H43.9375C41.25 18.25 39 20.5 39 23.25V79.3125C39 82.0625 41.25 84.3125 43.9375 84.3125H120.687C123.375 84.3125 125.625 82.0625 125.625 79.3125V23.25C125.625 20.5 123.375 18.25 120.687 18.25Z" fill="#6264A7"/>
                        <path d="M120.687 97.5H43.9375C41.25 97.5 39 99.75 39 102.5V158.562C39 161.312 41.25 163.562 43.9375 163.562H120.687C123.375 163.562 125.625 161.312 125.625 158.562V102.5C125.625 99.75 123.375 97.5 120.687 97.5Z" fill="#6264A7"/>
                        <path d="M120.687 176.75H43.9375C41.25 176.75 39 179 39 181.75V237.812C39 240.562 41.25 242.812 43.9375 242.812H120.687C123.375 242.812 125.625 240.562 125.625 237.812V181.75C125.625 179 123.375 176.75 120.687 176.75Z" fill="#6264A7"/>
                        <path d="M151.75 123.688V137.312H199.188C206.875 137.312 213.062 143.5 213.062 151.125V190.125C213.062 197.812 206.875 203.938 199.188 203.938H151.75V217.562C151.75 229.438 161.375 239.062 173.25 239.062C185.125 239.062 194.75 229.438 194.75 217.562V211.875H201.125C214.562 211.875 225.5 200.938 225.5 187.562V153.688C225.5 137.938 212.875 125.312 196.625 125.312L173.25 125.312C161.375 125.312 151.75 115.688 151.75 103.812V47.75C151.75 35.875 161.375 26.25 173.25 26.25C185.125 26.25 194.75 35.875 194.75 47.75V53.4375H201.125C214.562 53.4375 225.5 64.375 225.5 77.75V111.625C225.5 119.5 220.625 126.125 213.75 128.25L151.75 123.688Z" fill="#8082C5"/>
                    </svg>
                    <div>
                        <CardTitle className="text-xl">Microsoft Teams</CardTitle>
                        <CardDescription>Automatically create a folder in a Teams channel for each project.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select a Project to Configure</label>
                    <Select onValueChange={handleProjectSelect} disabled={loading.projects}>
                        <SelectTrigger>
                            <SelectValue placeholder={loading.projects ? "Loading projects..." : "Select a project"} />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {selectedProject && (
                    <>
                        <Separator />
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{selectedProject.name}</h3>
                                <div className="flex items-center space-x-2">
                                    <Switch id="teams-enabled" checked={isEnabled} onCheckedChange={setIsEnabled}/>
                                    <label htmlFor="teams-enabled">{isEnabled ? 'Enabled' : 'Disabled'}</label>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Team</label>
                                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={!isEnabled || loading.teams}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={loading.teams ? "Loading teams..." : "Select a Team"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.displayName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <label className="text-sm font-medium">Channel</label>
                                    <Select value={selectedChannelId} onValueChange={setSelectedChannelId} disabled={!selectedTeamId || loading.channels}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={loading.channels ? "Loading channels..." : "Select a Channel"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {channels.map(c => <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={handleTest} disabled={!isEnabled || !selectedTeamId || !selectedChannelId || loading.test}>
                                    {loading.test ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube2 className="mr-2 h-4 w-4" />} Test
                                </Button>
                                <Button onClick={handleSave} disabled={loading.save}>
                                    {loading.save ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Settings
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}


export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Integrations</CardTitle>
                    <CardDescription>
                        Connect your account to third-party services like Microsoft Teams and Xero.
                    </CardDescription>
                </CardHeader>
            </Card>
            <TeamsIntegrationCard />
            <XeroIntegrationCard />
        </div>
    );
}
