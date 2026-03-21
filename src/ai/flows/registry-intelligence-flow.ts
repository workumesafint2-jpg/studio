
'use server';
/**
 * @fileOverview AI Registry & Performance Analysis Agent for ITB.
 * Optimized for robustness and deeper data analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RegistryInputSchema = z.object({
  photoDataUri: z.string().optional().describe("A photo of the document as a data URI."),
  category: z.enum(['plan', 'report', 'incoming_letter', 'outgoing_letter', 'reform', 'service', 'other']).default('other'),
  action: z.enum(['extract', 'analyze_performance']).default('extract'),
  additionalContext: z.string().optional().describe("Vault context or efficiency metadata."),
});

const RegistryOutputSchema = z.object({
  letterInfo: z.object({
    letterNumber: z.string().optional().describe("Extracted letter number (የደብዳቤ ቁጥር)."),
    letterDate: z.string().optional().describe("Extracted date (ቀን)."),
    subject: z.string().optional().describe("Extracted subject (ጉዳይ)."),
    senderReceiver: z.string().optional().describe("Sender or Receiver institution/person."),
  }).optional(),
  performanceAnalysis: z.object({
    score: z.number().describe("Efficiency score (0-100)."),
    narrative: z.string().describe("Amharic professional analysis of the current status."),
    focusAreas: z.array(z.string()).describe("Focus areas based on plan/report gaps."),
  }).optional(),
});

export type RegistryInput = z.infer<typeof RegistryInputSchema>;
export type RegistryOutput = z.infer<typeof RegistryOutputSchema>;

const itbIntelligenceFlow = ai.defineFlow(
  {
    name: 'itbIntelligenceFlow',
    inputSchema: RegistryInputSchema,
    outputSchema: RegistryOutputSchema,
  },
  async (input) => {
    let systemPrompt = '';
    let userPrompt = '';

    if (input.action === 'extract') {
      systemPrompt = 'You are an expert ITB Registry Officer. Extract Amharic and English details from the provided document image. Be precise with letter numbers and subjects.';
      userPrompt = `Please extract the following fields:
         1. Letter Number (የደብዳቤ ቁጥር)
         2. Date (ቀን)
         3. Subject (ጉዳይ)
         4. Sender or Receiver (ላኪ/ተቀባይ)
         
         Document Category: ${input.category}
         Photo: {{media url=photoDataUri}}`;
    } else {
      systemPrompt = 'You are a Senior Bureau Performance Analyst. You will be provided with vault metadata. Analyze productivity and provide a high-value Amharic narrative.';
      userPrompt = `Analyze the bureau's performance based on this context:
         
         VAULT DATA:
         ${input.additionalContext || 'No context.'}
         
         INSTRUCTIONS:
         1. Summarize efficiency based on the ratio of Reports to Plans.
         2. Provide a narrative in Amharic (ፕሮፌሽናል የአማርኛ ትንተና).
         3. List specific Focus Areas (ትኩረት የሚሹ ጉዳዮች) if gaps are found.
         
         The response must be valid JSON matching the output schema.`;
    }

    try {
      const { output } = await ai.generate({
        system: systemPrompt,
        prompt: userPrompt,
        input: { photoDataUri: input.photoDataUri },
        output: { schema: RegistryOutputSchema },
        config: {
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }
          ]
        }
      });

      if (!output) {
        throw new Error('AI Analysis failed to generate a result.');
      }

      return output;
    } catch (err) {
      console.error("Genkit Flow Error:", err);
      // Return a basic structure instead of throwing to avoid UI crash
      if (input.action === 'analyze_performance') {
        return {
          performanceAnalysis: {
            score: 0,
            narrative: "AI ትንተናውን በአሁኑ ሰዓት ማከናወን አልቻለም። እባክዎ ዳታውን በሲስተሙ በኩል ይመልከቱ።",
            focusAreas: ["የኔትወርክ ግንኙነት ይፈትሹ", "መረጃዎችን በትክክል መጫናቸውን ያረጋግጡ"]
          }
        };
      }
      throw err;
    }
  }
);

export async function processRegistry(input: RegistryInput): Promise<RegistryOutput> {
  return itbIntelligenceFlow(input);
}
