
// src/app/settings/billing-rates/labour-rates.tsx
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Pencil, Trash2, DollarSign, Loader2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEmployeesWithWageData } from '@/lib/employees';
import { cn } from '@/lib/utils';
import type { Employee } from '@/lib/types';
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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';


const laborRateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Please select an employee role.'),
  isDefault: z.boolean(),
  // Standard Rates
  standardRate: z.coerce.number().min(0, 'Rate must be a positive number.'),
  costRate: z.coerce.number(),
  // Daily Overtime
  overtimeRate: z.coerce.number().min(0, 'Rate must be a positive number.'),
  overtimeAfterHours: z.coerce.number().min(0, 'Hours must be positive.').default(8),
  doubleTimeRate: z.coerce.number().min(0, 'Rate must be a positive number.'),
  doubleTimeAfterHours: z.coerce.number().min(0, 'Hours must be positive.').default(10),
  // Saturday Rates (Tiered)
  saturdayFirstRate: z.coerce.number().min(0, 'Rate must be a positive number.'),
  saturdayFirstHours: z.coerce.number().min(0, 'Hours must be positive.').default(2),
  saturdayAfterRate: z.coerce.number().min(0, 'Rate must be a positive number.'),
  // Special Rates
  sundayRate: z.coerce.number().min(0, 'Rate must be a positive number.'),
  publicHolidayRate: z.coerce.number().min(0, 'Rate must be a positive number.'),
  afterHoursCalloutRate: z.coerce.number().min(0, 'Rate must be a positive number.'),
});

type LaborRateFormValues = z.infer<typeof laborRateSchema>;

