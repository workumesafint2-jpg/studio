
'use server';
/**
 * @fileOverview Smart Institutional Workflow & Document Generator
 * Integrated with Bureau Service Registry for contextual recognition.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { findServiceInRegistry } from '@/lib/services-registry';

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
    // 1. Contextual Recognition: Check Knowledge Base first
    if (input.docType === 'diagram') {
      const predefinedWorkflow = findServiceInRegistry(input.title);
      if (predefinedWorkflow) {
        return { steps: predefinedWorkflow };
      }
    }

    // 2. Specific Report Logic
    const isReport = input.docType === 'report' || input.title.toLowerCase().includes('ሪፖርት') || input.title.toLowerCase().includes('report');
    
    // 3. Fallback: AI Generation if not in registry or for other document types
    const docTypeLabel = {
      reform: 'የሪፎርም ሰነድ (Reform Paper)',
      report: 'ቴክኒካዊ ሪፖርት (Technical Report)',
      guideline: 'የአሰራር መመሪያ (Operational Guideline)',
      diagram: 'የዲያግራም ዝርዝር ተግባር (Technical Diagram Workflow)'
    }[input.docType || 'reform'];

    const response = await ai.generate({
      prompt: `You are 'ወርቁ' (Worku), a Senior Institutional Process Architect for the Innovation and Technology Development Bureau.
      
      TASK: Generate a professional Amharic workflow for a "${docTypeLabel}" titled "${input.title}".
      
      ${isReport ? `
      SPECIFIC REPORTING COMMANDS:
      1. If the title mentions "ሳምንት" (Weekly), focus on daily tracking and quick summary.
      2. If the title mentions "ወር" (Monthly), focus on goal achievement and variance analysis.
      3. If the title mentions "ሩብ ዓመት" (Quarterly), focus on strategic KPI evaluation.
      4. If the title mentions "ዓመት" (Annual), focus on comprehensive performance appraisal and next-year planning.
      ` : ''}

      STRICT COMMAND MODELER RULES:
      1. Always start with: "Start [wrap]"
      2. Use [wrap] after EVERY action step.
      3. Use "?" for decision points (e.g., "ተቀባይነት አግኝቷል? [wrap]").
      4. Ensure a logical horizontal sequence suitable for BPMN rendering.
      5. Use formal, technical Amharic terminology.
      6. End strictly with: "[wrap] End"
      
      If the user's title implies a bureau service, generate steps that follow a standard governmental institutional logic.`,
    });

    return {
      steps: response.text,
    };
  }
);

export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  return suggestStepsFlow(input);
}
