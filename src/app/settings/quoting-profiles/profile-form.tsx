// src/app/settings/billing-profiles/profile-form.tsx
'use client';

import * as React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Percent, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getEmployeesWithWageData } from '@/lib/employees';
import { Employee, LaborRate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


function LaborRateDialog({
  children,
  onSave,
  initialData,
}: {
  children: React.ReactNode;
  onSave: (data: LaborRate) => void;
  initialData?: LaborRate;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { control, watch, setValue } = useFormContext(); // We get this from the main form
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const { toast } = useToast();
  
  // Local state for the dialog form
  const [role, setRole] = React.useState(initialData?.employeeType || "");
  const [sellRate, setSellRate] = React.useState(initialData?.standardRate || 0);

  // Hardcoded Australian employment standards
  const FULL_TIME_ANNUAL_HOURS = 1976; // 38 hours * 52 weeks
  const FULL_TIME_SICK_DAYS = 10;
  const FULL_TIME_HOLIDAY_DAYS = 20;

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

  const calculateCostRate = React.useCallback(() => {
    if (!role || !employees.length) return 0;
    
    const relevantEmployees = employees.filter(e => e.role === role);
    const maxWage = relevantEmployees.length > 0 
        ? Math.max(...relevantEmployees.map(e => e.wage || 0)) 
        : 0;
    
    if (maxWage === 0) return 0;

    const nonProductiveHours = (FULL_TIME_SICK_DAYS + FULL_TIME_HOLIDAY_DAYS) * 7.6; // 38/5 = 7.6
    const productiveHours = FULL_TIME_ANNUAL_HOURS - nonProductiveHours;

    if (productiveHours <= 0) return 0;
    
    const annualCost = FULL_TIME_ANNUAL_HOURS * maxWage; 
    const actualCostRate = annualCost / productiveHours;
    
    return parseFloat(actualCostRate.toFixed(2));
  }, [employees, role]);

  const costRate = React.useMemo(() => calculateCostRate(), [calculateCostRate]);
  const margin = sellRate > 0 ? ((sellRate - costRate) / sellRate) * 100 : 0;
  
  const handleSave = () => {
    if (role.length < 2) {
        toast({ variant: 'destructive', title: 'Invalid Role', description: 'Employee role must be at least 2 characters.'});
        return;
    }
     if (sellRate <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Rate', description: 'Billable rate must be a positive number.'});
        return;
    }

    onSave({
        employeeType: role,
        standardRate: sellRate,
        overtimeRate: sellRate * 1.5, // Automatic calculation
        calculatedCostRate: costRate,
    });
    setIsOpen(false);
    // Reset local state for next time
    setRole("");
    setSellRate(0);
  };
  
  const highestWageForRole = React.useMemo(() => {
    const relevantEmployees = employees.filter(e => e.role === role);
    return relevantEmployees.length > 0
        ? Math.max(...relevantEmployees.map(e => e.wage || 0))
        : 0;
  }, [employees, role]);
  
  const availableRoles = React.useMemo(() => {
    const allRoles = new Set(employees.map(e => e.role));
    return Array.from(allRoles);
  }, [employees]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Labor Rate' : 'Add New Labor Rate'}</DialogTitle>
          <DialogDescription>Define a new employee role and its billable rate. Cost rate is calculated automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <FormItem>
                <FormLabel>Employee Role</FormLabel>
                <Select onValueChange={setRole} value={role}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select or type a role..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Input className="mt-2" placeholder="Or type a new role name..." value={role} onChange={e => setRole(e.target.value)} />
            </FormItem>
            <FormItem>
                <FormLabel>Standard Billable Rate (Sell)</FormLabel>
                <FormControl><div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="Sell Rate" className="pl-6" value={sellRate} onChange={e => setSellRate(parseFloat(e.target.value) || 0)} />
                </div></FormControl>
            </FormItem>
             <Card className="bg-secondary/30">
               <CardHeader className="p-3">
                 <CardTitle className="text-base">Cost Rate Calculation</CardTitle>
                 <CardDescription className="text-xs">Based on standard Australian full-time employment (38hr week, 10 sick/20 annual leave days).</CardDescription>
               </CardHeader>
               <CardContent className="p-3 pt-0">
                 <div className="flex items-center justify-between gap-6 text-sm">
                    <div className="text-left">
                        <p className="text-muted-foreground">Highest Wage for Role</p>
                        <p className="font-bold text-base">${(highestWageForRole || 0).toFixed(2)}/hr</p>
                    </div>
                    <div className="text-right">
                        <p className="text-muted-foreground">Calculated Cost Rate</p>
                        <p className="font-bold text-base">${costRate.toFixed(2)}/hr</p>
                    </div>
                     <div className="text-right">
                        <p className="text-muted-foreground">Gross Margin</p>
                        <p className={cn("font-bold text-base", margin < 20 ? 'text-destructive' : 'text-primary')}>{margin.toFixed(1)}%</p>
                    </div>
                </div>
               </CardContent>
             </Card>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
          <Button type="button" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function LaborRatesManager() {
  const { control, formState: { errors } } = useFormContext();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "laborRates",
  });
  
  const laborErrors = errors.laborRates as any;

  const handleSave = (data: LaborRate, index?: number) => {
    if (typeof index === 'number') {
        update(index, data);
    } else {
        append(data);
    }
  }

  return (
     <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold leading-none tracking-tight">Labor Rates & Costs</h3>
          <p className="text-sm text-muted-foreground">Define billable rates and calculate true costs for each role.</p>
        </div>
        <LaborRateDialog onSave={(data) => handleSave(data)}>
            <Button type="button" variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> New Labor Type
            </Button>
        </LaborRateDialog>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => {
            const rate = field as LaborRate; // Cast for type safety
            const margin = rate.standardRate > 0 ? ((rate.standardRate - rate.calculatedCostRate) / rate.standardRate) * 100 : 0;
            return (
                <Card key={field.id} className="bg-background/50">
                    <CardContent className="p-3 flex items-center justify-between">
                       <div className="flex-1">
                          <p className="font-semibold">{rate.employeeType}</p>
                           <div className="flex items-center gap-4 text-xs text-muted-foreground">
                               <span>Sell: <span className="font-medium text-foreground">${rate.standardRate.toFixed(2)}/hr</span></span>
                               <span>Cost: <span className="font-medium text-foreground">${rate.calculatedCostRate.toFixed(2)}/hr</span></span>
                               <span>Margin: <span className={cn("font-medium", margin < 20 ? 'text-destructive' : 'text-primary')}>{margin.toFixed(1)}%</span></span>
                           </div>
                       </div>
                        <div className="flex items-center gap-1">
                             <LaborRateDialog onSave={(data) => handleSave(data, index)} initialData={rate}>
                                <Button type="button" variant="ghost" size="icon"><Pencil className="h-4 w-4"/></Button>
                            </LaborRateDialog>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )
        })}
      </div>
      {laborErrors && laborErrors.root && <FormMessage>{laborErrors.root.message}</FormMessage>}
    </div>
  );
}


