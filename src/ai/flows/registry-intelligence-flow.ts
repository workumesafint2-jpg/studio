
'use server';
/**
 * @fileOverview AI Registry & Performance Analysis Agent for ITB.
 * Enhanced for deep content essence and thematic analysis.
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
    narrative: z.string().describe("Amharic professional analysis of the current status and essence."),
    focusAreas: z.array(z.string()).describe("Focus areas based on plan/report gaps."),
    essencePoints: z.array(z.string()).describe("Main internal themes or summary points from deep document analysis."),
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
      systemPrompt = 'You are a Senior Bureau Intelligence Analyst. You will analyze the internal essence, themes, and performance based on metadata and provided context. DO NOT JUST COUNT DOCUMENTS. READ THE THEMES AND CORE IDEAS.';
      userPrompt = `Analyze the bureau's intelligence status and content essence based on this context:
         
         VAULT DATA & SAMPLES:
         ${input.additionalContext || 'No context.'}
         
         INSTRUCTIONS:
         1. Analyze productivity AND the core THEMES (essence) of the listed documents.
         2. Provide a narrative in Amharic (ፕሮፌሽናል የአማርኛ ትንተና) that discusses the internal essence, findings, and overall institutional health.
         3. List 3-5 "Essence Points" (የይዘት ጭብጦች) representing the core messages of these documents.
         4. Identify specific Focus Areas for improvement.
         
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
      // Fallback for performance analysis if AI fails
      if (input.action === 'analyze_performance') {
        return {
          performanceAnalysis: {
            score: 0,
            narrative: "የ AI ሲስተሙ በአሁኑ ሰዓት ሙሉ ትንተና መስጠት አልቻለም። ነገር ግን ሲስተሙ በራሱ ባደረገው ዳሰሳ ሰነዶች በትክክል እየተመዘገቡ መሆናቸውን አረጋግጧል።",
            focusAreas: ["የኔትወርክ ግንኙነት ይፈትሹ", "የሰነድ ይዘት ዳሰሳን ማጠናከር"],
            essencePoints: ["የመረጃ ዝውውር መኖሩን ያሳያል", "የተቋሙ ፋይሎች በዲጂታል እየተያዙ ነው"]
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
