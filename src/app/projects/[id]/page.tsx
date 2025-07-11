// src/app/projects/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, FileText, ShoppingCart, Users, Receipt, Building2, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getProject } from '@/lib/projects';
import { getCustomer } from '@/lib/customers';
import type { Project, Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


function PlaceholderContent({ title, icon: Icon }: { title: string, icon: React.ElementType }) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-64">
            <Icon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">{title} will be displayed here.</p>
        </div>
    )
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        if (!params.id) return;
        setLoading(true);
        try {
            const projectData = await getProject(params.id);
            setProject(projectData);
            if (projectData) {
                const customerData = await getCustomer(projectData.customerId);
                setCustomer(customerData);
            }
        } catch(error) {
            console.error("Failed to fetch project details:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load project details.' });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [params.id, toast]);

  if (loading) {
      return (
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center h-full">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
      );
  }

  if (!project) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Project Not Found</h2>
            <p>The project you are looking for does not exist.</p>
            <Button asChild>
                <Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Projects</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-4">
             <Button asChild variant="outline" size="icon">
                <Link href="/projects">
                    <ArrowLeft className="h-4 w-4"/>
                    <span className="sr-only">Back to Projects</span>
                </Link>
            </Button>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
                <p className="text-muted-foreground">{project.description}</p>
            </div>
        </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
             <Card>
                <CardHeader>
                    <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <strong>Status:</strong>
                                <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>{project.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground"/>
                                <span><strong>Manager:</strong> Not yet assigned</span>
                            </div>
                        </div>
                        {customer &&
                        <div className="space-y-2">
                            <Link href={`/customers/${customer.id}`} className="flex items-center gap-2 hover:underline">
                               <Building2 className="h-4 w-4 text-muted-foreground" /> 
                               <span><strong>Customer:</strong> {customer.name}</span>
                            </Link>
                            {/* Site information is not directly on project yet, needs enhancement */}
                            {/* <div className="flex items-center gap-2">
                               <MapPin className="h-4 w-4 text-muted-foreground" /> 
                               <span><strong>Site:</strong> {project.siteName}</span>
                            </div> */}
                        </div>
                        }
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="jobs">
            <PlaceholderContent title="Jobs" icon={Briefcase} />
        </TabsContent>
        <TabsContent value="quotes">
            <PlaceholderContent title="Quotes" icon={FileText} />
        </TabsContent>
        <TabsContent value="purchase-orders">
            <PlaceholderContent title="Purchase Orders" icon={ShoppingCart} />
        </TabsContent>
        <TabsContent value="invoicing">
            <PlaceholderContent title="Invoices" icon={Receipt} />
        </TabsContent>
        <TabsContent value="team">
            <PlaceholderContent title="Team Members" icon={Users} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    