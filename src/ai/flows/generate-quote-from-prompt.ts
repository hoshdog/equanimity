// src/ai/flows/generate-quote-from-prompt.ts
'use server';
/**
 * @fileOverview Generates a quote based on a user-provided prompt.
 *
 * - generateQuoteFromPrompt - A function that generates a quote from a prompt.
 * - GenerateQuoteFromPromptInput - The input type for the generateQuoteFromPrompt function.
 * - GenerateQuoteFromPromptOutput - The return type for the generateQuoteFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuoteFromPromptInputSchema = z.object({
  prompt: z.string().describe('A prompt describing the job for which to generate a quote.'),
});
export type GenerateQuoteFromPromptInput = z.infer<typeof GenerateQuoteFromPromptInputSchema>;

const GenerateQuoteFromPromptOutputSchema = z.object({
  quote: z.string().describe('The generated quote based on the prompt.'),
});
export type GenerateQuoteFromPromptOutput = z.infer<typeof GenerateQuoteFromPromptOutputSchema>;

export async function generateQuoteFromPrompt(input: GenerateQuoteFromPromptInput): Promise<GenerateQuoteFromPromptOutput> {
  return generateQuoteFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuoteFromPromptPrompt',
  input: {schema: GenerateQuoteFromPromptInputSchema},
  output: {schema: GenerateQuoteFromPromptOutputSchema},
  prompt: `You are an expert quoting assistant.  You will be given a prompt describing a job, and you will generate a quote for that job.

Job Description: {{{prompt}}}`,
});

const generateQuoteFromPromptFlow = ai.defineFlow(
  {
    name: 'generateQuoteFromPromptFlow',
    inputSchema: GenerateQuoteFromPromptInputSchema,
    outputSchema: GenerateQuoteFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
