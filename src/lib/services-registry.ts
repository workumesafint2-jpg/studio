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
  // PART 1
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
  },
  // PART 2 (Institutional Processes)
  {
    title: "የአዋጭነት ጥናት አገልግሎት",
    workflow: "Start [wrap] አዋጭነት ጥያቄ መቀበል [wrap] ፍላጎት መለየት [wrap] መረጃ መሰብሰብ [wrap] መረጃ ማደራጀትና መተንተን [wrap] የጥናት ሰነድ ማዘጋጀት [wrap] ማጸደቅ [wrap] End"
  },
  {
    title: "የፈጠራ ስራዎች ድጋፍ",
    workflow: "Start [wrap] የፈጠራ ሃሳብ መቀበል [wrap] መገምገም [wrap] የሙከራ ስራ መስራት [wrap] የገበያ ትስስር መፍጠር [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ስታንዳርድ ዝግጅት",
    workflow: "Start [wrap] ፍላጎት መለየት [wrap] ረቂቅ ማዘጋጀት [wrap] ግብዓት መሰብሰብ [wrap] ስታንዳርዱን ማጽደቅ [wrap] End"
  },
  {
    title: "የዳታ ማዕከል አገልግሎት",
    workflow: "Start [wrap] የአገልግሎት ጥያቄ መቀበል [wrap] ፍላጎት መለየት [wrap] ሀብት መመደብ [wrap] አገልግሎት መስጠት [wrap] End"
  },
  {
    title: "የስርዓተ-ትምህርት ቴክኖሎጂ ድጋፍ",
    workflow: "Start [wrap] ጥያቄ መቀበል [wrap] የድጋፍ አይነት መለየት [wrap] ባለሙያ መመደብ [wrap] ድጋፍ መስጠት [wrap] End"
  },
  {
    title: "የዲጂታል መፃህፍት አገልግሎት",
    workflow: "Start [wrap] ጥያቄ መቀበል [wrap] የመረጃ ተደራሽነት ማረጋገጥ [wrap] አገልግሎት መስጠት [wrap] End"
  },
  {
    title: "የቴክኒክ ስፔስፊኬሽን ዝግጅት",
    workflow: "Start [wrap] ጥያቄ መቀበል [wrap] ዝርዝር ፍላጎት መለየት [wrap] ስፔስፊኬሽን ማዘጋጀት [wrap] ማጸደቅ [wrap] End"
  },
  {
    title: "የሶፍትዌር ጥራት ፍተሻ",
    workflow: "Start [wrap] የሶፍትዌር ሰነድ መቀበል [wrap] የፍተሻ እቅድ ማውጣት [wrap] ፍተሻ ማካሄድ [wrap] ሪፖርት ማውጣት [wrap] End"
  },
  {
    title: "የቪዲዮ ኮንፈረንስ ድጋፍ",
    workflow: "Start [wrap] የፕሮግራም መርሐ-ግብር መቀበል [wrap] ዝግጅት ማድረግ [wrap] ቁጥጥርና ድጋፍ መስጠት [wrap] End"
  },
  {
    title: "የድረ-ገጽ ማልማት አገልግሎት",
    workflow: "Start [wrap] ፍላጎት መሰብሰብ [wrap] ዲዛይን መስራት [wrap] ኮዲንግ መስራት [wrap] ይዘት መጫን [wrap] ፍተሻና ርክክብ [wrap] End"
  },
  // PART 3 (Advanced Technical & Support Services)
  {
    title: "የቴክኒክ ድጋፍና ጥገና",
    workflow: "Start [wrap] የድጋፍ ጥያቄ መቀበል [wrap] የብልሽት አይነት መለየት [wrap] ባለሙያ መመደብ [wrap] የጥገና ስራ ማከናወን [wrap] ፍተሻ ማድረግ [wrap] ርክክብ [wrap] End"
  },
  {
    title: "የሶፍትዌር ፍቃድ አስተዳደር",
    workflow: "Start [wrap] የፍላጎት ጥያቄ መቀበል [wrap] የፍቃድ አይነት መለየት [wrap] ግዥ መፈጸም [wrap] መጫንና ማዋቀር [wrap] ክትትል ማድረግ [wrap] End"
  },
  {
    title: "የዳታ ማዕከል አስተዳደር",
    workflow: "Start [wrap] የሃብት አጠቃቀም ክትትል [wrap] የደህንነት ፍተሻ [wrap] ባክአፕ መውሰድ [wrap] ማሻሻያዎችን ማድረግ [wrap] End"
  },
  {
    title: "የኢንፎርሜሽን ሲስተም ደህንነት ፍተሻ",
    workflow: "Start [wrap] የፍተሻ እቅድ ማውጣት [wrap] ክፍተቶችን መለየት [wrap] የጥቃት ሙከራ ማድረግ [wrap] የጥገና ምክረ-ሃሳብ ማቅረብ [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ኢንኩቤሽን ድጋፍ",
    workflow: "Start [wrap] የሃሳብ ማመልከቻ መቀበል [wrap] መረጣ ማካሄድ [wrap] የቦታና ግብዓት ማመቻቸት [wrap] ድጋፍና ክትትል [wrap] End"
  },
  {
    title: "የዲጂታል ትራንስፎርሜሽን ምክር",
    workflow: "Start [wrap] ነባራዊ ሁኔታ መገምገም [wrap] የስትራቴጂ ሰነድ ማዘጋጀት [wrap] የቴክኖሎጂ አማራጮችን ማቅረብ [wrap] End"
  },
  {
    title: "የጂአይኤስ (GIS) አገልግሎት",
    workflow: "Start [wrap] የዳታ ጥያቄ መቀበል [wrap] መረጃዎችን መሰብሰብ [wrap] ዳታውን ማቀነባበር [wrap] ካርታ/ሪፖርት ማዘጋጀት [wrap] End"
  },
  {
    title: "የቪዲዮ ኮንፈረንስ ዝግጅት",
    workflow: "Start [wrap] የመርሐ-ግብር ጥያቄ መቀበል [wrap] መስመር መፈተሽ [wrap] ግንኙነት መፍጠር [wrap] ቴክኒካዊ ድጋፍ መስጠት [wrap] End"
  },
  {
    title: "የኮምፒውተር ላብራቶሪ አገልግሎት",
    workflow: "Start [wrap] የተጠቃሚ ምዝገባ [wrap] መመሪያ መስጠት [wrap] የቴክኒክ ክትትል [wrap] ሪፖርት መመዝገብ [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ኤግዚቢሽን ዝግጅት",
    workflow: "Start [wrap] የቲም መረጣ [wrap] የተሳታፊዎች ጥሪ [wrap] የቦታ ዝግጅት [wrap] ዝግጅቱን ማካሄድ [wrap] End"
  },
  {
    title: "የሳይንስና ቴክኖሎጂ ሙዚየም አገልግሎት",
    workflow: "Start [wrap] የጎብኝዎች ምዝገባ [wrap] ገለጻ ማድረግ [wrap] የሙከራ መሳሪያዎች ማሳያ [wrap] End"
  },
  {
    title: "የቴክኒክ ስፔስፊኬሽን ግምገማ",
    workflow: "Start [wrap] የሰነድ መቀበል [wrap] ከመስፈርት ጋር ማነጻጸር [wrap] የውሳኔ ሃሳብ ማቅረብ [wrap] End"
  },
  {
    title: "የቴሌኮም መሰረተ ልማት ክትትል",
    workflow: "Start [wrap] የኔትወርክ ሁኔታ መፈተሽ [wrap] ብልሽት ሪፖርት ማድረግ [wrap] የጥገና ክትትል [wrap] End"
  },
  {
    title: "የኢ-መንግስት (e-Gov) አገልግሎት ድጋፍ",
    workflow: "Start [wrap] የስርዓት መቆራረጥ መከታተል [wrap] የተጠቃሚ ድጋፍ መስጠት [wrap] ማሻሻያ መጠቆም [wrap] End"
  },
  {
    title: "የቴክኖሎጂ አዋጭነት ጥናት (Tech Feasibility)",
    workflow: "Start [wrap] ጥያቄ መቀበል [wrap] የገበያና ቴክኒክ ዳሰሳ [wrap] ወጪና ጥቅምን ማነጻጸር [wrap] ሪፖርት ማቅረብ [wrap] End"
  },
  // PART 4 (Final Institutional & Specialized Support)
  {
    title: "የፈጠራ ባለቤትነት መብት ድጋፍ",
    workflow: "Start [wrap] የፈጠራ ስራውን መመዝገብ [wrap] የመጀመሪያ ደረጃ ፍተሻ [wrap] የህግ ምክር መስጠት [wrap] ከሚመለከተው አካል ጋር ማገናኘት [wrap] End"
  },
  {
    title: "የቴክኖሎጂ የገበያ ትስስር",
    workflow: "Start [wrap] የቴክኖሎጂ ውጤቶችን መለየት [wrap] ገዥዎችን መፈለግ [wrap] የትስስር መድረክ ማዘጋጀት [wrap] End"
  },
  {
    title: "የድህረ-ምረቃ ምርምር ድጋፍ",
    workflow: "Start [wrap] የድጋፍ ጥያቄ መቀበል [wrap] የላብራቶሪ/ዳታ ፈቃድ መስጠት [wrap] የባለሙያ ድጋፍ [wrap] End"
  },
  {
    title: "የክህሎት ማረጋገጫ ምዘና",
    workflow: "Start [wrap] የተመዛኞች ምዝገባ [wrap] የፈተና ዝግጅት [wrap] ምዘና ማካሄድ [wrap] ውጤት ማሳወቅ [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ፖሊሲ ቀረጻ",
    workflow: "Start [wrap] ችግር መለየት [wrap] የልምድ ልውውጥ ማድረግ [wrap] ረቂቅ ማዘጋጀት [wrap] ውይይት ማካሄድ [wrap] ማጽደቅ [wrap] End"
  },
  {
    title: "የጥራት ቁጥጥር ስታንዳርድ",
    workflow: "Start [wrap] የአሰራር ሂደትን መገምገም [wrap] መመሪያ ማዘጋጀት [wrap] ተግባራዊነቱን መከታተል [wrap] End"
  },
  {
    title: "የዳታ ማዕከል ኮሎኬሽን",
    workflow: "Start [wrap] የቦታ ጥያቄ መቀበል [wrap] የመሰረተ ልማት ፍተሻ [wrap] ስምምነት መፈረም [wrap] መሳሪያዎችን መጫን [wrap] End"
  },
  {
    title: "የኔትወርክ ደህንነት አስተዳደር",
    workflow: "Start [wrap] ፋየርዎል ማዋቀር [wrap] የጥቃት ሙከራዎችን መከታተል [wrap] የደህንነት ፖሊሲ ማውጣት [wrap] End"
  },
  {
    title: "የሶፍትዌር ማበልጸጊያ አካባቢ (Sandbox)",
    workflow: "Start [wrap] የፈቃድ ጥያቄ [wrap] ሀብት መመደብ [wrap] የሙከራ ስራ ማከናወን [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ዳታቤዝ አስተዳደር",
    workflow: "Start [wrap] መረጃ መሰብሰብ [wrap] ወደ ስርዓቱ ማስገባት [wrap] ማዘመንና ጥበቃ ማድረግ [wrap] End"
  },
  {
    title: "የቴክኒክ ስልጠና ማስተባበር",
    workflow: "Start [wrap] ፍላጎት መለየት [wrap] አሰልጣኝ መመደብ [wrap] ስልጠናውን መከታተል [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ሽልማት ዝግጅት",
    workflow: "Start [wrap] መስፈርት ማውጣት [wrap] እጩዎችን መቀበል [wrap] ዳኝነት ማካሄድ [wrap] የሽልማት ስነ-ስርዓት [wrap] End"
  },
  {
    title: "የዲጂታል ይዘት ዝግጅት",
    workflow: "Start [wrap] ርዕስ መለየት [wrap] ስክሪፕት ማዘጋጀት [wrap] ቀረጻና ኤዲቲንግ [wrap] ማሰራጨት [wrap] End"
  },
  {
    title: "የቴክኖሎጂ መረጃ ማዕከል",
    workflow: "Start [wrap] መረጃዎችን ማደራጀት [wrap] ለተጠቃሚ ክፍት ማድረግ [wrap] የመረጃ ጥያቄዎችን መመለስ [wrap] End"
  },
  {
    title: "የሲስተም ኢንተግሬሽን አገልግሎት",
    workflow: "Start [wrap] የሚገናኙ ስርዓቶችን መለየት [wrap] ኤፒአይ (API) ማዘጋጀት [wrap] ሙከራ ማድረግ [wrap] ስራ ማስጀመር [wrap] End"
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
