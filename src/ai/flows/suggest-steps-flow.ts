'use server';
/**
 * @fileOverview Smart Institutional Workflow & Document Intelligence Agent
 * Integrated with Bureau Service Registry and Vault (DMS) for contextual recognition.
 * Updated to support vertical list formatting without [wrap] markers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { findServiceInRegistry } from '@/lib/services-registry';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service, process, or search query.'),
  docType: z.enum(['reform', 'report', 'guideline', 'diagram', 'analysis']).optional().default('reform').describe('The type of content to generate or analysis to perform.'),
  vaultContext: z.array(z.any()).optional().describe('The current state of the Bureau Vault (DMS) registry.'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The formatted workflow steps or analytical summary.'),
  relatedFiles: z.array(z.string()).optional().describe('List of related files found in the vault.'),
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
    const vault = input.vaultContext || [];
    
    // 1. Contextual Search: Check if the user is asking about a specific file in the Vault
    const query = input.title.toLowerCase();
    const matchingFiles = vault.filter(f => 
      f.name.toLowerCase().includes(query) || 
      (f.planType && f.planType.toLowerCase().includes(query)) ||
      (f.reportType && f.reportType.toLowerCase().includes(query))
    );

    // 2. Cross-Analysis Logic: Compare Reports and Plans if requested
    const isComparisonRequested = query.includes('ይጣጣማል') || query.includes('compare') || query.includes('አፈጻጸም');
    let analysisNote = "";

    if (isComparisonRequested) {
      const plans = vault.filter(f => f.category === 'Plan');
      const reports = vault.filter(f => f.category === 'Report');
      analysisNote = `[SYSTEM NOTE: Analyzing ${plans.length} plans and ${reports.length} reports for variance...]`;
    }

    // 3. Service Registry Recognition
    if (input.docType === 'diagram') {
      const predefinedWorkflow = findServiceInRegistry(input.title);
      if (predefinedWorkflow) {
        // Normalize predefined workflows to new vertical format (removing [wrap])
        const verticalWorkflow = predefinedWorkflow.replace(/\[wrap\]/gi, '\n');
        return { 
          steps: verticalWorkflow,
          relatedFiles: matchingFiles.map(f => f.name)
        };
      }
    }

    // 4. AI Generation with Vault Intelligence
    const response = await ai.generate({
      prompt: `You are 'ወርቁ' (Worku), the Senior Institutional Intelligence Agent for the ITDB.
      
      CONTEXT:
      - Current Vault Registry: ${JSON.stringify(vault.map(f => ({ name: f.name, category: f.category, type: f.planType || f.reportType })))}
      - User Query: "${input.title}"
      - Analysis Note: ${analysisNote}

      TASK: 
      1. If the user is searching for a file, summarize its status and metadata.
      2. If the user asks for a diagram, generate professional Amharic BPMN steps as a VERTICAL NUMBERED LIST.
      3. If the user asks to compare (Cross-Analysis), highlight gaps between 'Plan' and 'Report' categories.
      4. If the query relates to a Bureau Service, reference its status in the 'Service Taxonomy'.

      STRICT COMMAND MODELER RULES (for diagrams):
      1. DO NOT USE '[wrap]'. USE SIMPLE NEW LINES INSTEAD.
      2. Start with: "መጀመሪያ (Start)" on its own line.
      3. End with: "መጨረሻ (End)" on its own line.
      4. Place exactly one task, decision, or gateway per line.
      5. Example Format:
         መጀመሪያ (Start)
         የጥያቄ መቀበል
         ማጽደቅ? (ውሳኔ)
         መጨረሻ (End)

      INTERACTIVE GUIDANCE:
      Always act as a helpful bureau assistant. Always start with 'ወርቁ ነኝ ምን ልርዳዎት?' if it is a fresh interaction.`,
    });

    return {
      steps: response.text,
      relatedFiles: matchingFiles.map(f => f.name)
    };
  }
);

export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  return suggestStepsFlow(input);
}
