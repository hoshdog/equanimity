'use server';
/**
 * @fileOverview An AI agent that suggests a full list of line items (parts and labor) for a quote.
 * It uses a user prompt and a pre-configured quoting profile.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema defines the expected shape of data passed to the AI prompt
const SuggestQuoteLineItemsInputSchema = z.object({
  userPrompt: z.string().describe('A detailed text prompt from the user describing the job requirements, scope, etc.'),
  quotingProfile: z
    .object({
      persona: z.string().optional(),
      defaults: z.object({ desiredMargin: z.number() }),
      instructions: z.string().optional(),
      laborRates: z.any(),
      materialAndServiceRates: z.any(),
    })
    .describe('The selected quotingProfile containing rules, rates, and persona.'),
});

// Output is a markdown-formatted string with line items
const SuggestQuoteLineItemsOutputSchema = z
  .string()
  .describe(
    'A formatted markdown text block containing the suggested line items, reasoning, and a disclaimer.'
  );

export type SuggestQuoteLineItemsInput = z.infer<
  typeof SuggestQuoteLineItemsInputSchema
>;
export type SuggestQuoteLineItemsOutput = z.infer<
  typeof SuggestQuoteLineItemsOutputSchema
>;

// Define the prompt with explicit schema fields
const prompt = ai.definePrompt({
  name: 'suggestQuoteLineItemsPrompt',
  input: { schema: SuggestQuoteLineItemsInputSchema },
  output: { schema: SuggestQuoteLineItemsOutputSchema },
  prompt: `{{#if quotingProfile.persona}}
{{quotingProfile.persona}}
{{else}}
You are an expert quote estimator for a services business.
{{/if}}

Your task is to analyze a job description and the provided business rates to create a comprehensive list of line items for a new quote.

**Job Information & User Prompt:**
"{{{userPrompt}}}"

**Quoting Profile Rules:**
- Desired Margin: {{quotingProfile.defaults.desiredMargin}}%
- Persona: {{quotingProfile.persona}}
- Special Instructions: {{quotingProfile.instructions}}

**Available Labor & Material Rates (from Profile):**
- Labor Rates: \`\`\`json
{{{json stringify=quotingProfile.laborRates}}}
\`\`\`
- Material/Service Rates: \`\`\`json
{{{json stringify=quotingProfile.materialAndServiceRates}}}
\`\`\`

**Instructions:**
1.  **Analyze all inputs**: Carefully read the user prompt. Adhere to the persona and special instructions from the quoting profile.
2.  **Identify Parts & Materials**: Based on the job description, determine the necessary parts and materials. Use your general knowledge for items not explicitly in the Material/Service Rates list, but prefer using the provided rates when applicable.
3.  **Estimate Labor**: Use the provided Labor Rates to determine the type and hours of labor required for the job.
4.  **Calculate Sell Price**: For each line item, calculate a sell price. The formula is: Sell Price = Cost / (1 - (Margin / 100)).
5.  **Format Output**: Provide your response as a markdown-formatted text block with three sections: "### Reasoning", "### Suggested Line Items", and "### Disclaimer".

Format the entire output as a single string.
`,
});

// Define the flow using the same schemas
export const suggestQuoteLineItemsFlow = ai.defineFlow(
  {
    name: 'suggestQuoteLineItemsFlow',
    inputSchema: SuggestQuoteLineItemsInputSchema,
    outputSchema: SuggestQuoteLineItemsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

// Exposed server function
export async function suggestQuoteLineItems(
  input: SuggestQuoteLineItemsInput
): Promise<SuggestQuoteLineItemsOutput> {
  return suggestQuoteLineItemsFlow(input);
}
