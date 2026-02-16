'use server';
/**
 * @fileOverview Institutional Workflow Suggestion Flow (Dynamic Mock Build)
 * 
 * Provides professional Amharic responses formatted for the BPMN engine
 * based on the input title.
 */

import { z } from 'zod';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service or process.'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The formatted workflow steps.'),
});

export type SuggestStepsInput = z.infer<typeof SuggestStepsInputSchema>;
export type SuggestStepsOutput = z.infer<typeof SuggestStepsOutputSchema>;

/**
 * Server Action Wrapper with Dynamic Case-Based Mocking
 */
export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  // Simulate a brief network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const title = input.title.toLowerCase();
  let workflow = "";

  // Dynamic Logic: Match based on Amharic or English keywords
  if (title.includes("ንግድ") || title.includes("business") || title.includes("license")) {
    workflow = `የአገልግሎት ጥያቄ መቀበል [wrap] ሰነዶችን ማጣራት? [wrap] የቢሮ ምርመራ ማካሄድ [wrap] የክፍያ ትእዛዝ ማውጣት [wrap] ክፍያውን ማረጋገጥ? [wrap] የንግድ ፈቃድ ማተም [wrap] ፈቃዱን ለባለቤቱ መስጠት`;
  } 
  else if (title.includes("ልደት") || title.includes("birth") || title.includes("certificate")) {
    workflow = `ማመልከቻውን በሲስተም መመዝገብ [wrap] ደጋፊ ማስረጃዎችን ማረጋገጥ? [wrap] ፎርሙን በሚገባ መሙላት [wrap] ክፍያ መፈጸም [wrap] የምስክር ወረቀቱን ማተም [wrap] መዝገብ ላይ ማረጋገጥ? [wrap] ለተገልጋዩ መስጠት`;
  }
  else if (title.includes("መንጃ") || title.includes("driving") || title.includes("driver")) {
    workflow = `የብቃት ማረጋገጫ ጥያቄ መቀበል [wrap] የጽሁፍ ፈተና መውሰድ? [wrap] የተግባር ፈተና መፈተን? [wrap] ውጤቱን መመዝገብ [wrap] ክፍያ መፈጸም [wrap] መንጃ ፈቃዱን ማተም [wrap] ለተሳታፊው መስጠት`;
  }
  else if (title.includes("ፓስፖርት") || title.includes("passport")) {
    workflow = `የቀጠሮ ሰነድ ማቅረብ [wrap] ዋና መረጃዎችን ማጣራት? [wrap] ፎቶና አሻራ መውሰድ [wrap] የደህንነት ማጣሪያ ማካሄድ? [wrap] ፓስፖርቱን ማተም [wrap] ማድረስ`;
  }
  else {
    // Default Professional Institutional Workflow
    workflow = `የደብዳቤ ወይም የቃል ጥያቄ መቀበል [wrap] ጉዳዩን ለሚመለከተው መምራት [wrap] ምላሽ ማዘጋጀት? [wrap] በኃላፊ ማስፈረም [wrap] ማህተም ማድረግ [wrap] ለተገልጋዩ ምላሽ መስጠት`;
  }

  return {
    steps: workflow
  };
}
