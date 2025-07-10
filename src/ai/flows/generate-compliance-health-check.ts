'use server';
/**
 * @fileOverview Generates an automated compliance health check for an Australian business.
 *
 * - generateComplianceHealthCheck - A function that generates the health check.
 * - ComplianceHealthCheckOutput - The return type for the generateComplianceHealthCheck function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ComplianceAreaSchema = z.object({
    areaName: z.string().describe("The name of the compliance area (e.g., 'Fair Work Act', 'Work Health and Safety (WHS)')."),
    summary: z.string().describe("A brief, high-level summary of what this compliance area covers."),
    checklistItems: z.array(z.string()).describe("A list of actionable checklist items a business should consider to ensure compliance in this area."),
});
export type ComplianceArea = z.infer<typeof ComplianceAreaSchema>;


const ComplianceHealthCheckOutputSchema = z.object({
  complianceAreas: z
    .array(ComplianceAreaSchema)
    .describe('A list of key compliance areas with their summaries and checklist items.'),
});
export type ComplianceHealthCheckOutput = z.infer<
  typeof ComplianceHealthCheckOutputSchema
>;

export async function generateComplianceHealthCheck(): Promise<ComplianceHealthCheckOutput> {
  return generateComplianceHealthCheckFlow();
}

const prompt = ai.definePrompt({
  name: 'generateComplianceHealthCheckPrompt',
  output: { schema: ComplianceHealthCheckOutputSchema },
  prompt: `You are an AI expert in Australian labor law and business compliance.
  
  Your task is to generate a high-level compliance health check for a small to medium-sized Australian business.

  Identify 3-5 of the most critical compliance areas that a typical Australian business must adhere to. These should include areas like the Fair Work Act, Work Health and Safety (WHS), Superannuation Guarantee, and National Employment Standards (NES).

  For each compliance area, provide:
  1. A brief, easy-to-understand summary of the area's importance.
  2. A checklist of 3-5 essential, actionable items that a business owner or HR manager should review to assess their compliance. These items should be phrased as questions or statements to check against.

  Example for a checklist item: "Ensure all employees have a written employment contract that complies with the NES."

  Structure the entire output as a single JSON object that conforms to the provided schema.
  `,
});

const generateComplianceHealthCheckFlow = ai.defineFlow(
  {
    name: 'generateComplianceHealthCheckFlow',
    outputSchema: ComplianceHealthCheckOutputSchema,
  },
  async () => {
    const { output } = await prompt();
    return output!;
  }
);
