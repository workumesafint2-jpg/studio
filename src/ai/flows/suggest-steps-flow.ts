'use server';
/**
 * @fileOverview Mock Workflow Suggestion Flow
 * 
 * This file provides a simulated AI response for testing purposes 
 * without requiring an external API connection.
 */

import { z } from 'zod';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service or process.'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The formatted workflow steps.'),
});

export type SuggestStepsInput = z.infer<typeof SuggestStepsInputSchema>;
export type SuggestStepsOutput = z.infer<typeof SuggestStepsOutputSchema>;

/**
 * Server Action Wrapper (Mock Implementation)
 */
export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  // Simulate a brief network delay for a realistic feel
  await new Promise(resolve => setTimeout(resolve, 600));

  // Professional Amharic BPMN Mock Workflow
  // Includes [wrap] for row breaks and '?' for decision gateways
  const mockWorkflow = `መጀመሪያ ጥያቄውን መቀበል [wrap] መረጃውን ማጣራት? [wrap] ውሳኔውን ማሳወቅ [wrap] መጨረሻ ፋይሉን መዝጋት`;

  return {
    steps: mockWorkflow
  };
}
