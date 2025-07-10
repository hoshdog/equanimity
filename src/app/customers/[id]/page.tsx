
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const mockCustomerData = {
    '1': { 
        id: '1', name: 'Innovate Corp', address: '123 Tech Park, Sydney NSW 2000', primaryContact: 'John Doe', email: 'john.doe@innovate.com', phone: '02 9999 8888', type: 'Corporate Client',
        sites: [
            { id: 'S1A', name: 'Sydney HQ', address: '123 Tech Park, Sydney NSW 2000'},
            { id: 'S1B', name: 'Melbourne Office', address: '55 Collins St, Melbourne VIC 3000'},
        ],
        projects: [
            { id: 'P1A1', siteId: 'S1A', name: 'Website Redesign', status: 'In Progress' },
            { id: 'P1A2', siteId: 'S1A', name: 'Server Upgrade', status: 'Completed' },
            { id: 'P1B1', siteId: 'S1B', name: 'Office Network Setup', status: 'Planning' },
        ]
    },
    '2': { 
        id: '2', name: 'Builders Pty Ltd', address: '456 Construction Ave, Melbourne VIC 3000', primaryContact: 'Jane Smith', email: 'jane.smith@builders.com', phone: '03 8888 7777', type: 'Construction Partner',
        sites: [
            { id: 'S2A', name: 'Main Yard', address: '456 Construction Ave, Melbourne VIC 3000'},
        ],
        projects: [
            { id: 'P2A1', siteId: 'S2A', name: 'New Apartment Complex Wiring', status: 'In Progress' },
            { id: 'P2A2', siteId: 'S2A', name: 'Security System Install', status: 'In Progress' },
        ]
     },
    '3': { 
        id: '3', name: 'Greenleaf Cafe', address: '789 Garden St, Brisbane QLD 4000', primaryContact: 'Peter Chen', email: 'peter.chen@greenleaf.com', phone: '07 7777 6666', type: 'Small Business',
        sites: [
             { id: 'S3A', name: 'Greenleaf Cafe', address: '789 Garden St, Brisbane QLD 4000'},
        ],
        projects: [
            { id: 'P3A1', siteId: 'S3A', name: 'Kitchen Appliance Testing', status: 'Completed' },
        ]
     },
    '4': { 
        id: '4', name: 'State Gov Dept', address: '101 Parliament Pl, Canberra ACT 2600', primaryContact: 'Susan Reid', email: 's.reid@gov.au', phone: '02 6666 5555', type: 'Government',
        sites: [
             { id: 'S4A', name: 'Civic Building A', address: '101 Parliament Pl, Canberra ACT 2600'},
             { id: 'S4B', name: 'Barton Office Complex', address: '4 National Circuit, Barton ACT 2600'},
        ],
        projects: [
             { id: 'P4A1', siteId: 'S4A', name: 'Accessibility Ramp Electrics', status: 'On Hold' },
             { id: 'P4B1', siteId: 'S4B', name: 'Data Centre Maintenance', status: 'In Progress' },
        ]
     },
};

const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600';
      case 'Planning': return 'text-blue-600';
      case 'Completed': return 'text-green-600';
      case 'On Hold': return 'text-gray-600';
      default: return 'text-gray-500';
    }
}


export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = mockCustomerData[params.id as keyof typeof mockCustomerData];
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(customer?.sites[0]?.id || null);

  if (!customer) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Customer Not Found</h2>
            <p>The customer you are looking for does not exist.</p>
            <Button asChild>
                <Link href="/customers"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Customers</Link>
            </Button>
        </div>
    );
  }

  const filteredProjects = customer.projects.filter(p => p.siteId === selectedSiteId);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-4 mb-4">
             <Button asChild variant="outline" size="icon">
                <Link href="/customers">
                    <ArrowLeft className="h-4 w-4"/>
                    <span className="sr-only">Back to Customers</span>
                </Link>
            </Button>
            <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary"/>
                    {customer.name}
                </h2>
                <p className="text-muted-foreground">{customer.address}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Admin & Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.primaryContact}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                             <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                        </div>
                         <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.phone}</span>
                        </div>
                        <div>
                           <Badge variant="secondary">{customer.type}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Tabs defaultValue="sites">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sites">Sites</TabsTrigger>
                        <TabsTrigger value="projects">All Projects</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sites">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1 space-y-2">
                                <h3 className="font-semibold text-lg">Sites</h3>
                                {customer.sites.map(site => (
                                    <button key={site.id} onClick={() => setSelectedSiteId(site.id)} className={cn("w-full text-left p-3 rounded-md border", selectedSiteId === site.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>
                                        <div className="font-semibold">{site.name}</div>
                                        <div className={cn("text-xs", selectedSiteId === site.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{site.address}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="font-semibold text-lg mb-2">Projects for {customer.sites.find(s => s.id === selectedSiteId)?.name || 'Selected Site'}</h3>
                                {filteredProjects.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredProjects.map(project => (
                                             <Link href={`/projects/${project.id.replace('P', '')}`} key={project.id}>
                                                <Card className="hover:border-primary transition-colors">
                                                    <CardContent className="p-4">
                                                        <div className="font-semibold">{project.name}</div>
                                                        <span className={cn("text-sm", getStatusColor(project.status))}>{project.status}</span>
                                                    </CardContent>
                                                </Card>
                                             </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                                        <Briefcase className="h-12 w-12 text-muted-foreground" />
                                        <p className="mt-4 text-sm text-muted-foreground">No projects found for this site.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="projects">
                        <Card>
                            <CardHeader>
                                <CardTitle>All Projects for {customer.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {customer.projects.map(project => (
                                    <Link href={`/projects/${project.id.replace('P', '')}`} key={project.id}>
                                        <Card className="hover:border-primary transition-colors">
                                             <CardContent className="p-4 flex justify-between items-center">
                                                <div>
                                                    <div className="font-semibold">{project.name}</div>
                                                    <div className={cn("text-sm", getStatusColor(project.status))}>{project.status}</div>
                                                </div>
                                                <Badge variant="outline">{customer.sites.find(s => s.id === project.siteId)?.name}</Badge>
                                             </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    </div>
  );
}
