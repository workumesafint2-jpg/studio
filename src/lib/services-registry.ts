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
    workflow: "Start [wrap] የጥናትና ምርምር ፍላጎት/ጥያቄ መቀበል [wrap] ፍላጎት/ጥያቄው መለየት [wrap] ጥያቄው በቢሮው ወስጥ ወይም በሌላ አካል የሚሰራ መሆኑን? [wrap] በጥናት ርዕስ መለየት [wrap] የጥናት ፕሮፖዛል ማዘጋጀት [wrap] ፕሮፖዛል ማጽደቅ [wrap] የጥናት ቡድን ማዋቀር [wrap] አስፈላጊ የመረጃ መሰብሰቢያ መጠይቆችና ቅጾች ማዘጋጀት [wrap] መረጃዎቹን መሰብሰብ [wrap] የተሰበሰቡ መረጃዎችን በጥራት ማረጋገጥ [wrap] መረጃዎችን በሶፍትዌር ረዳት ተጠቅሞ መተንተን [wrap] የጥናቱን ውጤት ለውይይት ማቅረብ [wrap] ከውይይት የተገኘውን ግብዓት በማካተት ሰነዱን ማጠናቀቅ [wrap] የጥናቱ ሰነድ ለሚመለከተው አካል ማስተላለፍ [wrap] End"
  },
  {
    title: "የቴክኒክ ምክርና አገልግሎት",
    workflow: "Start [wrap] የጥናትና ምርምር ፍላጎት/ጥያቄ መቀበል [wrap] ፍላጎት/ጥያቄው መለየት [wrap] በጥያቄው መሰረት የምክክር አገልግሎትና ላይ ምክክር ማካሄድ [wrap] የምክክር አገልግሎት ስራ መመሪያ ማዘጋጀት [wrap] በስራ መመሪያው ስራ መስራት ይቻላል? [wrap] በስራ መመሪያው ከሌላ ትብብር ጋር ስራ መስራት [wrap] የምክክር ውጤት በደብዳቤ ለባለድርሻው ጋር መላክ/ማድረስ [wrap] የምክክሩ ሰነድ ለባለድርሻው ማሳወቅ [wrap] End"
  },
  {
    title: "የመረጃ ልማት",
    workflow: "Start [wrap] የቴክኒክ ድጋፍ ጥያቄ መቀበል [wrap] የቴክኒክ ድጋፍ ዝርዝር መለየት [wrap] ብልሽቱን መመርመር [wrap] ጥገናው በቢሮ ወይም በውጪ ድርጅት የሚከናወን መሆኑን መለየት [wrap] ተጠቃሚዎችን ማሳወቅ [wrap] የጥገና ስራውን መስራት [wrap] ጥገናው ተጠናቋል? [wrap] ጥገናው ተጠናቋል የሚል ምላሽ መስጠት [wrap] የጥገናው ውጤት (መረጃ) ለተጠቃሚው ማሳወቅ [wrap] End"
  },
  {
    title: "አመቺ የቴክኖሎጂ ፍለጋ",
    workflow: "Start [wrap] የአመቺ ቴክኖሎጂ ፍላጎት/ጥያቄ መቀበል [wrap] ፍላጎት/ጥያቄው መለየት [wrap] የአመቺ ቴክኖሎጂ ፍላጎት ጥያቄው በቢሮው ውስጥ? [wrap] ፍላጎቱን በሳይት ሰርቬይ ማረጋገጥ [wrap] የቴክኖሎጂ ፍላጎቱን በዝርዝር ማዘጋጀት [wrap] ተስማሚ ቴክኖሎጂ ፍለጋ ማካሄድ [wrap] ተስማሚ ቴክኖሎጂ መለየት [wrap] የቴክኖሎጂ ውጤት ለተጠቃሚው ማሳወቅ [wrap] End"
  },
  {
    title: "የኢኖቬሽንና ቴክኖሎጂ ዕውቅና ማረጋገጫ",
    workflow: "Start [wrap] የዕውቅና ማረጋገጫ ጥያቄ መቀበል [wrap] ጥያቄው መለየት [wrap] የዕውቅና ፍላጎት መለየት [wrap] የዕውቅና መስፈርት ማሟላቱን ማረጋገጥ [wrap] የዕውቅና የምስክር ወረቀት ማዘጋጀት [wrap] የዕውቅና የምስክር ወረቀት መስጠት [wrap] End"
  },
  {
    title: "የኢኖቬሽን ድጋፍ",
    workflow: "Start [wrap] የኢኖቬሽን ድጋፍ ጥያቄ መቀበል [wrap] ጥያቄው መለየት [wrap] የኢኖቬሽን ድጋፍ ፍላጎት መለየት [wrap] የኢኖቬሽን ድጋፍ መስፈርት ማሟላቱን ማረጋገጥ [wrap] የኢኖቬሽን ድጋፍ መስጠት [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ልውውጥ",
    workflow: "Start [wrap] የቴክኖሎጂ ልውውጥ ጥያቄ መቀበል [wrap] ጥያቄው መለየት [wrap] የቴክኖሎጂ ልውውጥ ፍላጎት መለየት [wrap] የቴክኖሎጂ ልውውጥ መስፈርት ማሟላቱን ማረጋገጥ [wrap] የቴክኖሎጂ ልውውጥ መስጠት [wrap] End"
  },
  {
    title: "የአይቲ ስልጠና",
    workflow: "Start [wrap] የስልጠና ፍላጎት መለየት [wrap] የስልጠና ሞጁል ማዘጋጀት [wrap] ስልጠና መስጠት [wrap] ምዘና ማካሄድ [wrap] የምስክር ወረቀት መስጠት [wrap] End"
  },
  {
    title: "የዲጂታል ፊርማ አገልግሎት",
    workflow: "Start [wrap] የፊርማ ጥያቄ መቀበል [wrap] ማንነት ማረጋገጥ [wrap] የዲጂታል ፊርማ ማመንጨት [wrap] ሰነድ ላይ መፈረም [wrap] ትክክለኛነት ማረጋገጥ [wrap] End"
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
