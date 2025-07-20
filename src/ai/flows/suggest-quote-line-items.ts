
'use server';
/**
 * @fileOverview An AI agent that suggests a full list of line items (parts and labor) for a quote.
 * It uses the project description, user prompt, uploaded documents (RFQs, plans), and previous quotes as context.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { QuotingProfile } from '@/lib/quoting-profiles';

// Input schema defines the expected shape of data passed to the AI prompt
const SuggestQuoteLineItemsInputSchema = z.object({
  userPrompt: z.string().describe('A detailed text prompt from the user describing the job requirements, scope, etc.'),
  uploadedDocuments: z
    .array(
      z.object({
        dataUri: z
          .string()
          .describe(
            "A document (plan, RFQ, etc.) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
          ),
        fileName: z.string(),
      })
    )
    .optional()
    .describe('An array of uploaded documents for context.'),
  previousQuotesContext: z
    .array(z.string())
    .optional()
    .describe('An array of strings, each containing JSON data for a previous, similar quote.'),
  partsCatalogue: z
    .array(
      z.object({
        partNumber: z.string(),
        description: z.string(),
        suppliers: z
          .array(
            z.object({
              supplier: z.string(),
              tradePrice: z.number(),
            })
          )
      })
    )
    .describe('The entire parts catalogue available for quoting.'),
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

// Define the prompt with explicit schema fields (hash will now be generated correctly)
const prompt = ai.definePrompt({
  name: 'suggestQuoteLineItemsPrompt',
  inputSchema: SuggestQuoteLineItemsInputSchema,
  outputSchema: SuggestQuoteLineItemsOutputSchema,
  prompt: `{{#if quotingProfile.persona}}
{{quotingProfile.persona}}
{{else}}
You are an expert quote estimator for a services business.
{{/if}}

Your task is to analyze a job description, reference documents, past quotes, and available parts/labor to create a comprehensive list of line items for a new quote.

**Job Information & User Prompt:**
"{{{userPrompt}}}"

**Reference Documents:**
{{#each uploadedDocuments}}
- Document: {{{this.fileName}}}
  {{media url=this.dataUri}}
{{/each}}

**Context from Similar Past Quotes:**
{{#each previousQuotesContext}}
- Past Quote:
  \`\`\`json
  {{{this}}}
  \`\`\`
{{/each}}

**Quoting Profile Rules:**
- Desired Margin: {{quotingProfile.defaults.desiredMargin}}%
- Persona: {{quotingProfile.persona}}
- Special Instructions: {{quotingProfile.instructions}}

**Available Parts & Labor Rates (from Profile):**
- Parts Catalogue: \`\`\`json
{{{json stringify=partsCatalogue}}}
\`\`\`
- Labor Rates: \`\`\`json
{{{json stringify=quotingProfile.laborRates}}}
\`\`\`
- Material/Service Rates: \`\`\`json
{{{json stringify=quotingProfile.materialAndServiceRates}}}
\`\`\`

**Instructions:**
1.  **Analyze all inputs**: Carefully read the user prompt and analyze the content of any uploaded documents. Use past quotes as reference. Adhere to persona and special instructions.
2.  **Identify Parts**: From the Parts Catalogue, identify all necessary parts and reasonable quantities using tradePrice.
3.  **Estimate Labor**: Use provided Labor Rates to determine type and hours of labor required.
4.  **Calculate Sell Price**: Sell Price = Cost / (1 - (Margin / 100)).
5.  **Format Output**: Provide markdown with sections: "### Reasoning", "### Suggested Line Items", and "### Disclaimer".

Format as a single string.
`,
});

// Define the flow using the same schemas
export const suggestQuoteLineItemsFlow = ai.defineFlow(
  {
    name: 'suggestQuoteLineItemsFlow',
    inputSchema: SuggestQuoteLineItemsInputSchema,
    outputSchema: SuggestQuoteLineItemsOutputSchema,
  },
  async (input: SuggestQuoteLineItemsInput) => {
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
