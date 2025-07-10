'use server';
/**
 * @fileOverview Extracts parts from a supplier list and identifies potential matches.
 *
 * - extractPartsFromSupplierList - A function that handles the part extraction and matching process.
 * - ExtractPartsFromSupplierListInput - The input type for the extractPartsFromSupplierList function.
 * - ExtractPartsFromSupplierListOutput - The return type for the extractPartsFromSupplierList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractPartsFromSupplierListInputSchema = z.object({
  excelDataUri: z
    .string()
    .describe(
      "An Excel file containing a supplier parts list, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractPartsFromSupplierListInput = z.infer<typeof ExtractPartsFromSupplierListInputSchema>;

const PartMatchSchema = z.object({
  supplierPartNumber: z.string().describe('The part number from the supplier.'),
  potentialMatches: z.array(
    z.object({
      existingPartNumber: z.string().describe('The part number of the existing part.'),
      matchScore: z.number().describe('A score indicating the likelihood of a match (0-1).'),
      price: z.number().optional().describe('The price of the part from the supplier, if available.'),
    })
  ).describe('Potential matches for the supplier part in the existing database.'),
});

const ExtractPartsFromSupplierListOutputSchema = z.object({
  matchedParts: z.array(PartMatchSchema).describe('A list of parts extracted from the supplier list with potential matches.'),
});
export type ExtractPartsFromSupplierListOutput = z.infer<typeof ExtractPartsFromSupplierListOutputSchema>;

export async function extractPartsFromSupplierList(input: ExtractPartsFromSupplierListInput): Promise<ExtractPartsFromSupplierListOutput> {
  return extractPartsFromSupplierListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPartsFromSupplierListPrompt',
  input: {schema: ExtractPartsFromSupplierListInputSchema},
  output: {schema: ExtractPartsFromSupplierListOutputSchema},
  prompt: `You are an AI assistant tasked with extracting parts from a supplier's parts list and identifying potential matches in an existing database.

You will receive an Excel file data URI containing the parts list.

Extract the part numbers and any available pricing information from the Excel file. For each part, identify potential matches in the existing database based on part number similarity and description.

Provide a match score (0-1) indicating the likelihood of a match.  A score of 1 indicates a perfect match, while 0 indicates no match.

Ensure that your output is a JSON array of objects, where each object represents a part from the supplier list and its potential matches.

Here's the supplier parts list data:
{{media url=excelDataUri}}
`,
});

const extractPartsFromSupplierListFlow = ai.defineFlow(
  {
    name: 'extractPartsFromSupplierListFlow',
    inputSchema: ExtractPartsFromSupplierListInputSchema,
    outputSchema: ExtractPartsFromSupplierListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
