
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
  vaultContext: z.array(z.any()).optional().describe('The current state of the Bureau Vault (DMS) registry, passed as plain serializable objects.'),
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
    // Priority search for 'Service Taxonomy' when service details are requested.
    const matchingFiles = vault.filter(f => 
      f.name.toLowerCase().includes(query) || 
      (f.taxonomyService && f.taxonomyService.toLowerCase().includes(query)) ||
      (f.category === 'Service Taxonomy' && query.includes('service'))
    );

    // 2. Intelligence Synthesis: Analyze Vault state
    let vaultSummary = vault.map(f => `[${f.category}] ${f.name} - Status: ${f.status} (Type: ${f.planType || f.reportType || f.taxonomyService || 'General'})`).join('\n');
    
    // 3. Comparison Logic (Plan vs Report)
    const isComparisonRequested = query.includes('አነጻጽሪ') || query.includes('compare') || query.includes('አፈጻጸም') || input.docType === 'report';
    
    // 4. AI Generation with Deep Doc Intelligence
    const response = await ai.generate({
      prompt: `You are 'ወርቁ' (Worku), the High-Value Institutional Intelligence Agent for the ITDB Bureau.
      
      INSTITUTIONAL CONTEXT (VAULT REGISTRY):
      ${vaultSummary}
      
      USER INQUIRY: "${input.title}"
      DOC TYPE: ${input.docType}
      IS COMPARISON REQUESTED: ${isComparisonRequested}

      YOUR TASKS:
      1. ANALYZE & COMPARE: If comparison is requested, find documents with similar names in 'እቅዶች (Plans)' and 'ሪፖርቶች (Reports)'. 
         - List the 'Gap': If a plan exists but no report, or vice versa.
         - Highlight the status (Approved vs Draft) of these documents.
      2. SERVICE TAXONOMY INSIGHTS: If the user asks about service details or taxonomies, look for files categorized as 'Service Taxonomy'. 
         - Summarize the contents found in those files.
      3. ARCHITECT: If a diagram/workflow is requested, generate a VERTICAL NUMBERED LIST (one step per line).
         - Format: 
           1. Start
           2. [Task Name]
           3. End
      4. GUIDANCE: Be concise and professional in Amharic. Reference files by their exact name and version.

      STRICT MODELER RULES:
      - NO [wrap] markers. Use plain new lines.
      - Start with: "1. Start"
      - End with: "X. End" (where X is the last step number)
      - ONE STEP PER LINE.

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
