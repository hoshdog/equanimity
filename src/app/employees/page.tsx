// src/app/employees/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Loader2 } from "lucide-react";
import { getEmployees } from '@/lib/employees';
import type { Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchEmployees() {
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
        }
        fetchEmployees();
    }, [toast]);

    const handleRowClick = (id: string) => {
        console.log(`Navigate to employee ${id}`);
        // router.push(`/employees/${id}`);
    };
  
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
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map(employee => (
                            <TableRow key={employee.id} onClick={() => handleRowClick(employee.id)} className="cursor-pointer">
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    