function MaterialAndServiceRatesManager() {
  const { control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "materialAndServiceRates",
  });
  
  const materialErrors = errors.materialAndServiceRates as any;

  return (
     <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold leading-none tracking-tight">Material & Service Rates</h3>
          <p className="text-sm text-muted-foreground">Common parts, materials, or fixed-price services.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", cost: 0, unit: "each" })}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Rate
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="grid grid-cols-12 gap-2 flex-grow">
              <div className="col-span-12 sm:col-span-6">
                <FormField
                  control={control}
                  name={`materialAndServiceRates.${index}.description`}
                  render={({ field }) => (
                    <FormItem><FormLabel className="sr-only">Description</FormLabel><FormControl><Input placeholder="Item description" {...field} /></FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <FormField
                  control={control}
                  name={`materialAndServiceRates.${index}.cost`}
                  render={({ field }) => (
                    <FormItem><FormLabel className="sr-only">Cost</FormLabel><FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder="Cost" className="pl-6" {...field} />
                      </div>
                    </FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <FormField
                  control={control}
                  name={`materialAndServiceRates.${index}.unit`}
                  render={({ field }) => (
                    <FormItem><FormLabel className="sr-only">Unit</FormLabel><FormControl><Input placeholder="per hour, each" {...field} /></FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
       {materialErrors && materialErrors.root && <FormMessage>{materialErrors.root.message}</FormMessage>}
    </div>
  );
}


export function ProfileForm() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto p-1">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profile Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Electrical & General Contracting" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="A short description of what this profile is for."
                rows={2}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
                control={control}
                name="defaults.desiredMargin"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Target Margin</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="25" className="pl-8" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={control}
                name="defaults.callOutFee"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Call-out Fee</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="0" className="pl-8" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
       </div>
       
       <LaborRatesManager />
       <MaterialAndServiceRatesManager />

      <Separator />

      <FormField
        control={control}
        name="persona"
        render={({ field }) => (
          <FormItem>
            <FormLabel>AI Persona</FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g., You are an expert electrical estimator..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormDescription>
                Instruct the AI on the role it should take when generating the quote.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="instructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Instructions</FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g., Always include a 5% contingency for unforeseen issues on jobs estimated over $2000..."
                rows={4}
                {...field}
              />
            </FormControl>
             <FormDescription>
                Provide specific rules or defaults for the AI to follow.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
        <FormField
            control={control}
            name="terms"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Default Terms & Conditions</FormLabel>
                <FormControl>
                <Textarea
                    placeholder="e.g., 1. Payment is due within 14 days..."
                    rows={4}
                    {...field}
                />
                </FormControl>
                <FormDescription>
                    These terms will be pre-filled on new quotes using this profile.
                </FormDescription>
                <FormMessage />
            </FormItem>
            )}
        />
    </div>
  );
}
