
'use server';
/**
 * @fileOverview Smart Institutional Workflow & Document Intelligence Agent
 * Enhanced for Deep File Analysis and Vault Registry Insights.
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
    const query = input.title.toLowerCase();
    
    // 1. Contextual Search: Find specific documents
    const matchingFiles = vault.filter(f => 
      f.name.toLowerCase().includes(query) || 
      (f.planType && f.planType.toLowerCase().includes(query)) ||
      (f.reportType && f.reportType.toLowerCase().includes(query))
    );

    // 2. Intelligence Synthesis: Analyze Vault state
    let vaultSummary = vault.map(f => `[${f.category}] ${f.name} - Version: ${f.version}, Status: ${f.status}`).join('\n');
    
    // 3. Cross-Analysis Logic
    const isComparisonRequested = query.includes('ይጣጣማል') || query.includes('compare') || query.includes('አፈጻጸም') || input.docType === 'report';
    let analysisNote = "";
    if (isComparisonRequested) {
      const plans = vault.filter(f => f.category === 'እቅዶች (Plans)');
      const reports = vault.filter(f => f.category === 'ሪፖርቶች (Reports)');
      analysisNote = `Found ${plans.length} plans and ${reports.length} reports in vault for cross-referencing.`;
    }

    // 4. AI Generation with Deep Doc Intelligence
    const response = await ai.generate({
      prompt: `You are 'ወርቁ' (Worku), the High-Value Institutional Intelligence Agent.
      
      INSTITUTIONAL CONTEXT:
      - Active Vault Registry:
      ${vaultSummary}
      
      USER INQUIRY: "${input.title}"
      DOC TYPE: ${input.docType}
      ANALYSIS NOTE: ${analysisNote}

      YOUR TASKS:
      1. ANALYZE: If the user asks about specific files (e.g., "የዓመት እቅዱን"), check the registry and summarize their status/version.
      2. COMPARE: If asked to compare (Plan vs Report), highlight the gaps in the vault (e.g., "You have a plan but no matching report").
      3. ARCHITECT: If a diagram is requested, generate a VERTICAL NUMBERED LIST (one step per line).
      4. GUIDANCE: Be concise and professional. Reference files by their name and version.

      STRICT MODELER RULES:
      - NO [wrap] markers. Use plain new lines.
      - Start with: "መጀመሪያ (Start)"
      - End with: "መጨረሻ (End)"
      - One task per line.

      GREETING: Always be institutional. Your unique signature is 'ወርቁ ነኝ ምን ልርዳዎት?'.`,
    });

    return {
      steps: response.text,
      relatedFiles: matchingFiles.map(f => `${f.name} (V${f.version})`)
    };
  }
);

export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  return suggestStepsFlow(input);
}
