
'use server';
/**
 * @fileOverview Smart Bureau Performance Analysis Agent
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the document or analysis query.'),
  docType: z.enum(['reform', 'report', 'guideline', 'diagram', 'analysis']).optional().default('report'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The narrative analysis or workflow steps.'),
  efficiencyScore: z.number().describe('A simulated efficiency score out of 100.'),
});

export type SuggestStepsInput = z.infer<typeof SuggestStepsInputSchema>;
export type SuggestStepsOutput = z.infer<typeof SuggestStepsOutputSchema>;

const suggestStepsFlow = ai.defineFlow(
  {
    name: 'suggestStepsFlow',
    inputSchema: SuggestStepsInputSchema,
    outputSchema: SuggestStepsOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      prompt: `You are 'ወርቁ' (Worku), the High-Value Intelligence Agent for the Innovation & Technology Bureau.
      
      GREETING: "ኢትዮጵያዊ AI ነኝ ምን ልርዳዎት?"
      
      ANALYSIS TARGET: "${input.title}"
      TYPE: ${input.docType}

      TASKS:
      1. If the input is a report, provide a 3-sentence professional efficiency summary in Amharic.
      2. List 3 key focus areas for the next quarter.
      3. Provide a simulated efficiency percentage based on the complexity of the title.

      BE CONCISE AND PROFESSIONAL. ALWAYS START WITH THE ETHIOPIAN GREETING.`,
    });

    return {
      steps: response.text,
      efficiencyScore: Math.floor(Math.random() * 30) + 70 // Simulate 70-100%
    };
  }
);

export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  return suggestStepsFlow(input);
}
