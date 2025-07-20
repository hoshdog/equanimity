// src/ai/flows/suggest-parts-for-quote.ts
'use server';
/**
 * @fileOverview An AI agent that suggests parts for a quote based on a job description.
 *
 * - suggestPartsForQuote - A function that suggests parts for a quote.
 * - SuggestPartsForQuoteInput - The input type for the suggestPartsForQuote function.
 * - SuggestPartsForQuoteOutput - The return type for the suggestPartsForQuote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CataloguePartSchema = z.object({
  partNumber: z.string(),
  description: z.string(),
  suppliers: z.array(
    z.object({
      supplier: z.string(),
      tradePrice: z.number(),
      isDefault: z.boolean().optional(),
    })
  ),
});

const SuggestPartsForQuoteInputSchema = z.object({
  prompt: z
    .string()
    .describe('A detailed description of the job requirements.'),
  catalogue: z
    .array(CataloguePartSchema)
    .describe('The entire parts catalogue available for quoting.'),
});
export type SuggestPartsForQuoteInput = z.infer<
  typeof SuggestPartsForQuoteInputSchema
>;

const SuggestedPartSchema = z.object({
  partNumber: z
    .string()
    .describe(
      'The part number from the catalogue that is being suggested.'
    ),
  quantity: z.number().describe('The suggested quantity for this part.'),
});

const SuggestPartsForQuoteOutputSchema = z.object({
  suggestedParts: z
    .array(SuggestedPartSchema)
    .describe('A list of suggested parts with quantities.'),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of why these parts were chosen for the job.'
    ),
});
export type SuggestPartsForQuoteOutput = z.infer<
  typeof SuggestPartsForQuoteOutputSchema
>;

export async function suggestPartsForQuote(
  input: SuggestPartsForQuoteInput
): Promise<SuggestPartsForQuoteOutput> {
  return suggestPartsForQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPartsForQuotePrompt',
  input: { schema: SuggestPartsForQuoteInputSchema },
  output: { schema: SuggestPartsForQuoteOutputSchema },
  prompt: `You are an expert parts estimator for a services business. Your task is to analyze a job description and suggest the required parts and quantities from a provided catalogue.

**Job Description:**
"{{{prompt}}}"

**Parts Catalogue:**
\`\`\`json
{{{json stringify=catalogue}}}
\`\`\`

**Instructions:**
1.  Read the job description carefully to understand the scope of work.
2.  Review the provided parts catalogue.
3.  Identify the most relevant parts from the catalogue needed to complete the job.
4.  Estimate a reasonable quantity for each required part.
5.  Provide a brief reasoning for your selections.
6.  Format the output as a valid JSON object matching the defined schema, including `suggestedParts` and `reasoning`.

Only suggest parts that are present in the provided catalogue.
`,
});

const suggestPartsForQuoteFlow = ai.defineFlow(
  {
    name: 'suggestPartsForQuoteFlow',
    inputSchema: SuggestPartsForQuoteInputSchema,
    outputSchema: SuggestPartsForQuoteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