// This dialog could be broken out further if needed, but is fine here for now.
function LaborRateDialog({
  children,
  onSave,
  initialData,
}: {
  children: React.ReactNode;
  onSave: (data: LaborRateFormValues) => void;
  initialData?: LaborRateFormValues;
}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const { toast } = useToast();
    const isEditing = !!initialData;

    const getDefaultValues = (): LaborRateFormValues => ({
        id: `labour-${Date.now()}`,
        name: '',
        isDefault: false,
        standardRate: 0,
        costRate: 0,
        overtimeRate: 0,
        overtimeAfterHours: 8,
        doubleTimeRate: 0,
        doubleTimeAfterHours: 10,
        saturdayFirstRate: 0,
        saturdayFirstHours: 2,
        saturdayAfterRate: 0,
        sundayRate: 0,
        publicHolidayRate: 0,
        afterHoursCalloutRate: 0,
    });
    
    const form = useForm<LaborRateFormValues>({
        resolver: zodResolver(laborRateSchema),
        defaultValues: initialData || getDefaultValues(),
    });

    React.useEffect(() => {
        if (isOpen) {
            form.reset(initialData || getDefaultValues());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialData]);

    React.useEffect(() => {
        async function fetchEmps() {
            if (isOpen) {
                try {
                    const employeesData = await getEmployeesWithWageData();
                    setEmployees(employeesData);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not load employees for wage calculation.' });
                }
            }
        }
        fetchEmps();
    }, [isOpen, toast]);
    
    const employeeRoles = React.useMemo(() => {
        const roles = employees.map(e => e.role);
        return [...new Set(roles)]; // Get unique roles
    }, [employees]);

    const calculateCostRate = React.useCallback((roleName: string) => {
        if (!roleName || !employees.length) return 0;
        
        const relevantEmployees = employees.filter(e => e.role === roleName);
        const maxWage = relevantEmployees.length > 0 ? Math.max(...relevantEmployees.map(e => e.wage || 0)) : 0;
        
        if (maxWage === 0) return 0;

        const FULL_TIME_ANNUAL_HOURS = 1976; // 38 hours * 52 weeks
        const nonProductiveHours = (10 + 20) * 7.6; // 10 sick, 20 annual leave
        const productiveHours = FULL_TIME_ANNUAL_HOURS - nonProductiveHours;

        if (productiveHours <= 0) return 0;
        
        const annualCost = FULL_TIME_ANNUAL_HOURS * maxWage; 
        const actualCostRate = annualCost / productiveHours;
        
        return parseFloat(actualCostRate.toFixed(2));
    }, [employees]);

    React.useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'name' && value.name) {
                const costRate = calculateCostRate(value.name);
                form.setValue('costRate', costRate);
                
                // Auto-populate rates only if standard rate is not set, to avoid overriding manual entry
                if (form.getValues('standardRate') === 0) {
                    const standardRate = costRate > 0 ? costRate / (1 - 0.4) : 0; // Target 40% margin
                    form.setValue('standardRate', parseFloat(standardRate.toFixed(2)));
                }
            }
            if (name === 'standardRate') {
                const standardRate = parseFloat(value.standardRate?.toString() || '0');
                if (standardRate > 0) {
                     // Always update other rates based on the standard rate
                    form.setValue('overtimeRate', parseFloat((standardRate * 1.5).toFixed(2)));
                    form.setValue('doubleTimeRate', parseFloat((standardRate * 2).toFixed(2)));
                    form.setValue('saturdayFirstRate', parseFloat((standardRate * 1.5).toFixed(2)));
                    form.setValue('saturdayAfterRate', parseFloat((standardRate * 2).toFixed(2)));
                    form.setValue('sundayRate', parseFloat((standardRate * 2).toFixed(2)));
                    form.setValue('publicHolidayRate', parseFloat((standardRate * 2.5).toFixed(2)));
                    form.setValue('afterHoursCalloutRate', parseFloat((standardRate * 2).toFixed(2)));
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [form, calculateCostRate]);
    
    const onSubmit = (data: LaborRateFormValues) => {
        onSave(data);
        setIsOpen(false);
    };
    
    const watchedCostRate = form.watch('costRate');
    const watchedStandardRate = form.watch('standardRate');
    const standardMargin = watchedStandardRate > 0 ? ((watchedStandardRate - watchedCostRate) / watchedStandardRate) * 100 : 0;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Labour Rate' : 'Add New Labour Rate'}</DialogTitle>
                    <DialogDescription>Define a new labour type and its billable rates. The cost rate is estimated for you.</DialogDescription>
                </DialogHeader>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                         <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Labour Type (Employee Role)</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an employee role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {employeeRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Select a role to calculate its cost rate automatically.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="isDefault"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <FormLabel className="font-normal">Set as default labour type</FormLabel>
                                </FormItem>
                            )}
                        />
                        
                        <Separator className="my-4"/>
                        <h4 className="text-md font-medium">Daily Overtime Rules</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="standardRate" render={({ field }) => (
                                    <FormItem><FormLabel>Standard Rate</FormLabel><FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="number" step="0.01" className="pl-6" {...field} />
                                        </div>
                                    </FormControl><FormMessage /></FormItem>
                                )}/>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="overtimeRate" render={({ field }) => (
                                <FormItem><FormLabel>Time & 1/2 Rate</FormLabel><FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" step="0.01" className="pl-6" {...field} />
                                    </div>
                                </FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="overtimeAfterHours" render={({ field }) => (
                                <FormItem><FormLabel>Starts After (hours)</FormLabel><FormControl>
                                    <div className="relative">
                                        <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" step="0.1" className="pl-7" {...field} />
                                    </div>
                                </FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="doubleTimeRate" render={({ field }) => (
                                <FormItem><FormLabel>Double Time Rate</FormLabel><FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" step="0.01" className="pl-6" {...field} />
                                    </div>
                                </FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="doubleTimeAfterHours" render={({ field }) => (
                                <FormItem><FormLabel>Starts After (hours)</FormLabel><FormControl>
                                    <div className="relative">
                                        <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" step="0.1" className="pl-7" {...field} />
                                    </div>
                                </FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        
                        <Separator className="my-4"/>
                        <h4 className="text-md font-medium">Special &amp; Weekend Rates</h4>

                        <div className="space-y-2 p-3 border rounded-md bg-secondary/30">
                            <FormLabel>Saturday Tiered Rates</FormLabel>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <FormField control={form.control} name="saturdayFirstRate" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Initial Rate (e.g. 1.5x)</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="saturdayFirstHours" render={({ field }) => ( <FormItem><FormLabel className="text-xs">For the first (hours)</FormLabel><FormControl><div className="relative"><Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.5" className="pl-7" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="saturdayAfterRate" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Subsequent Rate (e.g. 2x)</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <FormField control={form.control} name="sundayRate" render={({ field }) => ( <FormItem><FormLabel>Sunday Rate</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="publicHolidayRate" render={({ field }) => ( <FormItem><FormLabel>Public Holiday Rate</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="afterHoursCalloutRate" render={({ field }) => ( <FormItem><FormLabel>After-Hours Callout</FormLabel><FormControl><div className="relative"><DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" step="0.01" className="pl-6" {...field} /></div></FormControl><FormDescription>Min 2 hours typically applied.</FormDescription><FormMessage /></FormItem> )}/>
                        </div>

                         <Card className="bg-secondary/30 mt-6">
                           <CardContent className="p-3">
                             <div className="flex items-center justify-between gap-6 text-sm">
                                <div className="text-left">
                                    <p className="text-muted-foreground">Estimated Cost Rate</p>
                                    <p className="font-bold text-base">${watchedCostRate.toFixed(2)}/hr</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground">Est. Standard Margin</p>
                                    <p className={cn("font-bold text-base", standardMargin < 20 ? 'text-destructive' : 'text-primary')}>{standardMargin.toFixed(1)}%</p>
                                </div>
                            </div>
                           </CardContent>
                         </Card>
                        <input type="hidden" {...form.register('costRate')} />
                        <DialogFooter className="pt-4 border-t">
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit">{isEditing ? 'Save Changes' : 'Add Labour Rate'}</Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}

export function LabourRates() {
    const { toast } = useToast();
    const [labourRates, setLabourRates] = React.useState<LaborRateFormValues[]>([]);
    const [loading, setLoading] = React.useState(true);

    const calculateCostRate = React.useCallback((roleName: string, employees: Employee[]) => {
        if (!roleName || !employees.length) return 0;
        
        const relevantEmployees = employees.filter(e => e.role === roleName && e.payType === 'Hourly');
        const maxWage = relevantEmployees.length > 0 ? Math.max(...relevantEmployees.map(e => e.wage || 0)) : 0;
        
        if (maxWage === 0) return 0;

        const FULL_TIME_ANNUAL_HOURS = 1976; // 38 hours * 52 weeks
        const nonProductiveHours = (10 + 20) * 7.6; // 10 sick, 20 annual leave
        const productiveHours = FULL_TIME_ANNUAL_HOURS - nonProductiveHours;

        if (productiveHours <= 0) return 0;
        
        const annualCost = FULL_TIME_ANNUAL_HOURS * maxWage; 
        const actualCostRate = annualCost / productiveHours;
        
        return parseFloat(actualCostRate.toFixed(2));
    }, []);

    React.useEffect(() => {
        async function fetchAndGenerateRates() {
            setLoading(true);
            try {
                const employees = await getEmployeesWithWageData();
                const uniqueRoles = [...new Set(employees.map(e => e.role))];
                
                const generatedRates: LaborRateFormValues[] = uniqueRoles.map(role => {
                    const costRate = calculateCostRate(role, employees);
                    const standardRate = costRate > 0 ? costRate / (1 - 0.40) : 0; // Target 40% margin

                    return {
                        id: `role-${role.replace(/\s+/g, '-').toLowerCase()}`,
                        name: role,
                        isDefault: role === 'Technician', // Example default logic
                        costRate: costRate,
                        standardRate: parseFloat(standardRate.toFixed(2)),
                        overtimeRate: parseFloat((standardRate * 1.5).toFixed(2)),
                        overtimeAfterHours: 8,
                        doubleTimeRate: parseFloat((standardRate * 2).toFixed(2)),
                        doubleTimeAfterHours: 10,
                        saturdayFirstRate: parseFloat((standardRate * 1.5).toFixed(2)),
                        saturdayFirstHours: 2,
                        saturdayAfterRate: parseFloat((standardRate * 2).toFixed(2)),
                        sundayRate: parseFloat((standardRate * 2).toFixed(2)),
                        publicHolidayRate: parseFloat((standardRate * 2.5).toFixed(2)),
                        afterHoursCalloutRate: parseFloat((standardRate * 2).toFixed(2)),
                    };
                });

                setLabourRates(generatedRates);
            } catch (error) {
                console.error("Failed to generate labour rates:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load employee data to generate rates.' });
            } finally {
                setLoading(false);
            }
        }
        fetchAndGenerateRates();
    }, [toast, calculateCostRate]);


    const handleSave = (data: LaborRateFormValues) => {
        setLabourRates(prev => {
            const existingIndex = prev.findIndex(r => r.id === data.id);
            if (data.isDefault) {
                prev.forEach(r => r.isDefault = false);
            }
            if (existingIndex > -1) {
                const updatedRates = [...prev];
                updatedRates[existingIndex] = data;
                return updatedRates;
            }
            return [...prev, data];
        });
        toast({ title: 'Success', description: `Labour Rate "${data.name}" has been saved.`});
    };

    const handleDelete = (rateId: string) => {
        if (window.confirm("Are you sure you want to delete this labour rate?")) {
            setLabourRates(prev => prev.filter(r => r.id !== rateId));
            toast({ title: 'Rate Deleted', variant: 'destructive', description: `The labour rate has been deleted.`});
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Labour Rates</CardTitle>
                    <CardDescription>
                        Manage billable rates for different types of labour and overtime conditions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Labour Rates</CardTitle>
                    <CardDescription>
                        Manage billable rates for different types of labour and overtime conditions. These are auto-generated from your employee roles.
                    </CardDescription>
                </div>
                 <LaborRateDialog onSave={handleSave}>
                     <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Labour Rate
                    </Button>
                </LaborRateDialog>
            </CardHeader>
            <CardContent>
                 <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Labour Type</TableHead>
                                <TableHead className="text-right">Standard</TableHead>
                                <TableHead className="text-right">Saturday</TableHead>
                                <TableHead className="text-right">Sunday</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {labourRates.map(rate => (
                                <TableRow key={rate.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <span>{rate.name}</span>
                                            {rate.isDefault && <Badge>DEFAULT</Badge>}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Cost: ${rate.costRate.toFixed(2)}/hr
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">${rate.standardRate.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className='flex flex-col items-end'>
                                            <span>${rate.saturdayFirstRate.toFixed(2)} (first {rate.saturdayFirstHours}hrs)</span>
                                            <span className='text-muted-foreground'>${rate.saturdayAfterRate.toFixed(2)} after</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">${rate.sundayRate.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <LaborRateDialog initialData={rate} onSave={handleSave}>
                                                <Button variant="ghost" size="icon">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </LaborRateDialog>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(rate.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
        </Card>
    );
}
