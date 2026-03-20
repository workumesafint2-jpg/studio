
'use server';
/**
 * @fileOverview AI Registry & Performance Analysis Agent for ITB.
 * Enhanced with more robust error handling and prompt logic.
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
    let systemPrompt = '';
    let userPrompt = '';

    if (input.action === 'extract') {
      systemPrompt = 'You are an expert ITB Registry Officer specialized in digitizing documents.';
      userPrompt = `Please extract the following information from this letter:
         1. Letter Number (የደብዳቤ ቁጥር)
         2. Date (ቀን)
         3. Subject (ጉዳይ)
         4. Sender or Receiver (ላኪ/ተቀባይ - ተቋም ወይም ግለሰብ)
         
         Document Category: ${input.mailType === 'incoming' ? 'ገቢ ደብዳቤ' : input.mailType === 'outgoing' ? 'ወጪ ደብዳቤ' : 'ሌሎች'}
         Photo: {{media url=photoDataUri}}`;
    } else {
      systemPrompt = 'You are a Senior Bureau Performance Analyst for the Innovation & Technology Bureau.';
      userPrompt = `Analyze the bureau's office performance based on the following context.
         Compare office plans and results.
         Context provided: ${input.additionalContext || 'No specific document data provided. Use historical office benchmarks.'}
         
         Tasks:
         1. Provide a calculated efficiency score (0-100).
         2. Write a professional narrative summary in Amharic discussing achievements and gaps.
         3. Identify specific "ትኩረት የሚሹ ጉዳዮች" (Focus Areas) especially if the score is below 70.
         
         Ensure the response is strictly valid JSON according to the schema.`;
    }

    const { output } = await ai.generate({
      system: systemPrompt,
      prompt: userPrompt,
      input: { photoDataUri: input.photoDataUri },
      output: { schema: RegistryOutputSchema }
    });

    if (!output) {
      throw new Error('AI failed to generate a response. Check API status.');
    }

    return output;
  }
);

export async function processRegistry(input: RegistryInput): Promise<RegistryOutput> {
  return itbIntelligenceFlow(input);
}
