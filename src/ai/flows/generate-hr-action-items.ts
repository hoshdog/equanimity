// src/ai/flows/generate-hr-action-items.ts
'use server';
/**
 * @fileOverview Generates a set of action items for the HR department based on new labor laws and regulations.
 *
 * - generateHrActionItems - A function that generates action items for HR compliance.
 * - GenerateHrActionItemsInput - The input type for the generateHrActionItems function.
 * - GenerateHrActionItemsOutput - The return type for the generateHrActionItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHrActionItemsInputSchema = z.object({
  topic: z
    .string()
    .describe(
      'A topic or query about Australian labor laws to research, e.g., "recent changes to Fair Work Act".'
    ),
});
export type GenerateHrActionItemsInput = z.infer<
  typeof GenerateHrActionItemsInputSchema
>;

const GenerateHrActionItemsOutputSchema = z.object({
  actionItems: z
    .array(z.string())
    .describe('A list of action items for the HR department.'),
  summary: z
    .string()
    .describe('A brief summary of the discovered regulations.'),
});
export type GenerateHrActionItemsOutput = z.infer<
  typeof GenerateHrActionItemsOutputSchema
>;

export async function generateHrActionItems(
  input: GenerateHrActionItemsInput
): Promise<GenerateHrActionItemsOutput> {
  return generateHrActionItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHrActionItemsPrompt',
  input: {schema: GenerateHrActionItemsInputSchema},
  output: {schema: GenerateHrActionItemsOutputSchema},
  prompt: `You are an AI expert in Australian labor law compliance. Your task is to research a given topic and generate a list of actionable items for an HR department.

  First, use your knowledge to research the web for the latest Australian labor laws and regulations related to the following topic:
  "{{topic}}"

  After your research, provide a brief summary of the key findings.

  Then, based on your findings, generate a clear, concise list of action items that an HR department should undertake to ensure compliance.

  Format the output as a JSON object with 'summary' and 'actionItems' fields.
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateHrActionItemsFlow = ai.defineFlow(
  {
    name: 'generateHrActionItemsFlow',
    inputSchema: GenerateHrActionItemsInputSchema,
    outputSchema: GenerateHrActionItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
