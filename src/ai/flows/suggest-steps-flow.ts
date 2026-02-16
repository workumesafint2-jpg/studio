'use server';
/**
 * @fileOverview Institutional Workflow Suggestion Flow (Professional Mock Database)
 * 
 * Provides high-fidelity mock responses for specific ITDB services
 * to ensure reliability and immediate BPMN rendering.
 */

import { z } from 'zod';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service or process.'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The formatted workflow steps in Amharic.'),
});

export type SuggestStepsInput = z.infer<typeof SuggestStepsInputSchema>;
export type SuggestStepsOutput = z.infer<typeof SuggestStepsOutputSchema>;

/**
 * Professional Mock Database for ITDB Services
 */
const MOCK_DB: Record<string, string> = {
  "የሶፍትዌር ማልማት": "ጥያቄ መቀበል [wrap] ፍላጎትን መተንተን [wrap] ዲዛይን ማዘጋጀት [wrap] ኮድ መጻፍ [wrap] ሙከራ ማድረግ [wrap] ስራ ላይ ማዋል",
  "መሰረተ ልማት": "ቦታ መረጣ [wrap] ጥናት ማካሄድ [wrap] ግብዓት ማሟላት [wrap] ግንባታ መጀመር [wrap] ክትትል ማድረግ [wrap] ማጠናቀቅ",
  "የቅጥር": "ክፍት የስራ ቦታ ማስታወቅ [wrap] ሲቪ መቀበል [wrap] ፈተና መጥራት [wrap] ቃለ መጠይቅ [wrap] መረጣ [wrap] ቅጥር መፈጸም",
  "ክትትልና ድጋፍ": "እቅድ መገምገም [wrap] የመስክ ምልከታ [wrap] ግብረ መልስ መስጠት [wrap] ክፍተቶችን መለየት [wrap] ድጋፍ ማድረግ [wrap] ሪፖርት ማቅረብ",
  "የሙያ ፍቃድ መስጠት": "ማመልከቻ መቀበል [wrap] ማስረጃ ማጣራት [wrap] ፈተና መስጠት [wrap] ውጤት ማሳወቅ [wrap] ክፍያ መፈጸም [wrap] ፍቃድ መስጠት",
  "የጥናትና ምርምር": "ርዕስ መምረጥ [wrap] መረጃ ማሰባሰብ [wrap] ትንተና መስራት [wrap] ግኝቶችን መለየት [wrap] ምክረ ሃሳብ ማቅረብ [wrap] ህትመት ማውጣት",
};

/**
 * Workflow Suggestion Engine
 * Returns mock data if a match is found, otherwise returns a generic professional process.
 */
export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  const greeting = "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ/ልሽ [wrap] ";
  const title = input.title.trim();
  
  // Logic: Search for the service title in our mock database
  const matchKey = Object.keys(MOCK_DB).find(key => title.includes(key));
  const workflowContent = matchKey ? MOCK_DB[matchKey] : "የአገልግሎት ጥያቄ መቀበል [wrap] የቀረቡ ሰነዶችን ማጣራት? [wrap] የቢሮ ምርመራ ማካሄድ [wrap] የክፍያ ትእዛዝ ማውጣት [wrap] ፈቃዱን ማተም [wrap] ለተገልጋዩ መስጠት";

  return {
    steps: greeting + workflowContent,
  };
}
