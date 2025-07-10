// src/app/payroll/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { automatePayroll, AutomatePayrollOutput } from '@/ai/flows/automate-payroll-calculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Banknote, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  employeeDetails: z.string().min(10, 'Employee details are required.'),
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
      employeeDetails: 'Employee: John Doe (TFN: 123 456 789)\nHours Worked: 40\nPay Rate: $30/hour\nAllowances: $100 for travel',
      payrollPeriod: `Start: ${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString()} - End: ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()}`,
      companyPolicies: 'Leave is accrued at 0.0769 hours per hour worked. Overtime is paid at 1.5x the normal rate for hours over 38 per week.',
      australianFairWorkStandards: mockFairWorkStandards,
    },
  });

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
              Enter the details below to automate payroll calculations, tax deductions, and compliance with Australian Fair Work standards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="employeeDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Details</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter employee details, hours, pay rate..." {...field} rows={4} />
                      </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full">
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
                    <p className="mt-1 text-sm text-muted-foreground">Fill out the form and click "Run Payroll Calculation" to begin.</p>
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
