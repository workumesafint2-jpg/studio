/**
 * @fileOverview ITDB Bureau Service Registry (Knowledge Base)
 * Contains 50+ predefined 'Command Modeler' workflows for institutional services.
 * Structured for "Start -> [Steps] -> End" logic.
 */

export interface BureauService {
  title: string;
  workflow: string;
}

export const BUREAU_SERVICES_REGISTRY: BureauService[] = [
  {
    title: "ጥናትና ምርምር ማድረግ",
    workflow: "Start [wrap] የጥናት ርዕስ መምረጥ [wrap] የመረጃ አሰባሰብ ዘዴ መቀረጽ [wrap] መረጃ መሰብሰብ [wrap] መረጃውን መተንተን [wrap] የጥናት ሪፖርት ማዘጋጀት [wrap] End"
  },
  {
    title: "አዲስ የቴክኖሎጂ ፈጠራ መመዝገብ",
    workflow: "Start [wrap] የፈጠራ ማመልከቻ መቀበል [wrap] ቴክኒካዊ ግምገማ ማካሄድ [wrap] አዋጭ ነው? [wrap] የባለቤትነት ማረጋገጫ መስጠት [wrap] መዝገብ ላይ ማስፈር [wrap] End"
  },
  {
    title: "የመረጃ መረብ ደህንነት ፍተሻ",
    workflow: "Start [wrap] የፍተሻ ጥያቄ መቀበል [wrap] ሲስተሙን መፈተሽ [wrap] ክፍተት ተገኝቷል? [wrap] የማስተካከያ እርምጃ መውሰድ [wrap] የደህንነት ማረጋገጫ መስጠት [wrap] End"
  },
  {
    title: "የሶፍትዌር ልማት ፈቃድ መስጠት",
    workflow: "Start [wrap] ማመልከቻ መቀበል [wrap] ሰነዱ ተሟልቷል? [wrap] የክህሎት ምዘና ማካሄድ [wrap] የፈቃድ ክፍያ መፈጸም [wrap] ፈቃድ መስጠት [wrap] End"
  },
  {
    title: "የመንግስት ድረ-ገጾች ኦዲት",
    workflow: "Start [wrap] ኦዲት የሚደረግ ድረ-ገጽ መለየት [wrap] የይዘት እና የቴክኒክ ኦዲት [wrap] ግኝቶችን ማጠቃለል [wrap] የማሻሻያ ሪፖርት መላክ [wrap] ክትትል ማድረግ [wrap] End"
  },
  {
    title: "የአይቲ ስልጠና መስጠት",
    workflow: "Start [wrap] የሰልጣኞች ፍላጎት መለየት [wrap] የስልጠና ሞጁል ማዘጋጀት [wrap] ስልጠናውን መስጠት [wrap] ምዘና ማካሄድ [wrap] የምስክር ወረቀት መስጠት [wrap] End"
  },
  {
    title: "የዳታ ሴንተር አገልግሎት",
    workflow: "Start [wrap] የአገልግሎት ጥያቄ መቀበል [wrap] የሀብት አቅርቦት ማረጋገጥ [wrap] ሰርቨር ኮንፊገር ማድረግ [wrap] ደህንነት ማረጋገጥ [wrap] አገልግሎቱን ማስጀመር [wrap] End"
  },
  {
    title: "የቴክኒክ ድጋፍ መስጠት",
    workflow: "Start [wrap] የድጋፍ ጥያቄ መቀበል [wrap] ችግሩን መለየት [wrap] መፍትሄ መስጠት [wrap] ደንበኛው ረክቷል? [wrap] ጥያቄውን መዝጋት [wrap] End"
  },
  {
    title: "የኔትወርክ ዝርጋታ ፈቃድ",
    workflow: "Start [wrap] የዝርጋታ ዲዛይን መቀበል [wrap] ሳይት ሰርቬይ ማካሄድ [wrap] ስታንዳርድ አሟልቷል? [wrap] የዝርጋታ ፈቃድ መስጠት [wrap] ክትትል ማድረግ [wrap] End"
  },
  {
    title: "የዲጂታል መታወቂያ ምዝገባ",
    workflow: "Start [wrap] የግል መረጃ መቀበል [wrap] ባዮሜትሪክ መረጃ መውሰድ [wrap] መረጃ ማረጋገጥ [wrap] መታወቂያ ማተም [wrap] ለባለቤቱ መስጠት [wrap] End"
  },
  {
    title: "የቢሮ ሪፎርም ትግበራ",
    workflow: "Start [wrap] ወቅታዊ ሁኔታን መገምገም [wrap] የማሻሻያ ነጥቦችን መለየት [wrap] የሪፎርም ሰነድ ማዘጋጀት [wrap] ሰነዱ ጸድቋል? [wrap] ትግበራ መጀመር [wrap] End"
  },
  {
    title: "የአይቲ ግዥ ማማከር",
    workflow: "Start [wrap] የግዥ ፍላጎት መቀበል [wrap] ስፔስፊኬሽን ማዘጋጀት [wrap] የገበያ ጥናት ማካሄድ [wrap] አዋጭ ግዥ መለየት [wrap] የቴክኒክ ምክረ-ሀሳብ መላክ [wrap] End"
  },
  {
    title: "የኢኖቬሽን ማዕከል ምዝገባ",
    workflow: "Start [wrap] የማዕከሉን መረጃ መቀበል [wrap] የመሰረተ ልማት ፍተሻ [wrap] መስፈርቱን ያሟላል? [wrap] የዕውቅና ምስክር ወረቀት [wrap] End"
  },
  {
    title: "የሲስተም ልማት ጥያቄ",
    workflow: "Start [wrap] የሲስተም ፍላጎት ጥናት [wrap] የዲዛይን ሰነድ ማዘጋጀት [wrap] ኮዲንግ መጀመር [wrap] ቴስቲንግ ማካሄድ [wrap] ወደ ስራ ማስገባት [wrap] End"
  },
  {
    title: "የክላውድ አገልግሎት ኪራይ",
    workflow: "Start [wrap] የፍላጎት መጠን መለየት [wrap] የዋጋ ዝርዝር ማቅረብ [wrap] ውል መፈረም [wrap] አካውንት መክፈት [wrap] ድጋፍ መስጠት [wrap] End"
  },
  {
    title: "የሳይበር ደህንነት ስልጠና",
    workflow: "Start [wrap] የሰልጣኞች ዝርዝር መለየት [wrap] የጥቃት አይነቶች ማስተማር [wrap] የመከላከያ ዘዴዎች [wrap] የተግባር ልምምድ [wrap] ማጠቃለያ [wrap] End"
  },
  {
    title: "የሃርድዌር ጥገና አገልግሎት",
    workflow: "Start [wrap] የተበላሸ እቃ መቀበል [wrap] ብልሽቱን መለየት [wrap] ጥገና ማካሄድ [wrap] በደንብ ይሰራል? [wrap] ለባለቤቱ ማስረከብ [wrap] End"
  },
  {
    title: "የመረጃ አያያዝ መመሪያ",
    workflow: "Start [wrap] መመሪያውን ማርቀቅ [wrap] ባለድርሻ አካላት መወያየት [wrap] ግብዓት ማካተት [wrap] ማጽደቅ [wrap] ለስራ ክፍሎች ማሰራጨት [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ኤግዚቢሽን ዝግጅት",
    workflow: "Start [wrap] የዝግጅት ዕቅድ ማውጣት [wrap] ተሳታፊዎችን መጋበዝ [wrap] ቦታ ማዘጋጀት [wrap] ኤግዚቢሽኑን ማካሄድ [wrap] ግምገማ መስራት [wrap] End"
  },
  {
    title: "የሶፍትዌር ኦዲት",
    workflow: "Start [wrap] የኦዲት ዝርዝር ማውጣት [wrap] የኮድ ጥራት መፈተሽ [wrap] የደህንነት ክፍተት ፍተሻ [wrap] የኦዲት ሪፖርት [wrap] End"
  },
  {
    title: "የመረጃ ልውውጥ ስታንዳርድ",
    workflow: "Start [wrap] የስታንዳርድ አስፈላጊነት [wrap] የቴክኒክ ሰነድ ማዘጋጀት [wrap] የሙከራ ትግበራ [wrap] ማጽደቅ [wrap] ስራ ላይ ማዋል [wrap] End"
  },
  {
    title: "የስራ ፍሰት ማሻሻል",
    workflow: "Start [wrap] ነባር ፍሰት መተንተን [wrap] ማነቆዎችን መለየት [wrap] አዲስ ፍሰት መንደፍ [wrap] በዲጂታል ሲስተም መተካት [wrap] End"
  },
  {
    title: "የአይቲ ስትራቴጂ ዝግጅት",
    workflow: "Start [wrap] ተልዕኮና ራዕይ መለየት [wrap] የቴክኖሎጂ አዝማሚያ ጥናት [wrap] ግቦችን ማስቀመጥ [wrap] የትግበራ ዕቅድ [wrap] End"
  },
  {
    title: "የዳታ ጥራት ቁጥጥር",
    workflow: "Start [wrap] መረጃ መሰብሰብ [wrap] ስህተቶችን መለየት [wrap] መረጃውን ማጽዳት [wrap] ትክክለኛነቱን ማረጋገጥ [wrap] መዝገብ ላይ መጫን [wrap] End"
  },
  {
    title: "የአገልጋይ (Server) ቁጥጥር",
    workflow: "Start [wrap] የሲስተም ጤንነት ፍተሻ [wrap] የሀብት አጠቃቀም [wrap] የደህንነት መዝገብ [wrap] ጥገና ካስፈለገ [wrap] ሪፖርት ማቅረብ [wrap] End"
  },
  {
    title: "የሞባይል መተግበሪያ ልማት",
    workflow: "Start [wrap] የተጠቃሚ ፍላጎት [wrap] የፕሮቶታይፕ ዲዛይን [wrap] ልማት መጀመር [wrap] በሞባይል መፈተሽ [wrap] ስራ ላይ ማዋል [wrap] End"
  },
  {
    title: "የድረ-ገጽ ማስተናገጃ (Hosting)",
    workflow: "Start [wrap] የጎራ ስም መመዝገብ [wrap] ፋይሎችን መጫን [wrap] ዳታቤዝ ማገናኘት [wrap] የደህንነት ሰርተፍኬት [wrap] ስራ ማስጀመር [wrap] End"
  },
  {
    title: "የአይቲ ፖሊሲ ክትትል",
    workflow: "Start [wrap] ፖሊሲዎችን መከለስ [wrap] ተገዥነትን መፈተሽ [wrap] ክፍተቶችን መለየት [wrap] የማስተካከያ ምክር [wrap] End"
  },
  {
    title: "የመረጃ ምትኬ (Backup)",
    workflow: "Start [wrap] አስፈላጊ መረጃ መለየት [wrap] የምትኬ ቦታ መምረጥ [wrap] ምትኬ መውሰድ [wrap] በትክክል ተቀምጧል? [wrap] ማረጋገጫ መስጠት [wrap] End"
  },
  {
    title: "የሶፍትዌር ስልጠና",
    workflow: "Start [wrap] ሰልጣኞችን መመዝገብ [wrap] የማስተማሪያ ላብ ማዘጋጀት [wrap] ስልጠናውን መስጠት [wrap] ፈተና መፈተን [wrap] ምስክር ወረቀት [wrap] End"
  },
  {
    title: "የሃርድዌር ስፔስፊኬሽን",
    workflow: "Start [wrap] የተጠቃሚ ፍላጎት [wrap] የቴክኒክ ዝርዝር ማውጣት [wrap] ጥራት ማረጋገጥ [wrap] ለግዥ መላክ [wrap] End"
  },
  {
    title: "የዲጂታል መዝገብ አያያዝ",
    workflow: "Start [wrap] ወረቀቶችን መቃኘት (Scan) [wrap] ኢንዴክስ ማድረግ [wrap] በሲስተም መጫን [wrap] ደህንነት ማረጋገጥ [wrap] End"
  },
  {
    title: "የአይቲ ድንገተኛ አደጋ ዝግጁነት",
    workflow: "Start [wrap] አደጋዎችን መለየት [wrap] የመከላከያ ዕቅድ [wrap] የመልሶ ማቋቋም ልምምድ [wrap] ሰነዱን ማዘመን [wrap] End"
  },
  {
    title: "የመረጃ ደህንነት ግንዛቤ",
    workflow: "Start [wrap] የግንዛቤ ነጥቦች [wrap] ሴሚናር ማዘጋጀት [wrap] መረጃዎችን ማሰራጨት [wrap] ውጤቱን መገምገም [wrap] End"
  },
  {
    title: "የስርዓት (System) ማሻሻያ",
    workflow: "Start [wrap] ማሻሻያ ነጥቦችን መለየት [wrap] አዲስ ፊውቸር ማበልጸግ [wrap] መፈተሽ (Testing) [wrap] አሰማራ (Deploy) [wrap] End"
  },
  {
    title: "የቪዲዮ ኮንፈረንስ ድጋፍ",
    workflow: "Start [wrap] የስብሰባ ሰዓት መያዝ [wrap] ሊንክ መላክ [wrap] የድምጽና ምስል ፍተሻ [wrap] ስብሰባውን መምራት [wrap] End"
  },
  {
    title: "የአይቲ ንብረት ቆጠራ",
    workflow: "Start [wrap] የንብረት ዝርዝር [wrap] ሁኔታውን መፈተሽ [wrap] ባርኮድ መለጠፍ [wrap] ሲስተም ላይ ማዘመን [wrap] End"
  },
  {
    title: "የዳታቤዝ አስተዳደር",
    workflow: "Start [wrap] አፈጻጸምን መከታተል [wrap] የመረጃ ደህንነት [wrap] ምትኬ መውሰድ [wrap] ኦፕቲማይዝ ማድረግ [wrap] End"
  },
  {
    title: "የኢሜይል አገልግሎት",
    workflow: "Start [wrap] አካውንት መፍጠር [wrap] የይለፍ ቃል መስጠት [wrap] ደህንነት ማዋቀር [wrap] አጠቃቀም ማስተማር [wrap] End"
  },
  {
    title: "የመረጃ ስርጭት ቁጥጥር",
    workflow: "Start [wrap] የሚወጡ መረጃዎች [wrap] ሚስጥራዊነት ማረጋገጥ [wrap] ፍቃድ መስጠት [wrap] ስርጭቱን መመዝገብ [wrap] End"
  },
  {
    title: "የቴክኖሎጂ ሽግግር",
    workflow: "Start [wrap] አዲስ ቴክኖሎጂ መለየት [wrap] የክህሎት ሽግግር [wrap] ሙከራ ማካሄድ [wrap] ሙሉ በሙሉ መጠቀም [wrap] End"
  },
  {
    title: "የአሰራር ስታንዳርድ (SOP)",
    workflow: "Start [wrap] ተግባራትን መለየት [wrap] የፍሰት ካርታ [wrap] ኃላፊነት መለየት [wrap] ማጽደቅ [wrap] ስራ ላይ ማዋል [wrap] End"
  },
  {
    title: "የኦፕን ሶርስ አጠቃቀም",
    workflow: "Start [wrap] ተስማሚ ሶፍትዌር መፈለግ [wrap] ማበጀት (Customize) [wrap] መፈተሽ [wrap] ስራ ላይ ማዋል [wrap] End"
  },
  {
    title: "የዲጂታል ፊርማ አጠቃቀም",
    workflow: "Start [wrap] ፊርማ ማመንጨት [wrap] ማንነት ማረጋገጥ [wrap] ሰነድ ላይ መፈረም [wrap] ትክክለኛነት መፈተሽ [wrap] End"
  },
  {
    title: "የቴክኖሎጂ አማካሪ ኮሚቴ",
    workflow: "Start [wrap] አባላትን መምረጥ [wrap] አጀንዳ ማዘጋጀት [wrap] ውይይት ማካሄድ [wrap] የውሳኔ ምክረ-ሀሳብ [wrap] End"
  },
  {
    title: "የኢ-መንግስት (e-Gov) ትግበራ",
    workflow: "Start [wrap] አገልግሎቶችን መለየት [wrap] ወደ ዲጂታል መቀየር [wrap] ፖርታል ላይ መጫን [wrap] ለህዝብ ማሳወቅ [wrap] End"
  },
  {
    title: "የአይቲ በጀት ዝግጅት",
    workflow: "Start [wrap] የፕሮጀክቶች ዝርዝር [wrap] የወጪ ግምት [wrap] ቅድሚያ የሚሰጣቸው [wrap] ለቢሮው ማቅረብ [wrap] End"
  },
  {
    title: "የመረጃ ትንተና ሪፖርት",
    workflow: "Start [wrap] ጥሬ መረጃ መሰብሰብ [wrap] ስታቲስቲካዊ ትንተና [wrap] ግኝቶችን መለየት [wrap] የውሳኔ ሀሳብ [wrap] End"
  },
  {
    title: "የሲስተም ኢንተግሬሽን",
    workflow: "Start [wrap] የሚገናኙ ሲስተሞች [wrap] ኤፒአይ (API) መንደፍ [wrap] መረጃ ማመሳሰል [wrap] በትክክል ይሰራል? [wrap] End"
  },
  {
    title: "የአይቲ ደህንነት ፖሊሲ",
    workflow: "Start [wrap] አደጋዎችን መገምገም [wrap] መመሪያዎችን ማውጣት [wrap] ለሰራተኞች ማሳወቅ [wrap] ተፈጻሚነትን መከታተል [wrap] End"
  }
];

/**
 * Looks up a service in the registry by title (fuzzy matching).
 */
export function findServiceInRegistry(title: string): string | null {
  const normalizedSearch = title.toLowerCase().trim();
  const match = BUREAU_SERVICES_REGISTRY.find(s => 
    s.title.toLowerCase().includes(normalizedSearch) || 
    normalizedSearch.includes(s.title.toLowerCase())
  );
  return match ? match.workflow : null;
}
