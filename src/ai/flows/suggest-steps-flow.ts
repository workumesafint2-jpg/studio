
'use server';
/**
 * @fileOverview Institutional Workflow & Technical Report Generator
 * 
 * Provides high-fidelity mock responses for ITDB services
 * Includes structured BPMN steps and technical report context.
 */

import { z } from 'zod';

const SuggestStepsInputSchema = z.object({
  title: z.string().describe('The title of the service or process.'),
});

const SuggestStepsOutputSchema = z.object({
  steps: z.string().describe('The formatted workflow steps with technical context.'),
});

export type SuggestStepsInput = z.infer<typeof SuggestStepsInputSchema>;
export type SuggestStepsOutput = z.infer<typeof SuggestStepsOutputSchema>;

/**
 * Institutional Workflow Database
 */
const MOCK_DB: Record<string, string> = {
  "የሶፍትዌር ማልማት": "የሪፎርም ሪፖርት፡ ይህ ሂደት የቢሮውን የዲጂታላይዜሽን እቅድ ለማሳካት ታስቦ የተዘጋጀ ነው። [wrap] ጥያቄ መቀበል [wrap] ፍላጎትን መተንተን [wrap] ዲዛይን ማዘጋጀት [wrap] ኮድ መጻፍ [wrap] ሙከራ ማድረግ [wrap] ስራ ላይ ማዋል",
  "መሰረተ ልማት": "የሪፎርም ሪፖርት፡ የመሰረተ ልማት ሂደቶችን በማዘመን የአገልግሎት ጥራትን ማሻሻል። [wrap] ቦታ መረጣ [wrap] ጥናት ማካሄድ [wrap] ግብዓት ማሟላት [wrap] ግንባታ መጀመር [wrap] ክትትል ማድረግ [wrap] ማጠናቀቅ",
  "የቅጥር": "የሪፎርም ሪፖርት፡ የሰው ኃይል ቅጥርን ግልጽ እና ቀልጣፋ ለማድረግ የተነደፈ። [wrap] ክፍት የስራ ቦታ ማስታወቅ [wrap] ሲቪ መቀበል [wrap] ፈተና መጥራት [wrap] ቃለ መጠይቅ [wrap] መረጣ [wrap] ቅጥር መፈጸም",
  "ክትትልና ድጋፍ": "የሪፎርም ሪፖርት፡ የተቋማዊ ግቦችን ስኬት በቅርበት ለመከታተል የሚያስችል ስርአት። [wrap] እቅድ መገምገም [wrap] የመስክ ምልከታ [wrap] ግብረ መልስ መስጠት [wrap] ክፍተቶችን መለየት [wrap] ድጋፍ ማድረግ [wrap] ሪፖርት ማቅረብ",
  "የሙያ ፍቃድ መስጠት": "የሪፎርም ሪፖርት፡ ለተገልጋዮች የሙያ ፍቃድ አሰጣጥን ምቹ ለማድረግ የተዘጋጀ። [wrap] ማመልከቻ መቀበል [wrap] ማስረጃ ማጣራት [wrap] ፈተና መስጠት [wrap] ውጤት ማሳወቅ [wrap] ክፍያ መፈጸም [wrap] ፍቃድ መስጠት",
  "የጥናትና ምርምር": "የሪፎርም ሪፖርት፡ በቢሮው የሚካሄዱ ጥናቶች ለፖሊሲ ግብዓት እንዲሆኑ የሚያረጋግጥ። [wrap] ርዕስ መምረጥ [wrap] መረጃ ማሰባሰብ [wrap] ትንተና መስራት [wrap] ግኝቶችን መለየት [wrap] ምክረ ሃሳብ ማቅረብ [wrap] ህትመት ማውጣት",
};

/**
 * Enhanced Suggestion Engine
 */
export async function suggestSteps(input: SuggestStepsInput): Promise<SuggestStepsOutput> {
  const greeting = "ወርቁ ነኝ የሪፎርም ሰነዱን እና ሂደቱን አዘጋጅቼልሃለሁ [wrap] ";
  const title = input.title.trim();
  
  const matchKey = Object.keys(MOCK_DB).find(key => title.includes(key));
  const workflowContent = matchKey ? MOCK_DB[matchKey] : "የሪፎርም ሪፖርት፡ የአገልግሎት አሰጣጥን ለማዘመን የተዘጋጀ አጠቃላይ ሂደት። [wrap] የአገልግሎት ጥያቄ መቀበል [wrap] የቀረቡ ሰነዶችን ማጣራት? [wrap] የቢሮ ምርመራ ማካሄድ [wrap] የክፍያ ትእዛዝ ማውጣት [wrap] ፈቃዱን ማተም [wrap] ለተገልጋዩ መስጠት";

  return {
    steps: greeting + workflowContent,
  };
}
