import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Briefcase } from "lucide-react";

export default function ProjectsPage() {
  const projects = [
    { id: 1, name: 'Website Redesign', status: 'In Progress', manager: 'Alice', teamSize: 5 },
    { id: 2, name: 'Mobile App Development', status: 'Planning', manager: 'Bob', teamSize: 8 },
    { id: 3, name: 'Q3 Marketing Campaign', status: 'Completed', manager: 'Charlie', teamSize: 3 },
    { id: 4, name: 'New Office Setup', status: 'On Hold', manager: 'Alice', teamSize: 4 },
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
          <Card key={project.id} className="flex flex-col">
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
                <span className={getStatusColor(project.status)}>{project.status}</span>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">{project.teamSize} team members</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
