// src/app/payroll/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { automatePayroll, AutomatePayrollOutput } from '@/ai/flows/automate-payroll-calculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Banknote, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox';
import { getEmployeesWithWageData } from '@/lib/employees';
import type { Employee, OptionType, LaborRate } from '@/lib/types';


// This would be replaced with dynamic timesheet data from your database
const mockEmployeeTimesheets: { [key: string]: any[] } = {
  'EMP002': [
      { date: '2024-06-03', hours: 8, description: "Site inspection" }, // Monday
      { date: '2024-06-04', hours: 9, description: "Installations" }, // Tuesday (1hr OT)
      { date: '2024-06-05', hours: 8, description: "Client meeting" }, // Wednesday
      { date: '2024-06-06', hours: 11, description: "Emergency call-out" }, // Thursday (1hr OT, 2hr DT)
      { date: '2024-06-07', hours: 8, description: "Paperwork" }, // Friday
      { date: '2024-06-08', hours: 4, description: "Weekend maintenance" }, // Saturday
    ],
  'EMP003': [
      { date: '2024-06-03', hours: 7.5, description: "Cable running" },
      { date: '2024-06-04', hours: 7.5, description: "Termination" },
      { date: '2024-06-05', hours: 7.5, description: "Testing" },
      { date: '2024-06-06', hours: 7.5, description: "Client handover" },
      { date: '2024-06-07', hours: 8, description: "Stock take" },
    ],
};

const formSchema = z.object({
  employeeId: z.string().nonempty('Please select an employee.'),
  payrollPeriod: z.string().min(5, 'Payroll period is required.'),
  companyPolicies: z.string().min(10, 'Company policies are required.'),
  australianFairWorkStandards: z.string().min(10, 'Fair Work standards are required.'),
});

const mockFairWorkStandards = `The National Minimum Wage is currently $23.23 per hour or $882.80 per 38 hour week.
Super guarantee is currently 11% of an employee's ordinary time earnings. Overtime hours are generally not considered Ordinary Time Earnings.
Tax is calculated based on the ATO's tax tables.`;

// In a real app, this would be fetched from the settings database
const mockLaborRateRules: LaborRate = {
    employeeType: 'Technician',
    standardRate: 95.35,
    costRate: 49.57,
    overtimeRate: 143.03,
    overtimeAfterHours: 8,
    doubleTimeRate: 190.7,
    doubleTimeAfterHours: 10,
    saturdayFirstRate: 143.03,
    saturdayFirstHours: 3,
    saturdayAfterRate: 190.7,
    sundayRate: 190.7,
    publicHolidayRate: 238.38,
    afterHoursCalloutRate: 190.7
};


export default function PayrollPage() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [result, setResult] = useState<AutomatePayrollOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: '',
      payrollPeriod: `Start: ${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString()} - End: ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()}`,
      companyPolicies: 'Leave is accrued at 0.0769 hours per hour worked. Overtime is paid according to the configured labor rate rules.',
      australianFairWorkStandards: mockFairWorkStandards,
    },
  });
  
  useEffect(() => {
    async function fetchEmployees() {
        setLoading(true);
        try {
            const employeesData = await getEmployeesWithWageData();
            setEmployees(employeesData);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load employees.' });
        } finally {
            setLoading(false);
        }
    }
    fetchEmployees();
  }, [toast]);

  const selectedEmployeeId = form.watch('employeeId');
  
  const employeeOptions = useMemo((): OptionType[] => {
    return employees.map(e => ({ value: e.id, label: `${e.name} (${e.payType})` }));
  }, [employees]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);

    const selectedEmployee = employees.find(e => e.id === values.employeeId);
    if (!selectedEmployee) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected employee not found.' });
        setLoading(false);
        return;
    }

    try {
      const payrollInput: AutomatePayrollInput = {
        employee: {
          name: selectedEmployee.name,
          payType: selectedEmployee.payType!,
          wage: selectedEmployee.wage,
          annualSalary: selectedEmployee.annualSalary,
          tfn: selectedEmployee.tfn
        },
        timesheet: mockEmployeeTimesheets[selectedEmployee.id as keyof typeof mockEmployeeTimesheets] || [],
        laborRateRules: selectedEmployee.payType === 'Hourly' ? mockLaborRateRules : undefined,
        payrollPeriod: values.payrollPeriod,
        companyPolicies: values.companyPolicies,
        australianFairWorkStandards: values.australianFairWorkStandards,
      };

      const response = await automatePayroll(payrollInput);
      setResult(response);
    } catch (error) {
      console.error('Error running payroll:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to run payroll calculation. The AI may be busy or encountered an error.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Payroll</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Automated Payroll Calculator</CardTitle>
            <CardDescription>
              Select an employee to automatically load their timesheet data and calculate payroll based on defined business rules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Employee</FormLabel>
                      <Combobox
                        options={employeeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select an employee"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="payrollPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payroll Period</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 01/05/2024 - 31/05/2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyPolicies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Policies</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter relevant company policies for payroll" {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="australianFairWorkStandards"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Australian Fair Work Standards</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Paste relevant Fair Work standards..." {...field} rows={4} />
                      </FormControl>
                      <FormDescription>
                        Relevant standards are pre-filled for demonstration.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading || !selectedEmployeeId} className="w-full">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : 'Run Payroll Calculation'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
            {!result && !loading && (
                 <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
                    <Banknote className="h-16 w-16 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">Payroll results will appear here</p>
                    <p className="mt-1 text-sm text-muted-foreground">Select an employee and click "Run Payroll Calculation" to begin.</p>
                 </Card>
            )}
            {loading && (
                 <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    <p className="mt-4 text-lg font-semibold">Generating Payslip...</p>
                    <p className="mt-1 text-sm text-muted-foreground">The AI is performing the calculations. Please wait.</p>
                 </Card>
            )}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="text-primary" />
                    Payslip Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 rounded-lg border p-4">
                     <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Pay</span>
                      <span className="font-bold text-lg">${result.grossPay.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Deductions</span>
                      <span className="font-medium text-destructive">-${result.taxDeductions.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                      <span className="text-muted-foreground">Superannuation (SGC)</span>
                      <span className="font-medium">${result.superannuationContribution.toFixed(2)}</span>
                    </div>
                    <div className="border-t my-2"></div>
                     <div className="flex justify-between">
                      <span className="font-semibold">Net Pay</span>
                      <span className="font-bold text-xl text-primary">${result.netPay.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Card className="bg-secondary/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600"/>
                            Compliance Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{result.complianceNotes}</p>
                    </CardContent>
                  </Card>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Payslip Details</h4>
                    <pre className="text-xs p-4 rounded-md bg-muted whitespace-pre-wrap font-sans">{result.payslipDetails.summary}</pre>
                  </div>

                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
