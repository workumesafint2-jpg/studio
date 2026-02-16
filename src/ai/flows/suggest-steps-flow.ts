'use server';
/**
 * @fileOverview Institutional Workflow Suggestion Flow
 * 
 * Uses Gemini 1.5 Flash to generate professional Amharic workflows
 * specifically formatted for the BPMN engine.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service or process.'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The formatted workflow steps in Amharic.'),
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
      prompt: `You are an expert institutional BPMN architect specializing in Ethiopian government workflows.
      
      TASK: Generate a logical 5-7 step professional workflow in Amharic for the following service: "${input.title}".
      
      STRICT FORMATTING RULES:
      1. Start the entire response with exactly: "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ/ልሽ [wrap] "
      2. Separate every subsequent step with exactly " [wrap] ".
      3. If a step is a question, decision, or verification (e.g., "Is it approved?"), it MUST end with a "?" to trigger a decision gateway.
      4. Use professional administrative Amharic terminology.
      5. DO NOT include numbering (1, 2, 3), bullet points, or any preamble.
      6. The output MUST be a single continuous string.

      EXAMPLE OUTPUT FORMAT:
      ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ/ልሽ [wrap] የአገልግሎት ጥያቄ መቀበል [wrap] የቀረቡ ሰነዶችን ማጣራት? [wrap] የቢሮ ምርመራ ማካሄድ [wrap] የክፍያ ትእዛዝ ማውጣት [wrap] ክፍያውን ማረጋገጥ? [wrap] ፈቃዱን ማተም [wrap] ለተገልጋዩ መስጠት`,
    });

    return {
      steps: response.text,
    };
  }
);

/**
 * Server Action Wrapper
 */
export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  return suggestStepsFlow(input);
}
