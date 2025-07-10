import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";

export default function EmployeesPage() {
    const employees = [
        { id: 'EMP001', name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Project Manager', status: 'Active' },
        { id: 'EMP002', name: 'Bob Smith', email: 'bob.s@example.com', role: 'Lead Technician', status: 'Active' },
        { id: 'EMP003', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Junior Technician', status: 'Active' },
        { id: 'EMP004', name: 'Diana Prince', email: 'diana.p@example.com', role: 'HR Specialist', status: 'On Leave' },
        { id: 'EMP005', name: 'Ethan Hunt', email: 'ethan.h@example.com', role: 'Field Technician', status: 'Inactive' },
    ];
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map(employee => (
                        <TableRow key={employee.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person" />
                                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{employee.name}</div>
                                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{employee.role}</TableCell>
                            <TableCell>
                                <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>{employee.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">View</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
