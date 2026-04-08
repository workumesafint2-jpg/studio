
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
    essencePoints: z.array(z.string()).describe("Main internal themes or summary points from document analysis."),
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
      systemPrompt = 'You are a Senior Bureau Intelligence Analyst. You will analyze the internal essence, themes, and performance based on metadata and provided context. DO NOT JUST COUNT DOCUMENTS. READ THE THEMES.';
      userPrompt = `Analyze the bureau's intelligence status based on this context:
         
         VAULT DATA:
         ${input.additionalContext || 'No context.'}
         
         INSTRUCTIONS:
         1. Analyze productivity and THEMES of the documents.
         2. Provide a narrative in Amharic (ፕሮፌሽናል የአማርኛ ትንተና) that discusses the internal essence and findings.
         3. List 3-5 "Essence Points" (የይዘት ጭብጦች) representing the core messages of these documents.
         4. Identify specific Focus Areas if gaps or inefficiencies are found.
         
         The response must be valid JSON matching the output schema. Use Amharic for narrative and points.`;
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
      if (input.action === 'analyze_performance') {
        return {
          performanceAnalysis: {
            score: 0,
            narrative: "AI ትንተናውን በአሁኑ ሰዓት ማከናወን አልቻለም። እባክዎ ዳታውን በሲስተሙ በኩል ይመልከቱ።",
            focusAreas: ["የኔትወርክ ግንኙነት ይፈትሹ"],
            essencePoints: ["የመረጃ ዝውውር መቆራረጥ ይታያል", "የሰነድ ይዘት ትንተና አልተሳካም"]
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
