
'use server';
/**
 * @fileOverview AI Registry & Performance Analysis Agent for ITB.
 * Enhanced with deep performance comparison logic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RegistryInputSchema = z.object({
  photoDataUri: z.string().optional().describe("A photo of the letter as a data URI."),
  category: z.enum(['plan', 'report', 'incoming_letter', 'outgoing_letter', 'reform', 'service', 'other']).default('other'),
  action: z.enum(['extract', 'analyze_performance']).default('extract'),
  additionalContext: z.string().optional().describe("Context from the document vault for analysis."),
});

const RegistryOutputSchema = z.object({
  letterInfo: z.object({
    letterNumber: z.string().optional().describe("Extracted letter number."),
    letterDate: z.string().optional().describe("Extracted date."),
    subject: z.string().optional().describe("Extracted subject."),
    senderReceiver: z.string().optional().describe("Sender or Receiver institution/person."),
  }).optional(),
  performanceAnalysis: z.object({
    score: z.number().describe("Calculated efficiency score out of 100."),
    narrative: z.string().describe("Amharic narrative analysis based on plans vs results."),
    focusAreas: z.array(z.string()).describe("Areas requiring urgent attention (especially if score < 70)."),
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
      systemPrompt = 'You are an expert ITB Registry Officer. Extract Amharic and English details from the provided document image.';
      userPrompt = `Please extract:
         1. Letter Number (የደብዳቤ ቁጥር)
         2. Date (ቀን)
         3. Subject (ጉዳይ)
         4. Sender or Receiver (ላኪ/ተቀባይ)
         
         Document Category: ${input.category}
         Photo: {{media url=photoDataUri}}`;
    } else {
      systemPrompt = 'You are a Senior Bureau Performance Analyst. You will be given a context of current documents (Plans, Reports, Letters) in the vault. Your task is to analyze the office productivity.';
      userPrompt = `Analyze the bureau's office performance based on the following vault metadata:
         
         VAULT CONTEXT:
         ${input.additionalContext || 'No specific vault data provided.'}
         
         TASKS:
         1. Calculate an overall efficiency score (0-100) based on the ratio of Reports to Plans and overall activity.
         2. Provide a professional Amharic narrative analysis.
         3. Identify specific "ትኩረት የሚሹ ጉዳዮች" (Focus Areas) based on missing reports or slow progress.
         
         Ensure the response is strictly valid JSON matching the schema.`;
    }

    const { output } = await ai.generate({
      system: systemPrompt,
      prompt: userPrompt,
      input: { photoDataUri: input.photoDataUri },
      output: { schema: RegistryOutputSchema }
    });

    if (!output) {
      throw new Error('AI Analysis failed to generate a result.');
    }

    return output;
  }
);

export async function processRegistry(input: RegistryInput): Promise<RegistryOutput> {
  return itbIntelligenceFlow(input);
}
