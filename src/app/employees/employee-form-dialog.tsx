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
import { PlusCircle, Loader2, Pencil, Trash2, DollarSign, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addEmployee, updateEmployee } from '@/lib/employees';
import type { Employee } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const employeeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  status: z.enum(['Active', 'On Leave', 'Inactive']),
  role: z.string().min(2, "Role is required."),
  employmentType: z.enum(['Full-time', 'Part-time', 'Casual']),
  payType: z.enum(['Hourly', 'Salary']).default('Hourly'),
  wage: z.coerce.number().min(0, "Wage must be a positive number.").optional(),
  annualSalary: z.coerce.number().min(0, "Salary must be a positive number.").optional(),
  calculatedCostRate: z.coerce.number().min(0).default(0),
  estimatedNonBillableHours: z.coerce.number().min(0).default(0),
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
}).refine(data => {
    if (data.payType === 'Hourly') return data.wage !== undefined && data.wage > 0;
    return true;
}, {
    message: 'Hourly wage is required.',
    path: ['wage'],
}).refine(data => {
    if (data.payType === 'Salary') return data.annualSalary !== undefined && data.annualSalary > 0;
    return true;
}, {
    message: 'Annual salary is required.',
    path: ['annualSalary'],
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormDialogProps {
  employee?: Employee;
  onEmployeeSaved: (employee: Employee) => void;
  children?: React.ReactNode;
}

function ManageRolesDialog({ open, onOpenChange, roles, onRolesChange }: { open: boolean, onOpenChange: (open: boolean) => void, roles: string[], onRolesChange: (roles: string[]) => void }) {
    const [newRole, setNewRole] = React.useState('');
    const { toast } = useToast();

    const handleAddRole = () => {
        if (newRole && !roles.includes(newRole)) {
            onRolesChange([...roles, newRole]);
            setNewRole('');
            toast({ title: 'Role Added', description: `"${newRole}" has been added.` });
        }
    };

    const handleDeleteRole = (roleToDelete: string) => {
        onRolesChange(roles.filter(role => role !== roleToDelete));
        toast({ title: 'Role Removed', description: `"${roleToDelete}" has been removed.`, variant: 'destructive' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Employee Roles</DialogTitle>
                    <DialogDescription>Add or remove roles from the dropdown list.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="New role name..." />
                        <Button onClick={handleAddRole}>Add Role</Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {roles.map(role => (
                            <div key={role} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                <span className="text-sm">{role}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteRole(role)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function EmployeeFormDialog({ employee, onEmployeeSaved, children }: EmployeeFormDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [employeeRoles, setEmployeeRoles] = React.useState([
      'Technician', 'Lead Technician', 'Apprentice', 'Project Manager', 'Office Administrator', 'Sales Manager', 'HR Specialist', 'IT Support', 'CEO'
  ]);
  const { toast } = useToast();
  const isEditing = !!employee;

  const defaultValues = {
      name: '',
      email: '',
      status: 'Active' as const,
      role: '',
      employmentType: 'Full-time' as const,
      payType: 'Hourly' as const,
      wage: 0,
      annualSalary: 0,
      calculatedCostRate: 0,
      estimatedNonBillableHours: 0,
      award: '',
      isOverhead: false,
      tfn: '',
      superannuation: { fundName: '', memberNumber: '' },
      leaveBalances: { annual: 0, sick: 0, banked: 0 },
  };

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    if (isOpen) {
      if (isEditing && employee) {
        // Ensure all fields have a defined value to prevent uncontrolled -> controlled error
        form.reset({
          ...defaultValues,
          ...employee,
          wage: employee.wage ?? 0,
          annualSalary: employee.annualSalary ?? 0,
          award: employee.award ?? '',
          tfn: employee.tfn ?? '',
          superannuation: {
            fundName: employee.superannuation?.fundName ?? '',
            memberNumber: employee.superannuation?.memberNumber ?? ''
          },
          leaveBalances: {
            annual: employee.leaveBalances?.annual ?? 0,
            sick: employee.leaveBalances?.sick ?? 0,
            banked: employee.leaveBalances?.banked ?? 0
          }
        });
      } else {
        form.reset(defaultValues);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditing, employee, form]);

  const watchedPayType = form.watch('payType');
  const watchedWage = form.watch('wage');
  const watchedAnnualSalary = form.watch('annualSalary');
  const watchedEmploymentType = form.watch('employmentType');
  const watchedEstimatedNonBillable = form.watch('estimatedNonBillableHours');

  // Cost rate calculation logic
  const calculatedCostRate = React.useMemo(() => {
    const payRate = parseFloat(String(watchedPayType === 'Hourly' ? (watchedWage || 0) : ((watchedAnnualSalary || 0) / (52 * 38))));
    if (isNaN(payRate) || payRate === 0) {
        return payRate;
    }

    // Add 12% for superannuation to the base pay rate
    const payRateWithSuper = payRate * 1.12;

    if (watchedEmploymentType === 'Casual') {
        return parseFloat(payRateWithSuper.toFixed(2));
    }

    const weeklyHours = watchedEmploymentType === 'Full-time' ? 38 : 19; // simplified for part-time
    const annualHours = weeklyHours * 52;
    
    // Calculate leave hours based on employment type
    const annualLeaveHours = 4 * weeklyHours; // 4 weeks
    const sickLeaveHours = 10 * (weeklyHours / 5); // 10 days at daily hours
    const leaveHours = annualLeaveHours + sickLeaveHours;

    // Calculate additional non-billable hours from weekly input
    const additionalWeeklyHours = parseFloat(String(watchedEstimatedNonBillable)) || 0;
    const additionalAnnualHours = additionalWeeklyHours * 52;

    const totalNonProductiveHours = leaveHours + additionalAnnualHours;
    
    const productiveHours = annualHours - totalNonProductiveHours;
    if (productiveHours <= 0) return parseFloat(payRateWithSuper.toFixed(2));

    // Total annual cost now includes superannuation
    const totalAnnualCost = annualHours * payRateWithSuper;
    const costRate = totalAnnualCost / productiveHours;
    
    return parseFloat(costRate.toFixed(2));
  }, [watchedPayType, watchedWage, watchedAnnualSalary, watchedEmploymentType, watchedEstimatedNonBillable]);
  
  const defaultNonProductiveHours = React.useMemo(() => {
    if (watchedEmploymentType === 'Casual') return { total: 0, leave: 0 };
    const weeklyHours = watchedEmploymentType === 'Full-time' ? 38 : 19;
    
    const leaveHours = (4 * weeklyHours) + (10 * (weeklyHours / 5)); // 4 weeks annual, 10 days sick
    
    const additionalWeeklyHours = parseFloat(String(watchedEstimatedNonBillable)) || 0;
    const additionalAnnualHours = additionalWeeklyHours * 52;

    return { total: leaveHours + additionalAnnualHours, leave: leaveHours };
  }, [watchedEmploymentType, watchedEstimatedNonBillable]);


  React.useEffect(() => {
      form.setValue('calculatedCostRate', calculatedCostRate);
  }, [calculatedCostRate, form]);

  async function onSubmit(values: EmployeeFormValues) {
    setLoading(true);
    try {
      if (isEditing && employee) {
        await updateEmployee(employee.id, values);
        onEmployeeSaved({ id: employee.id, ...values });
        toast({ title: 'Employee Updated', description: `${values.name}'s details have been updated.` });
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
        {children ? children : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => { if (isRolesDialogOpen) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for ${employee.name}.` : 'Fill in the details for the new employee.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="personal">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
                <TabsTrigger value="costing">Costing</TabsTrigger>
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
                        <FormItem><div className="flex items-center justify-between">
                            <FormLabel>Role / Position</FormLabel>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsRolesDialogOpen(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </div>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {employeeRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        <FormMessage /></FormItem>
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
                    <FormField
                      control={form.control}
                      name="payType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Pay Basis</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex items-center space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="Hourly" /></FormControl>
                                <FormLabel className="font-normal">Hourly</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="Salary" /></FormControl>
                                <FormLabel className="font-normal">Salary</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchedPayType === 'Hourly' && (
                        <FormField control={form.control} name="wage" render={({ field }) => (
                            <FormItem><FormLabel>Hourly Wage</FormLabel><FormControl><div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="number" step="0.01" className="pl-8" {...field} />
                            </div></FormControl><FormMessage /></FormItem>
                        )} />
                    )}
                    {watchedPayType === 'Salary' && (
                         <FormField control={form.control} name="annualSalary" render={({ field }) => (
                            <FormItem><FormLabel>Annual Salary</FormLabel><FormControl><div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="number" step="100" className="pl-8" placeholder="e.g., 85000" {...field} />
                            </div></FormControl><FormMessage /></FormItem>
                        )} />
                    )}
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
               <TabsContent value="costing" className="pt-4">
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><Calculator className="h-5 w-5 text-primary"/> True Cost Rate Calculator</h3>
                                <input type="hidden" {...form.register('calculatedCostRate')} />
                            </div>
                            <p className="text-sm text-muted-foreground">This calculates the employee's cost to the business per productive hour, factoring in non-billable time like leave. This figure is crucial for accurate job costing and quoting.</p>
                            
                             <FormField
                                control={form.control}
                                name="estimatedNonBillableHours"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Additional Weekly Non-Billable Hours</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 2 hours for meetings" {...field} />
                                    </FormControl>
                                     <FormDescription>
                                        Enter any regular non-billable time (e.g., meetings, training) not covered by statutory leave.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="rounded-md border p-3">
                                    <p className="text-sm font-medium text-muted-foreground">Pay Rate</p>
                                    <p className="text-2xl font-bold">${parseFloat(String(watchedPayType === 'Hourly' ? (watchedWage || 0) : ((watchedAnnualSalary || 0) / (52 * 38)))).toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">per hour</p>
                                </div>
                                <div className="rounded-md border p-3">
                                    <p className="text-sm font-medium text-muted-foreground">Total Non-Productive</p>
                                    <p className="text-2xl font-bold">
                                        {defaultNonProductiveHours.total.toFixed(0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">hours/year</p>
                                </div>
                                 <div className="rounded-md border bg-primary/10 border-primary p-3">
                                    <p className="text-sm font-medium text-primary">Calculated Cost Rate</p>
                                    <p className="text-2xl font-bold text-primary">${calculatedCostRate.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">per productive hour</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
        <ManageRolesDialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen} roles={employeeRoles} onRolesChange={setEmployeeRoles} />
      </DialogContent>
    </Dialog>
  );
}
