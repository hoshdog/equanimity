// src/app/employees/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Briefcase, Banknote, Shield, Heart, Umbrella, Sun, Clock, Home, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEmployee } from '@/lib/employees';
import type { Employee } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { EmployeeFormDialog } from '../employee-form-dialog';


export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function fetchEmployee() {
            setLoading(true);
            try {
                const employeeData = await getEmployee(id);
                if (employeeData) {
                    setEmployee(employeeData);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Employee not found.' });
                    router.push('/employees');
                }
            } catch (error) {
                console.error("Failed to fetch employee:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load employee details.' });
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchEmployee();
        }
    }, [id, toast, router]);
    
    const handleEmployeeSaved = (savedEmployee: Employee) => {
        setEmployee(savedEmployee);
    }

    if (loading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!employee) {
        return (
             <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">Employee Not Found</h2>
                <Button asChild>
                    <Link href="/employees"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Employees</Link>
                </Button>
            </div>
        );
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
            <div className="flex items-center justify-between">
                <div className="flex items-start md:items-center space-x-4 mb-4">
                    <Button asChild variant="outline" size="icon" className="shrink-0">
                        <Link href="/employees">
                            <ArrowLeft className="h-4 w-4"/>
                            <span className="sr-only">Back to Employees</span>
                        </Link>
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="person" />
                            <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{employee.name}</h2>
                            <p className="text-muted-foreground">{employee.role}</p>
                        </div>
                    </div>
                </div>
                 <EmployeeFormDialog employee={employee} onEmployeeSaved={handleEmployeeSaved}>
                    <Button variant="outline">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Details
                    </Button>
                </EmployeeFormDialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Personal Details</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong>Email:</strong> {employee.email}</p>
                             <div className="flex items-center justify-between">
                                <strong>Status:</strong>
                                <Badge variant={getStatusVariant(employee.status)}>{employee.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Employment Details</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong>Role:</strong> {employee.role}</p>
                            <p><strong>Type:</strong> {employee.employmentType}</p>
                            <p><strong>Award:</strong> {employee.award || 'Not specified'}</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /> Payroll & Tax</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <p><strong>Hourly Wage:</strong> ${employee.wage?.toFixed(2) || 'N/A'}</p>
                                <p><strong>TFN:</strong> {employee.tfn || 'Not provided'}</p>
                            </div>
                             <div className="space-y-2">
                                {employee.superannuation && (
                                    <>
                                        <p><strong>Super Fund:</strong> {employee.superannuation.fundName}</p>
                                        <p><strong>Member No:</strong> {employee.superannuation.memberNumber}</p>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Leave Balances</CardTitle></CardHeader>
                         <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <Card className="p-4">
                                <CardTitle className="flex flex-col items-center gap-2"><Sun className="h-6 w-6 text-yellow-500"/>Annual Leave</CardTitle>
                                <p className="text-3xl font-bold mt-2">{employee.leaveBalances?.annual.toFixed(1) || '0.0'}<span className="text-sm"> hrs</span></p>
                            </Card>
                             <Card className="p-4">
                                <CardTitle className="flex flex-col items-center gap-2"><Umbrella className="h-6 w-6 text-blue-500"/>Sick Leave</CardTitle>
                                <p className="text-3xl font-bold mt-2">{employee.leaveBalances?.sick.toFixed(1) || '0.0'}<span className="text-sm"> hrs</span></p>
                            </Card>
                             <Card className="p-4">
                                <CardTitle className="flex flex-col items-center gap-2"><Clock className="h-6 w-6 text-green-500"/>Banked Hours</CardTitle>
                                <p className="text-3xl font-bold mt-2">{employee.leaveBalances?.banked.toFixed(1) || '0.0'}<span className="text-sm"> hrs</span></p>
                            </Card>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
