// src/app/employees/employee-form-dialog.tsx
'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addEmployee } from '@/lib/employees';
import type { Employee } from '@/lib/types';

const employeeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  status: z.enum(['Active', 'On Leave', 'Inactive']),
  role: z.string().min(2, "Role is required."),
  employmentType: z.enum(['Full-time', 'Part-time', 'Casual']),
  wage: z.coerce.number().min(0, "Wage must be a positive number.").optional(),
  award: z.string().optional(),
  isOverhead: z.boolean().default(false),
  tfn: z.string().optional(),
  superannuation: z.object({
    fundName: z.string().optional(),
    memberNumber: z.string().optional(),
  }).optional(),
  leaveBalances: z.object({
    annual: z.coerce.number().min(0).default(0),
    sick: z.coerce.number().min(0).default(0),
    banked: z.coerce.number().min(0).default(0),
  }).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormDialogProps {
  employee?: Employee;
  onEmployeeSaved: (employee: Employee) => void;
}

export function EmployeeFormDialog({ employee, onEmployeeSaved }: EmployeeFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const isEditing = !!employee;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: isEditing ? employee : {
      name: '',
      email: '',
      status: 'Active',
      role: '',
      employmentType: 'Full-time',
      wage: 0,
      award: '',
      isOverhead: false,
      tfn: '',
      superannuation: { fundName: '', memberNumber: '' },
      leaveBalances: { annual: 0, sick: 0, banked: 0 },
    },
  });

  async function onSubmit(values: EmployeeFormValues) {
    setLoading(true);
    try {
      if (isEditing) {
        // Update logic here
        // await updateEmployee(employee.id, values);
        // onEmployeeSaved({ id: employee.id, ...values });
        toast({ title: 'Employee Updated' });
      } else {
        const newEmployeeId = await addEmployee(values);
        onEmployeeSaved({ id: newEmployeeId, ...values });
        toast({ title: 'Employee Created', description: `${values.name} has been added.` });
      }
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save employee:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save employee." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for ${employee.name}.` : 'Fill in the details for the new employee.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="personal">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
                <TabsTrigger value="leave">Leave</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="pt-4">
                <div className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </TabsContent>
              <TabsContent value="employment" className="pt-4">
                 <div className="space-y-4">
                    <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem><FormLabel>Role / Position</FormLabel><FormControl><Input placeholder="e.g., Lead Technician" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="employmentType" render={({ field }) => (
                        <FormItem><FormLabel>Employment Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Full-time">Full-time</SelectItem>
                              <SelectItem value="Part-time">Part-time</SelectItem>
                              <SelectItem value="Casual">Casual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="wage" render={({ field }) => (
                        <FormItem><FormLabel>Hourly Wage</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="award" render={({ field }) => (
                        <FormItem><FormLabel>Award (Optional)</FormLabel><FormControl><Input placeholder="e.g., Clerks Award 2020" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                 </div>
              </TabsContent>
               <TabsContent value="payroll" className="pt-4">
                 <div className="space-y-4">
                     <FormField control={form.control} name="tfn" render={({ field }) => (
                        <FormItem><FormLabel>Tax File Number (TFN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="isOverhead" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Overhead Cost</FormLabel>
                            <FormDescription>Enable if this employee's wages are considered a business overhead cost.</FormDescription>
                          </div>
                        </FormItem>
                     )} />
                    <div className="space-y-2 pt-2">
                        <FormLabel>Superannuation</FormLabel>
                        <div className="grid grid-cols-2 gap-4">
                           <FormField control={form.control} name="superannuation.fundName" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Fund Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="superannuation.memberNumber" render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Member No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>
                 </div>
              </TabsContent>
               <TabsContent value="leave" className="pt-4">
                 <div className="space-y-4">
                     <FormDescription>Enter the opening balances for the employee's leave entitlements (in hours).</FormDescription>
                    <FormField control={form.control} name="leaveBalances.annual" render={({ field }) => (
                        <FormItem><FormLabel>Annual Leave</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="leaveBalances.sick" render={({ field }) => (
                        <FormItem><FormLabel>Sick & Carer's Leave</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="leaveBalances.banked" render={({ field }) => (
                        <FormItem><FormLabel>Banked Hours (Time in Lieu)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                 </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditing ? 'Save Changes' : 'Create Employee'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
