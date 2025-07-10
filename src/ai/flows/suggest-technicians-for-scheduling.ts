'use server';
/**
 * @fileOverview Suggests technicians for scheduling based on their previous performance on similar tasks.
 *
 * - suggestTechniciansForScheduling - A function that suggests technicians for scheduling.
 * - SuggestTechniciansForSchedulingInput - The input type for the suggestTechniciansForScheduling function.
 * - SuggestTechniciansForSchedulingOutput - The return type for the suggestTechniciansForScheduling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTechniciansForSchedulingInputSchema = z.object({
  taskDescription: z.string().describe('Description of the task to be scheduled.'),
  availableTechnicians: z.array(z.string()).describe('List of available technicians.'),
  pastTaskData: z.string().describe('JSON blob containing historical data of technicians and tasks'),
});
export type SuggestTechniciansForSchedulingInput = z.infer<
  typeof SuggestTechniciansForSchedulingInputSchema
>;

const SuggestTechniciansForSchedulingOutputSchema = z.object({
  suggestedTechnicians: z
    .array(z.string())
    .describe(
      'List of suggested technicians, ordered by suitability for the task, and taking into account previous performance on similar tasks.'
    ),
  reasoning: z
    .string()
    .describe(
      'Explanation of why the technicians were suggested, based on their previous performance on similar tasks.'
    ),
});

export type SuggestTechniciansForSchedulingOutput = z.infer<
  typeof SuggestTechniciansForSchedulingOutputSchema
>;

export async function suggestTechniciansForScheduling(
  input: SuggestTechniciansForSchedulingInput
): Promise<SuggestTechniciansForSchedulingOutput> {
  return suggestTechniciansForSchedulingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTechniciansForSchedulingPrompt',
  input: {schema: SuggestTechniciansForSchedulingInputSchema},
  output: {schema: SuggestTechniciansForSchedulingOutputSchema},
  prompt: `You are an AI scheduling assistant.  Given a description of a task, a list of available technicians, and historical data about technician performance on past tasks, suggest the best technicians to schedule for the task.

Task Description: {{{taskDescription}}}
Available Technicians: {{availableTechnicians}}
Past Task Data: {{pastTaskData}}

Consider each technician's previous performance on similar tasks, including accuracy and efficiency.

Output the suggested technicians in order of suitability, and provide a brief explanation of your reasoning.

Ensure your output is valid JSON matching the schema.`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const suggestTechniciansForSchedulingFlow = ai.defineFlow(
  {
    name: 'suggestTechniciansForSchedulingFlow',
    inputSchema: SuggestTechniciansForSchedulingInputSchema,
    outputSchema: SuggestTechniciansForSchedulingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
