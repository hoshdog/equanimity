import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, FileText, ShoppingCart, Users, Receipt, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const projects = [
    { id: 1, name: 'Website Redesign', description: 'Complete overhaul of the corporate website with a new CMS.', status: 'In Progress', manager: 'Alice', teamSize: 5, customerId: '1', customerName: 'Innovate Corp', siteName: 'Sydney HQ' },
    { id: 2, name: 'Mobile App Development', description: 'Building a new cross-platform mobile application for customer engagement.', status: 'Planning', manager: 'Bob', teamSize: 8, customerId: '2', customerName: 'Builders Pty Ltd', siteName: 'Main Yard' },
    { id: 3, name: 'Q3 Marketing Campaign', description: 'Launch campaign for the new product line across all digital channels.', status: 'Completed', manager: 'Charlie', teamSize: 3, customerId: '3', customerName: 'Greenleaf Cafe', siteName: 'Greenleaf Cafe' },
    { id: 4, name: 'New Office Setup', description: 'Physical setup and IT infrastructure for the new branch office.', status: 'On Hold', manager: 'Alice', teamSize: 4, customerId: '1', customerName: 'Innovate Corp', siteName: 'Melbourne Office' },
];

function PlaceholderContent({ title, icon: Icon }: { title: string, icon: React.ElementType }) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-64">
            <Icon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">{title} will be displayed here.</p>
        </div>
    )
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = projects.find(p => p.id === parseInt(params.id));

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
                                <span><strong>Manager:</strong> {project.manager}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground"/>
                                <span><strong>Team Size:</strong> {project.teamSize}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Link href={`/customers/${project.customerId}`} className="flex items-center gap-2 hover:underline">
                               <Building2 className="h-4 w-4 text-muted-foreground" /> 
                               <span><strong>Customer:</strong> {project.customerName}</span>
                            </Link>
                            <div className="flex items-center gap-2">
                               <MapPin className="h-4 w-4 text-muted-foreground" /> 
                               <span><strong>Site:</strong> {project.siteName}</span>
                            </div>
                        </div>
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
