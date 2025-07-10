'use server';
/**
 * @fileOverview An AI agent that suggests timesheet entries based on location tracking data.
 *
 * - suggestTimesheetEntriesFromLocation - A function that suggests timesheet entries.
 * - SuggestTimesheetEntriesFromLocationInput - The input type for the suggestTimesheetEntriesFromLocation function.
 * - SuggestTimesheetEntriesFromLocationOutput - The return type for the suggestTimesheetEntriesFromLocation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTimesheetEntriesFromLocationInputSchema = z.object({
  locationData: z.string().describe('Location tracking data, including timestamp and coordinates.'),
  jobHistory: z.string().describe('A summary of the user\'s job history, including projects and tasks.'),
  employeeProfile: z.string().describe('Information about the employee, including skills and roles.'),
});
export type SuggestTimesheetEntriesFromLocationInput = z.infer<typeof SuggestTimesheetEntriesFromLocationInputSchema>;

const SuggestTimesheetEntriesFromLocationOutputSchema = z.object({
  suggestedEntries: z.array(
    z.object({
      jobId: z.string().describe('The ID of the job.'),
      projectId: z.string().describe('The ID of the project.'),
      startTime: z.string().describe('Suggested start time for the timesheet entry (ISO format).'),
      endTime: z.string().describe('Suggested end time for the timesheet entry (ISO format).'),
      taskDescription: z.string().describe('Description of the task performed at the location.'),
      confidence: z.number().describe('A number from 0 to 1 reflecting the confidence of the suggested timesheet entry based on the location data and job history.'),
    })
  ).describe('An array of suggested timesheet entries.'),
});
export type SuggestTimesheetEntriesFromLocationOutput = z.infer<typeof SuggestTimesheetEntriesFromLocationOutputSchema>;

export async function suggestTimesheetEntriesFromLocation(input: SuggestTimesheetEntriesFromLocationInput): Promise<SuggestTimesheetEntriesFromLocationOutput> {
  return suggestTimesheetEntriesFromLocationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTimesheetEntriesFromLocationPrompt',
  input: {schema: SuggestTimesheetEntriesFromLocationInputSchema},
  output: {schema: SuggestTimesheetEntriesFromLocationOutputSchema},
  prompt: `You are an AI assistant that suggests timesheet entries based on location data, job history, and employee profile.

  Analyze the following information to suggest timesheet entries.  Include the job ID, project ID, start and end times, task descriptions, and a confidence score for each suggested entry. Return a JSON array of suggested timesheet entries.

  Location Data: {{{locationData}}}
  Job History: {{{jobHistory}}}
  Employee Profile: {{{employeeProfile}}}

  Ensure that you only include information available in the data provided to generate the suggestions. Also, the startTime and endTime fields must be in ISO format.
  `,
});

const suggestTimesheetEntriesFromLocationFlow = ai.defineFlow(
  {
    name: 'suggestTimesheetEntriesFromLocationFlow',
    inputSchema: SuggestTimesheetEntriesFromLocationInputSchema,
    outputSchema: SuggestTimesheetEntriesFromLocationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
