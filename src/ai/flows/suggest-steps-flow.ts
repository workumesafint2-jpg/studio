
'use server';
/**
 * @fileOverview Smart Institutional Workflow & Comparison Intelligence Agent
 * Enhanced for Gap Analysis (Plan vs Report) and Vault Registry Insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
    const query = input.title.toLowerCase();
    
    // 1. Contextual Search: Find specific documents
    const matchingFiles = vault.filter(f => 
      f.name.toLowerCase().includes(query) || 
      (f.planType && f.planType.toLowerCase().includes(query)) ||
      (f.reportType && f.reportType.toLowerCase().includes(query))
    );

    // 2. Intelligence Synthesis: Analyze Vault state
    let vaultSummary = vault.map(f => `[${f.category}] ${f.name} - Status: ${f.status}`).join('\n');
    
    // 3. Comparison Logic (Plan vs Report)
    const isComparisonRequested = query.includes('አነጻጽሪ') || query.includes('compare') || query.includes('አፈጻጸም') || input.docType === 'report';
    
    // 4. AI Generation with Deep Doc Intelligence
    const response = await ai.generate({
      prompt: `You are 'ወርቁ' (Worku), the High-Value Institutional Intelligence Agent.
      
      INSTITUTIONAL CONTEXT (VAULT REGISTRY):
      ${vaultSummary}
      
      USER INQUIRY: "${input.title}"
      DOC TYPE: ${input.docType}
      IS COMPARISON REQUESTED: ${isComparisonRequested}

      YOUR TASKS:
      1. ANALYZE & COMPARE: If comparison is requested, find documents with similar names in 'እቅዶች (Plans)' and 'ሪፖርቶች (Reports)'. 
         - List the 'Gap': If a plan exists but no report, or vice versa.
         - Highlight the status of these documents.
      2. ARCHITECT: If a diagram/workflow is requested, generate a VERTICAL NUMBERED LIST (one step per line).
         - Format: 
           1. Start
           2. [Task]
           3. End
      3. GUIDANCE: Be concise and professional in Amharic. Reference files by their exact name.

      STRICT MODELER RULES:
      - NO [wrap] markers. Use plain new lines.
      - Start with: "መጀመሪያ (Start)"
      - End with: "መጨረሻ (End)"
      - One task per line.

      GREETING: Always be institutional. Your unique signature is 'ወርቁ ነኝ ምን ልርዳዎት?'.`,
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
