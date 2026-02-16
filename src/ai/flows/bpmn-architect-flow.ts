'use server';
/**
 * @fileOverview AI BPMN Architect Flow
 * 
 * This flow takes a natural language process description and converts it into
 * the structured step format required by the (ወርቁ) Pro BPMN engine.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ArchitectInputSchema = z.object({
  description: z.string().describe('The natural language description of the process.'),
  title: z.string().optional().describe('The title of the process.'),
});

const ArchitectOutputSchema = z.object({
  structuredSteps: z.string().describe('The structured process steps using engine keywords like (serviceTask), (userTask), (gateway), parallel, timer:, edit:, and cancel:.'),
  refinedTitle: z.string().describe('A professional title for the process.'),
});

export type ArchitectInput = z.infer<typeof ArchitectInputSchema>;
export type ArchitectOutput = z.infer<typeof ArchitectOutputSchema>;

export async function architectBPMN(input: ArchitectInput): Promise<ArchitectOutput> {
  return architectBPMNFlow(input);
}

const architectPrompt = ai.definePrompt({
  name: 'architectPrompt',
  input: { schema: ArchitectInputSchema },
  output: { schema: ArchitectOutputSchema },
  prompt: `You are a Senior BPMN Architect. Your task is to translate a user's natural language process description into a strictly structured format for a BPMN engine.

RULES:
1. Identify steps and label them with (userTask) for human actions or (serviceTask) for automated/system actions.
2. Identify decision points and use the suffix "?" with the label "(gateway)".
3. For parallel actions, use the keyword "Parallel" followed by the two simultaneous tasks.
4. For loops (going back to a previous step), use "edit: [Task Name]" or "fix: [Task Name]".
5. For process rejections/cancellations, use "cancel: [Reason]".
6. For time-based waits, use "Timer: [Duration]".
7. Keep task names short and professional (2-4 words).
8. Remove conversational filler. Output ONLY the list of steps.

USER DESCRIPTION:
{{{description}}}

USER TITLE (Optional):
{{{title}}}`,
});

const architectBPMNFlow = ai.defineFlow(
  {
    name: 'architectBPMNFlow',
    inputSchema: ArchitectInputSchema,
    outputSchema: ArchitectOutputSchema,
  },
  async (input) => {
    const { output } = await architectPrompt(input);
    if (!output) {
      throw new Error('AI failed to architect the BPMN process.');
    }
    return output;
  }
);
