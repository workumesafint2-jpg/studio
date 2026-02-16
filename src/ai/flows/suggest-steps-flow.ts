'use server';
/**
 * @fileOverview AI Workflow Suggestion Flow
 * 
 * Optimized for BPMN [wrap] and '?' logic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service or process.'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The formatted workflow steps.'),
});

export type SuggestStepsInput = z.infer<typeof SuggestStepsInputSchema>;
export type SuggestStepsOutput = z.infer<typeof SuggestStepsOutputSchema>;

/**
 * Suggest Steps Flow Definition
 */
const suggestStepsFlow = ai.defineFlow(
  {
    name: 'suggestStepsFlow',
    inputSchema: SuggestStepsInputSchema,
    outputSchema: SuggestStepsOutputSchema,
  },
  async (input) => {
    // Check for API Key presence on server side
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
      throw new Error("API_KEY_MISSING: Please add GEMINI_API_KEY to your environment variables.");
    }

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      output: { schema: SuggestStepsOutputSchema },
      prompt: `You are a Senior Process Analyst. Generate a professional BPMN workflow in Amharic for the following service.

SERVICE TITLE: ${input.title}

STRICT OUTPUT FORMAT RULES:
1. Generate exactly 5-7 logical steps in Amharic.
2. Use '[wrap]' after every 2-3 steps to force a row break in the diagram.
3. If a step involves a decision, approval, or check, end that step with a '?' to trigger a BPMN Gateway.
4. Output ONLY the raw steps with [wrap] markers. No numbers, no bullet points, no introductory text.

EXAMPLE FORMAT:
መጀመሪያ ጥያቄውን መቀበል [wrap] መረጃውን ማጣራት? [wrap] ውሳኔውን ማሳወቅ [wrap] መጨረሻ ፋይሉን መዝጋት

ALWAYS start with 'መጀመሪያ' and end with 'መጨረሻ'.`,
    });

    if (!response.output) {
      throw new Error(`AI_GEN_FAILED: ${response.finishReason || 'Unknown model error'}`);
    }
    return response.output;
  }
);

/**
 * Server Action Wrapper
 */
export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  try {
    return await suggestStepsFlow(input);
  } catch (error: any) {
    console.error("Genkit Flow Error:", error);
    // Extract specific error message for the UI
    const message = error.message || "Internal AI Connection Error";
    throw new Error(message);
  }
}
