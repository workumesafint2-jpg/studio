'use server';
/**
 * @fileOverview Smart Institutional Workflow & Document Generator
 * Optimized for (ወርቁ) Command-based Modeler Logic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service or process.'),
  docType: z.enum(['reform', 'report', 'guideline', 'diagram']).optional().default('reform').describe('The type of content to generate.'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The formatted workflow steps with technical context.'),
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
    const docTypeLabel = {
      reform: 'የሪፎርም ሰነድ (Reform Paper)',
      report: 'ቴክኒካዊ ሪፖርት (Technical Report)',
      guideline: 'የአሰራር መመሪያ (Operational Guideline)',
      diagram: 'የዲያግራም ዝርዝር ተግባር (Technical Diagram Workflow)'
    }[input.docType || 'reform'];

    const response = await ai.generate({
      prompt: `You are 'ወርቁ' (Worku), a Senior Institutional Process Architect for the ITDB (Innovation and Technology Development Bureau).
      
      TASK: Generate a professional Amharic workflow for a "${docTypeLabel}" titled "${input.title}".
      
      STRICT COMMAND MODELER RULES:
      1. Always start the response with exactly: "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ/ልሽ [wrap] "
      2. Use [wrap] at the end of every step to indicate a new line/row in the BPMN diagram. This is CRITICAL for the modeler to render properly.
      3. For decision points or reviews, use a question mark "?" (e.g., "ሰነዱ ተሟልቷል? [wrap]").
      4. Ensure the steps follow a logical, professional horizontal sequence.
      5. Use high-level, technical Amharic terminology suitable for the Bureau.
      6. For "diagram" type, focus purely on specific actionable commands that translate well to a flowchart (e.g. Start -> Task -> Decision -> End).
      
      FORMAT EXAMPLE:
      ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ/ልሽ [wrap] ማመልከቻ መቀበል [wrap] ሰነዱ ተሟልቷል? [wrap] ክፍያ መፈጸም [wrap] ፈቃድ መስጠት [wrap] ማጠናቀቅ`,
    });

    return {
      steps: response.text,
    };
  }
);

export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  return suggestStepsFlow(input);
}
