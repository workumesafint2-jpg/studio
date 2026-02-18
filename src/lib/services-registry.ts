/**
 * @fileOverview ITDB Bureau Service Registry (Knowledge Base)
 * Contains predefined 'Command Modeler' workflows for 50 institutional services.
 */

export interface BureauService {
  title: string;
  workflow: string;
}

export const BUREAU_SERVICES_REGISTRY: BureauService[] = [
  {
    title: "ጥናትና ምርምር ማድረግ",
    workflow: "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ [wrap] የጥናት ርዕስ መምረጥ [wrap] የመረጃ አሰባሰብ ዘዴ መቀረጽ [wrap] መረጃ መሰብሰብ [wrap] መረጃውን መተንተን [wrap] የጥናት ሪፖርት ማዘጋጀት [wrap] ማጠናቀቅ"
  },
  {
    title: "አዲስ የቴክኖሎጂ ፈጠራ መመዝገብ",
    workflow: "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ [wrap] የፈጠራ ማመልከቻ መቀበል [wrap] የፈጠራው ዓይነት ተለይቷል? [wrap] ቴክኒካዊ ግምገማ ማካሄድ [wrap] የባለቤትነት ማረጋገጫ መስጠት [wrap] መዝገብ ላይ ማስፈር [wrap] ማጠናቀቅ"
  },
  {
    title: "የመረጃ መረብ ደህንነት ፍተሻ",
    workflow: "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ [wrap] የፍተሻ ጥያቄ መቀበል [wrap] ሲስተሙን መፈተሽ [wrap] ክፍተት ተገኝቷል? [wrap] የማስተካከያ እርምጃ መውሰድ [wrap] የደህንነት ማረጋገጫ መስጠት [wrap] ማጠናቀቅ"
  },
  {
    title: "የሶፍትዌር ልማት ፈቃድ መስጠት",
    workflow: "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ [wrap] ማመልከቻ መቀበል [wrap] ሰነዱ ተሟልቷል? [wrap] የክህሎት ምዘና ማካሄድ [wrap] የፈቃድ ክፍያ መፈጸም [wrap] ፈቃድ መስጠት [wrap] ማጠናቀቅ"
  },
  {
    title: "የመንግስት ድረ-ገጾች ኦዲት",
    workflow: "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ [wrap] ኦዲት የሚደረግ ድረ-ገጽ መለየት [wrap] የይዘት እና የቴክኒክ ኦዲት [wrap] ግኝቶችን ማጠቃለል [wrap] የማሻሻያ ሪፖርት መላክ [wrap] ክትትል ማድረግ [wrap] ማጠናቀቅ"
  },
  // Add more services here (up to 50 total)
  {
    title: "የአይቲ ስልጠና መስጠት",
    workflow: "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ [wrap] የሰልጣኞች ፍላጎት መለየት [wrap] የስልጠና ሞጁል ማዘጋጀት [wrap] ስልጠናውን መስጠት [wrap] ምዘና ማካሄድ [wrap] የምስክር ወረቀት መስጠት [wrap] ማጠናቀቅ"
  },
  {
    title: "የዳታ ሴንተር አገልግሎት",
    workflow: "ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ [wrap] የአገልግሎት ጥያቄ መቀበል [wrap] የሀብት አቅርቦት ማረጋገጥ [wrap] ሰርቨር ኮንፊገር ማድረግ [wrap] ደህንነት ማረጋገጥ [wrap] አገልግሎቱን ማስጀመር [wrap] ማጠናቀቅ"
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
