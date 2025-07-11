// src/ai/flows/generate-quote-from-prompt.ts
'use server';
/**
 * @fileOverview Generates a detailed quote based on a user-provided prompt, calculating costs, applying markup, and formatting the output.
 *
 * - generateQuoteFromPrompt - A function that generates a quote from a prompt.
 * - GenerateQuoteFromPromptInput - The input type for the generateQuoteFromPrompt function.
 * - GenerateQuoteFromPromptOutput - The return type for the generateQuoteFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuoteFromPromptInputSchema = z.object({
  prompt: z
    .string()
    .describe('A prompt describing the job for which to generate a quote.'),
  desiredMargin: z
    .number()
    .min(0)
    .max(100)
    .describe('The desired profit margin percentage (e.g., 25 for 25%).'),
  overheadRate: z
    .number()
    .min(0)
    .describe(
      'The overhead rate as a percentage of the parts and labor cost (e.g., 15 for 15%).'
    ),
  callOutFee: z.coerce.number().min(0).optional().describe('A fixed call-out fee to be applied if the job is determined to be a small service call.'),
  laborRates: z.array(z.object({
    employeeType: z.string(),
    standardRate: z.number(),
    overtimeRate: z.number(),
  })).optional().describe('A structured list of standard labor rates for different employee types.'),
  materialAndServiceRates: z.array(z.object({
    description: z.string(),
    cost: z.number(),
    unit: z.string(),
  })).optional().describe('A structured list of standard material and service costs.'),
  persona: z.string().optional().describe('The AI persona to adopt when generating the quote.'),
  instructions: z.string().optional().describe('Special instructions for the AI to follow.'),
});
export type GenerateQuoteFromPromptInput = z.infer<
  typeof GenerateQuoteFromPromptInputSchema
>;

const LineItemSchema = z.object({
  description: z
    .string()
    .describe('Description of the line item (e.g., part name or labor type).'),
  quantity: z.number().describe('Quantity of the item or hours of labor.'),
  unitCost: z.number().describe('Cost per unit or per hour.'),
  totalCost: z
    .number()
    .describe('Total cost for this line item (quantity * unitCost).'),
});

const GenerateQuoteFromPromptOutputSchema = z.object({
  lineItems: z
    .array(LineItemSchema)
    .describe('A detailed list of all parts and labor costs.'),
  subtotal: z
    .number()
    .describe('The total cost of all line items before markup and tax.'),
  markupAmount: z
    .number()
    .describe('The total markup amount added to the subtotal.'),
  overheads: z.number().describe('Calculated overhead costs.'),
  totalBeforeTax: z
    .number()
    .describe('The subtotal plus markup and overheads.'),
  taxAmount: z
    .number()
    .describe('The amount of GST (Goods and Services Tax) calculated at 10%.'),
  totalAmount: z.number().describe('The final quote total, including all costs, markup, and tax.'),
  quoteText: z
    .string()
    .describe('The fully formatted, customer-facing quote text.'),
});
export type GenerateQuoteFromPromptOutput = z.infer<
  typeof GenerateQuoteFromPromptOutputSchema
>;

export async function generateQuoteFromPrompt(
  input: GenerateQuoteFromPromptInput
): Promise<GenerateQuoteFromPromptOutput> {
  return generateQuoteFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuoteFromPromptPrompt',
  input: {schema: GenerateQuoteFromPromptInputSchema},
  output: {schema: GenerateQuoteFromPromptOutputSchema},
  prompt: `{{#if persona}}
{{persona}}
{{else}}
You are an expert quoting assistant for a services business.
{{/if}}
Your task is to generate a detailed and professional quote based on a job description. You must calculate all costs, apply overheads, and add a markup to achieve a desired profit margin.

Job Description:
"{{{prompt}}}"

Business Rules:
- Desired Profit Margin: {{{desiredMargin}}}%
- Overhead Rate: {{{overheadRate}}}% of total parts and labor cost.
- GST (Goods and Services Tax): 10% on the final price before tax.
{{#if callOutFee}}
- Call-out Fee: \${{{callOutFee}}}. Apply this if the job appears to be a small service call. If you apply it, ensure it's a line item.
{{/if}}

{{#if laborRates}}
- Use the following labor rates for costing. You must select the most appropriate labor type based on the job description (e.g., a simple task might use a 'Technician', while a complex one might need a 'Lead Technician').
  """
  {{#each laborRates}}
  - {{this.employeeType}}: \${{this.standardRate}} per hour (Standard), \${{this.overtimeRate}} per hour (Overtime)
  {{/each}}
  """
{{/if}}

{{#if materialAndServiceRates}}
- Use the following business-specific standards for material and service costs:
  """
  {{#each materialAndServiceRates}}
  - {{this.description}}: \${{this.cost}} {{this.unit}}
  {{/each}}
  """
{{else}}
- Use reasonable, typical industry costs for parts and labor if not specified.
{{/if}}

{{#if instructions}}
Special Instructions to follow:
- {{{instructions}}}
{{/if}}

Calculation Steps:
1.  **Itemize Costs**: Break down the job description into individual line items for parts and labor. For each item, determine the description, quantity, and unit cost. Use the provided rates and costs where applicable. If the job seems like a small service call and a call-out fee is provided, include it as a line item.
2.  **Calculate Subtotal**: Sum the total costs of all line items. This is the subtotal.
3.  **Calculate Overheads**: Apply the overhead rate to the subtotal.
4.  **Calculate Total Cost**: Add the overheads to the subtotal. This is your total cost base.
5.  **Calculate Markup**: The desired margin is on the final selling price. The formula to find the selling price from a cost and a desired margin is: Selling Price = Total Cost / (1 - (Desired Margin / 100)). The markup amount is the Selling Price minus the Total Cost.
6.  **Calculate Total Before Tax**: This is the Total Cost plus the Markup Amount (or, the Selling Price).
7.  **Calculate GST**: Calculate 10% GST on the "Total Before Tax".
8.  **Calculate Final Total**: Add the GST to the "Total Before Tax".
9.  **Generate Formatted Quote**: Create a professional, customer-facing quote in markdown format. It should include the itemized list, subtotal, overheads, markup, GST, and the final total. Be clear and transparent.

Example Calculation:
- Subtotal (Parts + Labor) = $100
- Overheads (15%) = $15
- Total Cost = $115
- Desired Margin = 25%
- Selling Price (Total Before Tax) = $115 / (1 - 0.25) = $153.33
- Markup Amount = $153.33 - $115 = $38.33
- GST (10%) = $15.33
- Final Total = $153.33 + $15.33 = $168.66

Provide the final response in the specified JSON format.
`,
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
