/**
 * @fileOverview ITDB Bureau Service Registry (Knowledge Base)
 * Transcribed from Bureau institutional documentation.
 * Structured for "Start -> [Steps] -> End" logic.
 */

export interface BureauService {
  title: string;
  workflow: string;
}

export const BUREAU_SERVICES_REGISTRY: BureauService[] = [
  {
    title: "የኢኖቬሽንና ቴክኖሎጂ ጥናትና ምርምር",
    workflow: "Start [wrap] የቴክኖሎጂ ጥናትና ምርምር ፍላጎት መቀበል [wrap] ፍላጎት መለየት [wrap] የጥናት ፕሮፖዛል ማዘጋጀት [wrap] ፕሮፖዛል ማጸደቅ [wrap] መረጃ መሰብሰብ [wrap] መረጃዎችን መተንተን [wrap] የጥናት ውጤቱን ለውይይት ማቅረብ [wrap] ሰነዱን ማጠናቀቅ [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ማማከር አገልግሎት",
    workflow: "Start [wrap] የቴክኖሎጂ ማማከር ጥያቄ መቀበል [wrap] ፍላጎት መለየት [wrap] ባለሙያ መመደብ [wrap] የማማከር ስራ መስራት [wrap] ሪፖርት ማቅረብ [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ሽግግር ድጋፍ",
    workflow: "Start [wrap] የቴክኖሎጂ ሽግግር ጥያቄ መቀበል [wrap] ፍላጎት መለየት [wrap] የቴክኖሎጂ አይነት መለየት [wrap] የድጋፍ አይነት መለየት [wrap] ድጋፍ መስጠት [wrap] End"
  },
  {
    title: "የሶፍትዌር አቅም ግንባታ",
    workflow: "Start [wrap] የጥያቄ መቀበል [wrap] ፍላጎት መለየት [wrap] የሥልጠና ሰነድ ማዘጋጀት [wrap] ሥልጠና መስጠት [wrap] ምዘና ማከናወን [wrap] End"
  },
  {
    title: "የከተማ አቀፍ የመረጃ ቋት ማልማት",
    workflow: "Start [wrap] የደንበኛ ጥያቄ መቀበል [wrap] ፍላጎት መሰብሰብ [wrap] የንድፍ ዲዛይን ማዘጋጀት [wrap] መረጃ ቋቱን ማልማት [wrap] ፍተሻ ማከናወን [wrap] ሪክክብ ማድረግ [wrap] End"
  },
  {
    title: "የሳይበር ደህንነት ክትትል",
    workflow: "Start [wrap] ጥያቄ መቀበል [wrap] ስጋቶችን መለየት [wrap] ክትትል ማድረግ [wrap] ምላሽ መስጠት [wrap] ሪፖርት ማቅረብ [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ሙያ ፈቃድ መስጠት",
    workflow: "Start [wrap] ማመልከቻ መቀበል [wrap] መስፈርት ማረጋገጥ [wrap] ፈተና መስጠት [wrap] ፈቃድ ማዘጋጀት [wrap] ፈቃድ መስጠት [wrap] End"
  },
  {
    title: "የኢንፎርሜሽን ቴክኖሎጂ ኦዲት",
    workflow: "Start [wrap] የኦዲት እቅድ ማውጣት [wrap] መረጃ መሰብሰብ [wrap] ፍተሻ ማካሄድ [wrap] ግኝቶችን ማሳወቅ [wrap] ማጠቃለያ ሪፖርት [wrap] End"
  },
  {
    title: "የሃርድዌር ጥገና ድጋፍ",
    workflow: "Start [wrap] የጥገና ጥያቄ መቀበል [wrap] ብልሽት መለየት [wrap] ጥገና ማከናወን [wrap] ፍተሻ ማድረግ [wrap] ርክክብ [wrap] End"
  },
  {
    title: "የኔትወርክ ዝርጋታ",
    workflow: "Start [wrap] የሳይት ሰርቬይ ማድረግ [wrap] ዲዛይን ማዘጋጀት [wrap] ግብዓት ማቅረብ [wrap] ዝርጋታ ማከናወን [wrap] ኮንፊግሬሽን መስራት [wrap] End"
  }
];

/**
 * Looks up a service in the registry by title (fuzzy matching).
 */
export function findServiceInRegistry(title: string): string | null {
  const normalizedSearch = title.toLowerCase().trim();
  if (!normalizedSearch) return null;
  
  const match = BUREAU_SERVICES_REGISTRY.find(s => 
    s.title.toLowerCase().includes(normalizedSearch) || 
    normalizedSearch.includes(s.title.toLowerCase())
  );
  return match ? match.workflow : null;
}
