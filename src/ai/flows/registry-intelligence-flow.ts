'use server';
/**
 * @fileOverview AI Registry & Performance Analysis Agent for ITB.
 * Handles letter metadata extraction and plan vs. report analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RegistryInputSchema = z.object({
  photoDataUri: z.string().optional().describe("A photo of the letter as a data URI."),
  mailType: z.enum(['incoming', 'outgoing', 'other']).default('incoming'),
  action: z.enum(['extract', 'analyze_performance']).default('extract'),
  additionalContext: z.string().optional(),
});

const RegistryOutputSchema = z.object({
  letterInfo: z.object({
    letterNumber: z.string().optional().describe("Extracted letter number (e.g., ITB/001/2024)."),
    letterDate: z.string().optional().describe("Extracted date from the letter."),
    subject: z.string().optional().describe("Extracted subject or title of the letter."),
    senderReceiver: z.string().optional().describe("The institution or person who sent or receives the letter."),
  }).optional(),
  performanceAnalysis: z.object({
    score: z.number().optional().describe("Calculated efficiency score out of 100."),
    narrative: z.string().optional().describe("Amharic narrative analysis of performance."),
    focusAreas: z.array(z.string()).optional().describe("List of areas requiring attention (if score < 70)."),
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
    const prompt = input.action === 'extract' 
      ? `You are an expert ITB Registry Officer. Extract the following from the letter photo:
         1. Letter Number (የደብዳቤ ቁጥር)
         2. Date (ቀን)
         3. Subject (ጉዳይ)
         4. Sender or Receiver (ላኪ/ተቀባይ)
         
         Document Type: ${input.mailType === 'incoming' ? 'ገቢ ደብዳቤ' : 'ወጪ ደብዳቤ'}
         Photo: {{media url=photoDataUri}}`
      : `Compare the provided office plans and reports. 
         Generate an efficiency score (0-100), a professional narrative summary in Amharic, 
         and identify specific "ትኩረት የሚሹ ጉዳዮች" (Focus Areas) if the score is below 70.
         Context: ${input.additionalContext}`;

    const { output } = await ai.generate({
      prompt: prompt,
      input: { photoDataUri: input.photoDataUri },
      output: { schema: RegistryOutputSchema }
    });

    return output!;
  }
);

export async function processRegistry(input: RegistryInput): Promise<RegistryOutput> {
  return itbIntelligenceFlow(input);
}
