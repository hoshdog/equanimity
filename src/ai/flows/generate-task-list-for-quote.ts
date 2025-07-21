'use server';
/**
 * @fileOverview An AI agent that generates a task list for a job based on a quote.
 *
 * - generateTaskListForQuote - A function that suggests a task list.
 * - GenerateTaskListForQuoteInput - The input type for the function.
 * - GenerateTaskListForQuoteOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuotingProfile } from '@/lib/quoting-profiles';
import { QuoteLineItem } from '@/lib/types';


const TaskSchema = z.object({
  title: z.string().describe('A concise title for the task.'),
  description: z.string().describe('A brief description of what the task involves.'),
});

export const GenerateTaskListForQuoteInputSchema = z.object({
  quoteDescription: z.string().optional().describe('The overall description of the quote.'),
  lineItems: z.array(z.any()).optional().describe('The line items (parts and labor) from the quote.'),
  notes: z.string().optional().describe('Any internal or client-facing notes.'),
  quotingProfile: z.any().optional().describe('The quoting profile containing AI persona and instructions.'),
});
export type GenerateTaskListForQuoteInput = z.infer<typeof GenerateTaskListForQuoteInputSchema>;

const GenerateTaskListForQuoteOutputSchema = z.object({
  tasks: z.array(TaskSchema).describe('The generated list of tasks to complete the job.'),
});
export type GenerateTaskListForQuoteOutput = z.infer<typeof GenerateTaskListForQuoteOutputSchema>;


export async function generateTaskListForQuote(input: GenerateTaskListForQuoteInput): Promise<GenerateTaskListForQuoteOutput> {
  return generateTaskListForQuoteFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateTaskListPrompt',
  input: { schema: GenerateTaskListForQuoteInputSchema },
  output: { schema: GenerateTaskListForQuoteOutputSchema },
  prompt: `You are an expert project manager and scheduler for a services business. 
  Your task is to analyze the details of a quote and generate a logical, step-by-step task list required to complete the job.
  Use the persona and instructions from the provided quoting profile to guide your response.

  **Quoting Profile:**
  Persona: {{{quotingProfile.persona}}}
  Instructions: {{{quotingProfile.instructions}}}

  **Quote Details:**

  **Overall Description:**
  {{{quoteDescription}}}

  **Line Items (Parts & Labor):**
  \`\`\`json
  {{{json stringify=lineItems}}}
  \`\`\`

  **Notes:**
  {{{notes}}}
  
  **Instructions:**
  1.  Review all the provided information to understand the full scope of work.
  2.  Break the job down into a series of actionable tasks.
  3.  Consider logical steps: preparation, installation, commissioning, and cleanup/handover.
  4.  For each task, provide a concise title and a brief description.
  5.  The tasks should be in a logical order for completion.
  6.  Do not include administrative tasks like "Send invoice". Focus on the physical work required.
  
  Generate the task list now.
`,
});

const generateTaskListForQuoteFlow = ai.defineFlow(
  {
    name: 'generateTaskListForQuoteFlow',
    inputSchema: GenerateTaskListForQuoteInputSchema,
    outputSchema: GenerateTaskListForQuoteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
