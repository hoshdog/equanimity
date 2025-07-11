
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';

const mockEmployees = {
  'EMP001': {
    details: 'Employee: Alice Johnson (TFN: 111 222 333)\nPay Rate: $35/hour\nAllowances: $50 for tools',
    timesheet: JSON.stringify([
      { date: '2024-05-20', hours: 8 },
      { date: '2024-05-21', hours: 8 },
      { date: '2024-05-22', hours: 9, overtime: 1 },
      { date: '2024-05-23', hours: 8 },
      { date: '2024-05-24', hours: 7 },
    ], null, 2),
  },
  'EMP002': {
    details: 'Employee: Bob Smith (TFN: 444 555 666)\nPay Rate: $45/hour',
    timesheet: JSON.stringify([
      { date: '2024-05-20', hours: 8 },
      { date: '2024-05-21', hours: 8 },
      { date: '2024-05-22', hours: 8 },
      { date: '2024-05-23', hours: 10, overtime: 2 },
      { date: '2024-05-24', hours: 8 },
    ], null, 2),
  },
    'EMP003': {
    details: 'Employee: Charlie Brown (TFN: 777 888 999)\nPay Rate: $28/hour',
    timesheet: JSON.stringify([
      { date: '2024-05-20', hours: 7.5 },
      { date: '2024-05-21', hours: 7.5 },
      { date: '2024-05-22', hours: 7.5 },
      { date: '2024-05-23', hours: 7.5 },
      { date: '2024-05-24', hours: 8, overtime: 0.5 },
    ], null, 2),
  },
};

const employeeList = [
    { value: 'EMP001', label: 'Alice Johnson' },
    { value: 'EMP002', label: 'Bob Smith' },
    { value: 'EMP003', label: 'Charlie Brown' },
];


const formSchema = z.object({
  employeeId: z.string().nonempty('Please select an employee.'),
  employeeDetails: z.string().min(10, 'Employee details are required.'),
  timesheetData: z.string().min(10, 'Timesheet data is required.'),
  payrollPeriod: z.string().min(5, 'Payroll period is required.'),
  companyPolicies: z.string().min(10, 'Company policies are required.'),
  australianFairWorkStandards: z.string().min(10, 'Fair Work standards are required.'),
});

const mockFairWorkStandards = `The National Minimum Wage is currently $23.23 per hour or $882.80 per 38 hour week.
Super guarantee is currently 11% of an employee's ordinary time earnings.
Tax is calculated based on the ATO's tax tables.`;

export default function PayrollPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AutomatePayrollOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: '',
      employeeDetails: '',
      timesheetData: '',
      payrollPeriod: `Start: ${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString()} - End: ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()}`,
      companyPolicies: 'Leave is accrued at 0.0769 hours per hour worked. Overtime is paid at 1.5x the normal rate for hours over 38 per week.',
      australianFairWorkStandards: mockFairWorkStandards,
    },
  });

  const selectedEmployeeId = form.watch('employeeId');
  
  const employeeOptions = useMemo(() => {
    // In a real app, this would be fetched from an API
    return employeeList;
  }, []);

  useEffect(() => {
    if (selectedEmployeeId && mockEmployees[selectedEmployeeId as keyof typeof mockEmployees]) {
        const employeeData = mockEmployees[selectedEmployeeId as keyof typeof mockEmployees];
        form.setValue('employeeDetails', employeeData.details);
        form.setValue('timesheetData', employeeData.timesheet);
    } else {
        form.setValue('employeeDetails', '');
        form.setValue('timesheetData', '');
    }
  }, [selectedEmployeeId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const response = await automatePayroll(values);
      setResult(response);
    } catch (error) {
      console.error('Error running payroll:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to run payroll calculation. Please try again.',
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
              Select an employee to automatically load their timesheet data and calculate payroll.
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
                 {/* Hidden fields for data passed to the flow */}
                <input type="hidden" {...form.register("employeeDetails")} />
                <input type="hidden" {...form.register("timesheetData")} />

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
                    <pre className="text-xs p-4 rounded-md bg-muted whitespace-pre-wrap font-sans">{result.payslipDetails}</pre>
                  </div>

                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
