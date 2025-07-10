'use server';
/**
 * @fileOverview A flow to automatically follow up with suppliers on purchase orders if no correspondence or receipt has been received by the due date.
 *
 * - automaticallyFollowUpPurchaseOrders - A function that initiates the follow-up process.
 * - FollowUpPurchaseOrderInput - The input type for the automaticallyFollowUpPurchaseOrders function.
 * - FollowUpPurchaseOrderOutput - The return type for the automaticallyFollowUpPurchaseOrders function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FollowUpPurchaseOrderInputSchema = z.object({
  purchaseOrderDetails: z.string().describe('Details of the purchase order, including supplier name, due date, items ordered, and contact information.'),
  lastCommunicationDate: z.string().optional().describe('The date of the last communication with the supplier regarding this purchase order. If no communication has occurred, leave blank.'),
  receiptReceived: z.boolean().describe('Whether a receipt for the purchase order has been received.'),
});
export type FollowUpPurchaseOrderInput = z.infer<typeof FollowUpPurchaseOrderInputSchema>;

const FollowUpPurchaseOrderOutputSchema = z.object({
  followUpAction: z.string().describe('The recommended action to take, such as sending a follow-up email or calling the supplier.'),
  followUpMessage: z.string().describe('The content of the follow-up message to send to the supplier.'),
});
export type FollowUpPurchaseOrderOutput = z.infer<typeof FollowUpPurchaseOrderOutputSchema>;

export async function automaticallyFollowUpPurchaseOrders(input: FollowUpPurchaseOrderInput): Promise<FollowUpPurchaseOrderOutput> {
  return automaticallyFollowUpPurchaseOrdersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'followUpPurchaseOrderPrompt',
  input: {schema: FollowUpPurchaseOrderInputSchema},
  output: {schema: FollowUpPurchaseOrderOutputSchema},
  prompt: `You are an AI assistant helping to manage purchase orders. 

  Based on the following purchase order details, last communication date, and receipt status, recommend a follow-up action and message to the supplier.

  Purchase Order Details: {{{purchaseOrderDetails}}}
  Last Communication Date: {{{lastCommunicationDate}}}
  Receipt Received: {{{receiptReceived}}}

  Consider the due date and the urgency of the order when recommending the follow-up action and message.

  If no communication has occurred and the due date is approaching, recommend sending a polite follow-up email.
  If the due date has passed, recommend calling the supplier to inquire about the order status.

  Format your response as a JSON object with 'followUpAction' and 'followUpMessage' fields.
  `,
});

const automaticallyFollowUpPurchaseOrdersFlow = ai.defineFlow(
  {
    name: 'automaticallyFollowUpPurchaseOrdersFlow',
    inputSchema: FollowUpPurchaseOrderInputSchema,
    outputSchema: FollowUpPurchaseOrderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
