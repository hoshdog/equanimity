// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Automates payroll calculations, tax deductions, and compliance with Australian Fair Work standards.
 *
 * - automatePayroll - A function that automates payroll calculations.
 * - AutomatePayrollInput - The input type for the automatePayroll function.
 * - AutomatePayrollOutput - The return type for the automatePayroll function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatePayrollInputSchema = z.object({
  employeeDetails: z.string().describe('Details of the employee, including hours worked, pay rate, and tax file number.'),
  payrollPeriod: z.string().describe('The start and end date for the payroll period.'),
  companyPolicies: z.string().describe('The company policies related to payroll, leave, and benefits.'),
  australianFairWorkStandards: z.string().describe('Relevant standards from the Australian Fair Work Ombudsman.'),
});
export type AutomatePayrollInput = z.infer<typeof AutomatePayrollInputSchema>;

const AutomatePayrollOutputSchema = z.object({
  grossPay: z.number().describe('The total pay before any deductions.'),
  taxDeductions: z.number().describe('The amount deducted for taxes.'),
  netPay: z.number().describe('The final pay after all deductions.'),
  superannuationContribution: z.number().describe('The amount contributed to superannuation.'),
  complianceNotes: z.string().describe('Any notes related to compliance with Fair Work standards.'),
  payslipDetails: z.string().describe('A detailed breakdown of the payslip information.'),
});
export type AutomatePayrollOutput = z.infer<typeof AutomatePayrollOutputSchema>;

export async function automatePayroll(input: AutomatePayrollInput): Promise<AutomatePayrollOutput> {
  return automatePayrollFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automatePayrollPrompt',
  input: {schema: AutomatePayrollInputSchema},
  output: {schema: AutomatePayrollOutputSchema},
  prompt: `You are an expert in Australian payroll and compliance. Calculate the payroll for an employee based on the provided details, considering Australian Fair Work standards.

Employee Details: {{{employeeDetails}}}
Payroll Period: {{{payrollPeriod}}}
Company Policies: {{{companyPolicies}}}
Australian Fair Work Standards: {{{australianFairWorkStandards}}}

Calculate the gross pay, tax deductions, net pay, and superannuation contributions.  Provide compliance notes and detailed payslip information.

Ensure all calculations adhere to the latest Australian Fair Work standards.`,
});

const automatePayrollFlow = ai.defineFlow(
  {
    name: 'automatePayrollFlow',
    inputSchema: AutomatePayrollInputSchema,
    outputSchema: AutomatePayrollOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
