'use server';
/**
 * @fileOverview AI BPMN Architect Flow
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ArchitectInputSchema = z.object({
  description: z.string().describe('The natural language description of the process.'),
  title: z.string().optional().describe('The title of the process.'),
});

const ArchitectOutputSchema = z.object({
  structuredSteps: z.string().describe('The structured process steps.'),
  refinedTitle: z.string().describe('A professional title for the process.'),
});

export type ArchitectInput = z.infer<typeof ArchitectInputSchema>;
export type ArchitectOutput = z.infer<typeof ArchitectOutputSchema>;

const architectBPMNFlow = ai.defineFlow(
  {
    name: 'architectBPMNFlow',
    inputSchema: ArchitectInputSchema,
    outputSchema: ArchitectOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      output: { schema: ArchitectOutputSchema },
      prompt: `You are a Senior BPMN Architect. Translate the following description into structured process steps.
      
USER DESCRIPTION:
${input.description}

USER TITLE:
${input.title || 'Untitled Process'}`,
    });

    if (!response.output) {
      throw new Error('AI failed to architect the BPMN process.');
    }
    return response.output;
  }
);

export async function architectBPMN(input: ArchitectInput): Promise<ArchitectOutput> {
  return architectBPMNFlow(input);
}
