// src/app/employees/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { getEmployees, deleteCustomer } from '@/lib/employees';
import type { Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { EmployeeFormDialog } from './employee-form-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const employeesData = await getEmployees();
            setEmployees(employeesData);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load employees.',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);
    
    const handleEmployeeSaved = (savedEmployee: Employee) => {
        const existingIndex = employees.findIndex(e => e.id === savedEmployee.id);
        if (existingIndex > -1) {
            const updatedEmployees = [...employees];
            updatedEmployees[existingIndex] = savedEmployee;
            setEmployees(updatedEmployees);
        } else {
            setEmployees([savedEmployee, ...employees]);
        }
    };

    const handleRowClick = (id: string) => {
        router.push(`/employees/${id}`);
    };
    
    const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
        if (!window.confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) return;
        setLoading(true);
        try {
            // This needs to be implemented in `lib/employees` if it's a real feature
            // await deleteEmployee(employeeId);
            setEmployees(employees.filter(c => c.id !== employeeId));
            toast({ title: "Employee Deleted", variant: "destructive", description: `${employeeName} has been deleted.`})
        } catch (error) {
            console.error("Failed to delete employee", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete employee.' });
        } finally {
            setLoading(false);
        }
    }
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'On Leave': return 'secondary';
            case 'Inactive': return 'destructive';
            default: return 'outline';
        }
    }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <EmployeeFormDialog onEmployeeSaved={handleEmployeeSaved} />
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>A list of all employees in the system.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="relative w-full overflow-auto">
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
                            {employees.length > 0 ? (
                                employees.map(employee => (
                                    <TableRow key={employee.id} className="group">
                                        <TableCell onClick={() => handleRowClick(employee.id)} className="cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person" />
                                                    <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium group-hover:underline">{employee.name}</div>
                                                    <div className="text-sm text-muted-foreground">{employee.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{employee.role}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(employee.status)}>{employee.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                  <span className="sr-only">Open menu</span>
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleRowClick(employee.id)}>View Profile</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <EmployeeFormDialog employee={employee} onEmployeeSaved={handleEmployeeSaved}>
                                                    <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </button>
                                                </EmployeeFormDialog>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteEmployee(employee.id, employee.name)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No employees found. Click "Add Employee" to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
