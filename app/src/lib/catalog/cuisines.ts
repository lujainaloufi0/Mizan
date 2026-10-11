import type { CuisineId } from '../types';

/** Kitchens, in the order the weekly picker shows them (home cooking first). */
export const CUISINES: { id: CuisineId; name: string; hint: string }[] = [
  { id: 'saudi', name: 'سعودي', hint: 'كبسة، جريش، مرقوق' },
  { id: 'yemeni', name: 'يمني', hint: 'مندي، سلتة، زربيان' },
  { id: 'gulf', name: 'خليجي', hint: 'مجبوس، ثريد، صالونة' },
  { id: 'levant', name: 'شامي', hint: 'مقلوبة، شاورما، فتة' },
  { id: 'egyptian', name: 'مصري', hint: 'كشري، ملوخية، فول' },
  { id: 'moroccan', name: 'مغربي', hint: 'طاجين، كسكس، حريرة' },
  { id: 'turkish', name: 'تركي', hint: 'منمن، كفتة أضنة، لحم بعجين' },
  { id: 'persian', name: 'إيراني', hint: 'جوجه كباب، قورمه سبزي' },
  { id: 'indian', name: 'هندي وباكستاني', hint: 'برياني، بتر تشكن، دال' },
  { id: 'italian', name: 'إيطالي', hint: 'باستا، لازانيا، ريزوتو' },
  { id: 'mexican', name: 'مكسيكي', hint: 'تاكو، فاهيتا، بوريتو' },
  { id: 'american', name: 'أمريكي', hint: 'برجر، ماك آند تشيز، بانكيك' },
  { id: 'chinese', name: 'صيني', hint: 'رز مقلي، كونغ باو' },
  { id: 'japanese', name: 'ياباني', hint: 'ترياكي، كاتسو، غيودون' },
  { id: 'korean', name: 'كوري', hint: 'بيبيمباب، بولغوغي' },
  { id: 'thai', name: 'تايلندي', hint: 'كاري أخضر، باد تاي' },
  { id: 'greek', name: 'يوناني', hint: 'سوفلاكي، مسقعة' },
  { id: 'european', name: 'أوروبي', hint: 'باييا، راتاتوي' },
];

export const CUISINE_BY_ID = Object.fromEntries(CUISINES.map((c) => [c.id, c])) as Record<CuisineId, (typeof CUISINES)[number]>;
