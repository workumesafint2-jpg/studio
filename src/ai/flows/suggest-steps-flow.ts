
'use server';
/**
 * @fileOverview Smart Institutional Workflow Intelligence Agent
 * Optimized for high-speed response (Turbo Performance).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service or query.'),
  docType: z.enum(['reform', 'report', 'guideline', 'diagram', 'analysis']).optional().default('reform'),
  vaultContext: z.array(z.any()).optional(),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The formatted workflow steps.'),
  relatedFiles: z.array(z.string()).optional(),
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
      
      USER INQUIRY: "${input.title}"
      DOC TYPE: ${input.docType}

      TASKS:
      1. If the user asks for a diagram/workflow, provide a VERTICAL NUMBERED LIST.
      2. If comparison (Analysis) is requested, summarize gaps between Plans and Reports in the context.
      3. Format: ONE STEP PER LINE. No extra text.
      4. Start with: "1. Start" and end with "X. End".

      Example:
      1. Start
      2. Review Request
      3. Process Approval
      4. End

      BE CONCISE AND PROFESSIONAL.`,
    });

    return {
      steps: response.text,
      relatedFiles: []
    };
  }
);

export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  return suggestStepsFlow(input);
}
