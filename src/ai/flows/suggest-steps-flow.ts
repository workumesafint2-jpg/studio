'use server';
/**
 * @fileOverview AI Workflow Suggestion Flow
 * 
 * This flow generates logical workflow steps in Amharic based on a process title.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service or process.'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('A logical 5-7 step workflow description in Amharic.'),
});

export async function suggestSteps(input: z.infer<typeof SuggestStepsInputSchema>) {
  return suggestStepsFlow(input);
}

const suggestStepsFlow = ai.defineFlow(
  {
    name: 'suggestStepsFlow',
    inputSchema: SuggestStepsInputSchema,
    outputSchema: SuggestStepsOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are a Senior Process Analyst at a government technology bureau. 
      Generate a logical 5-7 step BPMN workflow description in Amharic for the following service title.
      
      TITLE: {{{title}}}
      
      REQUIREMENTS:
      1. Output exactly 5-7 steps.
      2. Each step should be on a new line.
      3. Use professional Amharic language.
      4. Include a start step (መጀመሪያ) and an end step (መጨረሻ).
      5. If logical, include a decision point using words like 'ውሳኔ' or 'ቢሆን'.
      6. Do not include numbers or bullet points. Just the text of the steps.
      7. Ensure the steps represent a realistic administrative or technical process.`,
      input: {
        title: input.title,
      },
      output: {
        schema: SuggestStepsOutputSchema,
      },
    });

    return output!;
  }
);
