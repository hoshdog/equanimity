// src/ai/flows/generate-quote-description.ts
'use server';
/**
 * @fileOverview An AI agent that generates a customer-facing quote description.
 * It uses the project description, user prompt, and uploaded documents (RFQs, plans).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { QuotingProfile } from '@/lib/quoting-profiles';


export const GenerateQuoteDescriptionInputSchema = z.object({
  userPrompt: z
    .string()
    .describe('A detailed text prompt from the user describing the job requirements, scope, etc.'),
  uploadedDocuments: z.array(
      z.object({
        dataUri: z.string().describe("A document (plan, RFQ, etc.) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
        fileName: z.string(),
      })
    ).optional().describe('An array of uploaded documents for context.'),
  quotingProfile: z.any().describe("The selected quoting profile containing rules, rates, and persona."),
});
export type GenerateQuoteDescriptionInput = z.infer<typeof GenerateQuoteDescriptionInputSchema>;


export const GenerateQuoteDescriptionOutputSchema = z.object({
  quoteDescription: z.string().describe('A well-written, customer-facing description of the work to be performed, including scope, inclusions, and exclusions.'),
});
export type GenerateQuoteDescriptionOutput = z.infer<typeof GenerateQuoteDescriptionOutputSchema>;


export async function generateQuoteDescription(
  input: GenerateQuoteDescriptionInput
): Promise<GenerateQuoteDescriptionOutput> {
  return generateQuoteDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuoteDescriptionPrompt',
  input: {schema: GenerateQuoteDescriptionInputSchema},
  output: {schema: GenerateQuoteDescriptionOutputSchema},
  prompt: `{{#if quotingProfile.persona}}
{{quotingProfile.persona}}
{{else}}
You are an expert quote estimator for a services business.
{{/if}}
Your task is to write a clear, professional, customer-facing quote description based on the provided information.

This description will be the main body of the quote, outlining the scope of work.

**Job Information & User Prompt:**
"{{{userPrompt}}}"

**Reference Documents:**
{{#each uploadedDocuments}}
- Document: {{{this.fileName}}}
  {{media url=this.dataUri}}
{{/each}}

**Quoting Profile Rules:**
- Persona: {{quotingProfile.persona}}
- Special Instructions: {{quotingProfile.instructions}}

**Instructions:**
1.  **Analyze all inputs**: Carefully read the user prompt and analyze the content of any uploaded documents.
2.  **Synthesize Information**: Combine the information to understand the full scope of the job.
3.  **Write the Description**: Write a comprehensive description for the quote. It should be clear, professional, and easy for the client to understand.
4.  **Structure**: Use paragraphs and bullet points for clarity. Start with a high-level summary, then detail the key inclusions. If appropriate, add a section for exclusions or assumptions.
5.  **Adhere to Persona**: Write in the tone and style defined by the quoting profile's persona and follow any special instructions.

Format the output as a single JSON object with the key 'quoteDescription'.
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
