// src/ai/flows/automate-payroll-calculations.ts
'use server';

/**
 * @fileOverview Automates payroll calculations, tax deductions, and compliance with Australian Fair Work standards using detailed labor rate rules.
 *
 * - automatePayroll - A function that automates payroll calculations.
 * - AutomatePayrollInput - The input type for the automatePayroll function.
 * - AutomatePayrollOutput - The return type for the automatePayroll function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TimesheetEntrySchema = z.object({
  date: z.string().describe("The date of the work in YYYY-MM-DD format."),
  hours: z.number().describe("The number of hours worked for this entry."),
  description: z.string().optional().describe("A description of the task performed."),
});

const LaborRateRuleSchema = z.object({
  standardRate: z.number(),
  overtimeRate: z.number(),
  overtimeAfterHours: z.number(),
  doubleTimeRate: z.number(),
  doubleTimeAfterHours: z.number(),
  saturdayFirstRate: z.number(),
  saturdayFirstHours: z.number(),
  saturdayAfterRate: z.number(),
  sundayRate: z.number(),
  publicHolidayRate: z.number(),
  afterHoursCalloutRate: z.number(),
});

const AutomatePayrollInputSchema = z.object({
  employee: z.object({
    name: z.string(),
    payType: z.enum(['Hourly', 'Salary']),
    wage: z.number().optional().describe("The hourly wage, required if payType is 'Hourly'."),
    annualSalary: z.number().optional().describe("The annual salary, required if payType is 'Salary'."),
    tfn: z.string().optional().describe("The employee's Tax File Number."),
  }),
  timesheet: z.array(TimesheetEntrySchema).describe("The employee's timesheet entries for the period."),
  laborRateRules: LaborRateRuleSchema.optional().describe("The detailed labor rate rules to apply. Required if payType is 'Hourly'."),
  payrollPeriod: z.string().describe('The start and end date for the payroll period.'),
  companyPolicies: z.string().describe('General company policies related to payroll, leave, and benefits.'),
  australianFairWorkStandards: z.string().describe('Relevant standards from the Australian Fair Work Ombudsman.'),
});
export type AutomatePayrollInput = z.infer<typeof AutomatePayrollInputSchema>;

const PayslipLineItemSchema = z.object({
    date: z.string(),
    description: z.string(),
    hours: z.number(),
    rate: z.number(),
    total: z.number(),
});

const AutomatePayrollOutputSchema = z.object({
  grossPay: z.number().describe('The total pay before any deductions.'),
  taxDeductions: z.number().describe('The amount deducted for taxes based on ATO tables.'),
  netPay: z.number().describe('The final pay after all deductions.'),
  superannuationContribution: z.number().describe('The amount contributed to superannuation (11% of Ordinary Time Earnings).'),
  complianceNotes: z.string().describe('Any notes related to compliance with Fair Work standards.'),
  payslipDetails: z.object({
    lineItems: z.array(PayslipLineItemSchema),
    summary: z.string().describe("A human-readable summary of the pay calculation.")
  }),
});
export type AutomatePayrollOutput = z.infer<typeof AutomatePayrollOutputSchema>;

export async function automatePayroll(input: AutomatePayrollInput): Promise<AutomatePayrollOutput> {
  return automatePayrollFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automatePayrollPrompt',
  input: {schema: AutomatePayrollInputSchema},
  output: {schema: AutomatePayrollOutputSchema},
  prompt: `You are an expert Australian payroll processor. Your task is to calculate an employee's pay based on their timesheet and a set of complex labor rate rules. You must adhere to Australian Fair Work and ATO standards.

**Employee Details:**
- Name: {{{employee.name}}}
- Pay Type: {{{employee.payType}}}
{{#if employee.wage}}- Hourly Wage: \${{{employee.wage}}}{{/if}}
{{#if employee.annualSalary}}- Annual Salary: \${{{employee.annualSalary}}}{{/if}}

**Payroll Period:** {{{payrollPeriod}}}

**Rules & Standards:**
- Company Policies: {{{companyPolicies}}}
- Fair Work Standards: {{{australianFairWorkStandards}}}

**Calculation Logic:**

1.  **Check Pay Type**:
    *   If the employee's pay type is **'Salary'**, their gross pay is their annual salary divided by the number of pay periods in a year (assume 52 weeks). Skip hourly calculations.
    *   If the employee's pay type is **'Hourly'**, proceed with the detailed calculation below.

2.  **Hourly Pay Calculation (if applicable)**:
    *   Use the provided **Labor Rate Rules** to determine the correct billable rate for every hour worked.
    *   For each timesheet entry, determine the day of the week (Monday, Saturday, etc.).
    *   Apply the daily overtime rules:
        *   Hours up to \`overtimeAfterHours\` are paid at the employee's base \`wage\`.
        *   Hours between \`overtimeAfterHours\` and \`doubleTimeAfterHours\` are paid at \`wage\` * (overtimeRate / standardRate).
        *   Hours exceeding \`doubleTimeAfterHours\` are paid at \`wage\` * (doubleTimeRate / standardRate).
    *   For weekend work, use the specific Saturday and Sunday rates. For Saturday, apply the tiered logic: the first \`saturdayFirstHours\` at the initial rate, and the rest at the subsequent rate.
    *   Generate a line item in \`payslipDetails.lineItems\` for each distinct pay rate applied on a given day (e.g., standard hours, overtime hours).
    *   Sum up all line item totals to get the \`grossPay\`.

3.  **Deductions & Superannuation**:
    *   Calculate \`taxDeductions\` from the gross pay based on standard ATO tax tables.
    *   Calculate \`superannuationContribution\` as 11% of Ordinary Time Earnings (OTE). OTE typically excludes overtime, so calculate super only on standard hours.
    *   Calculate \`netPay\` as \`grossPay\` - \`taxDeductions\`.

4.  **Output**:
    *   Populate all fields in the output schema.
    *   Provide a clear, human-readable summary in \`payslipDetails.summary\`.
    *   Provide compliance notes regarding minimum wage, super, etc.

**Input Data:**

*   **Timesheet**: \`\`\`json
    {{{json stringify=timesheet}}}
    \`\`\`
*   **Labor Rate Rules**: \`\`\`json
    {{{json stringify=laborRateRules}}}
    \`\`\`

Perform the calculation now.
`,
});

const automatePayrollFlow = ai.defineFlow(
  {
    name: 'automatePayrollFlow',
    inputSchema: AutomatePayrollInputSchema,
    outputSchema: AutomatePayrollOutputSchema,
  },
  async input => {
    if (input.employee.payType === 'Hourly' && !input.laborRateRules) {
        throw new Error("Labor rate rules are required for hourly employees.");
    }
    const {output} = await prompt(input);
    return output!;
  }
);
