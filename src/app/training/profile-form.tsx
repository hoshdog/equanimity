// src/app/training/profile-form.tsx
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
import { DollarSign, Percent, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getEmployees } from '@/lib/employees';
import { Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


function LaborRatesManager() {
  const { control, formState: { errors }, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "laborRates",
  });
  
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const { toast } = useToast();

  // Standard Australian employment values for a full-time employee
  const FULL_TIME_ANNUAL_HOURS = 2080; // 40 hours * 52 weeks
  const FULL_TIME_SICK_DAYS = 10;
  const FULL_TIME_HOLIDAY_DAYS = 20;


  React.useEffect(() => {
    async function fetchEmps() {
        try {
            const employeesData = await getEmployees();
            setEmployees(employeesData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load employees for wage calculation.' });
        }
    }
    fetchEmps();
  }, [toast]);

  const watchedLaborRates = watch("laborRates");

  const calculateCostRate = React.useCallback((rate: any) => {
    const employeeType = rate.employeeType;
    if (!employeeType || !employees.length) return 0;
    
    // Find highest wage for this employee type (role)
    const relevantEmployees = employees.filter(e => e.role === employeeType);
    const maxWage = relevantEmployees.length > 0 
        ? Math.max(...relevantEmployees.map(e => e.wage || 0)) 
        : 0;
    
    if (maxWage === 0) return 0;

    // Use hardcoded full-time standards for calculation
    const nonProductiveHours = (FULL_TIME_SICK_DAYS + FULL_TIME_HOLIDAY_DAYS) * 8; // Assuming 8-hour days
    const productiveHours = FULL_TIME_ANNUAL_HOURS - nonProductiveHours;

    if (productiveHours <= 0) return 0;
    
    // Annual cost based on total hours * wage
    const annualCost = FULL_TIME_ANNUAL_HOURS * maxWage; 
    // Actual cost rate spread across productive hours
    const actualCostRate = annualCost / productiveHours;
    
    return parseFloat(actualCostRate.toFixed(2));
  }, [employees]);
  
  // Effect to update calculated cost rate when inputs change
  React.useEffect(() => {
    watchedLaborRates.forEach((rate: any, index: number) => {
        const newCostRate = calculateCostRate(rate);
        const currentCostRate = rate.calculatedCostRate;
        if (newCostRate !== currentCostRate) {
            setValue(`laborRates.${index}.calculatedCostRate`, newCostRate, { shouldValidate: true });
        }
    });
  }, [watchedLaborRates, calculateCostRate, setValue]);


  const laborErrors = errors.laborRates as any;

  return (
     <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold leading-none tracking-tight">Labor Rates & Costs</h3>
          <p className="text-sm text-muted-foreground">Define billable rates and calculate true costs for each role.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ 
            employeeType: "",
            standardRate: 0,
            overtimeRate: 0,
            calculatedCostRate: 0
        })}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Labor Type
        </Button>
      </div>
      <div className="space-y-4">
        {fields.map((field, index) => {
             const costRate = watchedLaborRates[index]?.calculatedCostRate || 0;
             const sellRate = watchedLaborRates[index]?.standardRate || 0;
             const margin = sellRate > 0 ? ((sellRate - costRate) / sellRate) * 100 : 0;

             return (
            <Card key={field.id} className="bg-background/50">
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-grow space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={control}
                                    name={`laborRates.${index}.employeeType`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Employee Role</FormLabel>
                                            <FormControl><Input placeholder="e.g., Lead Technician" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`laborRates.${index}.standardRate`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Standard Billable Rate (Sell)</FormLabel>
                                            <FormControl><div className="relative">
                                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" placeholder="Sell Rate" className="pl-6" {...field} />
                                            </div></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                           <Card className="bg-secondary/30">
                             <CardHeader className="p-3">
                               <CardTitle className="text-base">Cost Rate Calculation</CardTitle>
                               <CardDescription className="text-xs">Based on standard Australian full-time employment (38hr week, 10 sick/20 annual leave days).</CardDescription>
                             </CardHeader>
                             <CardContent className="p-3 pt-0">
                               <div className="flex items-center justify-between gap-6 text-sm">
                                  <div className="text-left">
                                      <p className="text-muted-foreground">Highest Wage for Role</p>
                                      <p className="font-bold text-base">${(employees.filter(e => e.role === watchedLaborRates[index]?.employeeType).reduce((max, e) => Math.max(max, e.wage || 0), 0) || 0).toFixed(2)}/hr</p>
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
                name="defaults.overheadRate"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Overhead Rate</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="15" className="pl-8" {...field} />
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
                placeholder="e.g., Always include a 5% contingency for unforeseen issues..."
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
    </div>
  );
}
