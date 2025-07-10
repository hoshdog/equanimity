import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Briefcase } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";


export default function ProjectsPage() {
  const projects = [
    { id: 1, name: 'Website Redesign', description: 'Complete overhaul of the corporate website with a new CMS.', status: 'In Progress', manager: 'Alice', teamSize: 5 },
    { id: 2, name: 'Mobile App Development', description: 'Building a new cross-platform mobile application for customer engagement.', status: 'Planning', manager: 'Bob', teamSize: 8 },
    { id: 3, name: 'Q3 Marketing Campaign', description: 'Launch campaign for the new product line across all digital channels.', status: 'Completed', manager: 'Charlie', teamSize: 3 },
    { id: 4, name: 'New Office Setup', description: 'Physical setup and IT infrastructure for the new branch office.', status: 'On Hold', manager: 'Alice', teamSize: 4 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600';
      case 'Planning': return 'text-blue-600';
      case 'Completed': return 'text-green-600';
      case 'On Hold': return 'text-gray-600';
      default: return 'text-gray-500';
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Card className="flex flex-col h-full hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  {project.name}
                </CardTitle>
                <CardDescription>Managed by {project.manager}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold">Status: </span>
                  <span className={cn(getStatusColor(project.status))}>{project.status}</span>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">{project.teamSize} team members</p>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
