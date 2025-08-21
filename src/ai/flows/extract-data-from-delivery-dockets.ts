'use server';

/**
 * @fileOverview This flow extracts data from delivery dockets (photos or PDFs) using AI.
 *
 * - extractDataFromDeliveryDocket - A function that handles the data extraction process.
 * - ExtractDataFromDeliveryDocketInput - The input type for the extractDataFromDeliveryDocket function.
 * - ExtractDataFromDeliveryDocketOutput - The return type for the extractDataFromDeliveryDocket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDataFromDeliveryDocketInputSchema = z.object({
  deliveryDocketDataUri: z
    .string()
    .describe(
      "A photo or PDF of a delivery docket, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractDataFromDeliveryDocketInput = z.infer<typeof ExtractDataFromDeliveryDocketInputSchema>;

const ExtractDataFromDeliveryDocketOutputSchema = z.object({
  supplier: z.string().describe('The name of the supplier.'),
  poNumber: z.string().describe('The purchase order number.'),
  deliveryDate: z.string().describe('The date of delivery.'),
  items: z
    .array(
      z.object({
        description: z.string().describe('The description of the item.'),
        quantity: z.number().describe('The quantity of the item delivered.'),
        unit: z.string().describe('The unit of measurement for the item.'),
      })
    )
    .describe('A list of items delivered.'),
});
export type ExtractDataFromDeliveryDocketOutput = z.infer<typeof ExtractDataFromDeliveryDocketOutputSchema>;

export async function extractDataFromDeliveryDocket(
  input: ExtractDataFromDeliveryDocketInput
): Promise<ExtractDataFromDeliveryDocketOutput> {
  return extractDataFromDeliveryDocketFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDataFromDeliveryDocketPrompt',
  input: {schema: ExtractDataFromDeliveryDocketInputSchema},
  output: {schema: ExtractDataFromDeliveryDocketOutputSchema},
  prompt: `You are an expert data extraction specialist. Your task is to extract data from delivery dockets.

You will be provided with a delivery docket in the form of a photo or PDF. You need to extract the following information:
- Supplier name
- Purchase order number
- Delivery date
- List of items delivered (description, quantity, and unit)

Here is the delivery docket:

{{media url=deliveryDocketDataUri}}

Please provide the extracted data in JSON format as defined by the output schema.`,
});

const extractDataFromDeliveryDocketFlow = ai.defineFlow(
  {
    name: 'extractDataFromDeliveryDocketFlow',
    inputSchema: ExtractDataFromDeliveryDocketInputSchema,
    outputSchema: ExtractDataFromDeliveryDocketOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
