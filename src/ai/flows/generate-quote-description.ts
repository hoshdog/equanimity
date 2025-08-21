'use server';
/**
 * @fileOverview An AI agent that rewrites and improves a quote description.
 *
 * - generateQuoteDescription - A function that suggests an improved description.
 * - GenerateQuoteDescriptionInput - The input type for the function.
 * - GenerateQuoteDescriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateQuoteDescriptionInputSchema = z.object({
  currentDescription: z.string().describe('The current text of the quote description.'),
  persona: z.string().describe('The AI persona to adopt when rewriting the quote.'),
  instructions: z.string().optional().describe('Special instructions for the AI to follow.'),
});
export type GenerateQuoteDescriptionInput = z.infer<typeof GenerateQuoteDescriptionInputSchema>;

const GenerateQuoteDescriptionOutputSchema = z.object({
  suggestedDescription: z.string().describe('The suggested, improved quote description.'),
});
export type GenerateQuoteDescriptionOutput = z.infer<typeof GenerateQuoteDescriptionOutputSchema>;

export async function generateQuoteDescription(input: GenerateQuoteDescriptionInput): Promise<GenerateQuoteDescriptionOutput> {
  return generateQuoteDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuoteDescriptionPrompt',
  input: { schema: GenerateQuoteDescriptionInputSchema },
  output: { schema: GenerateQuoteDescriptionOutputSchema },
  prompt: `{{persona}}

Your task is to review and improve the following quote description. Make it more professional, clear, and comprehensive.
If they are not already present, add sections for Scope of Work, Inclusions, and Exclusions using markdown headers (e.g., ### Scope of Work).

{{#if instructions}}
Follow these special instructions:
- {{{instructions}}}
{{/if}}

Current Description:
"""
{{{currentDescription}}}
"""

Now, provide the improved description.
`,
});

const generateQuoteDescriptionFlow = ai.defineFlow(
  {
    name: 'generateQuoteDescriptionFlow',
    inputSchema: GenerateQuoteDescriptionInputSchema,
    outputSchema: GenerateQuoteDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
