import type { Recipe } from '../../types';
import { AMERICAN } from './american';
import { CHINESE, JAPANESE, KOREAN } from './east-asian';
import { EGYPTIAN } from './egyptian';
import { GULF } from './gulf';
import { INDIAN } from './indian';
import { ITALIAN } from './italian';
import { LEVANT } from './levant';
import { MEXICAN } from './mexican';
import { MOROCCAN } from './moroccan';
import { EUROPEAN, GREEK, THAI } from './more';
import { PERSIAN } from './persian';
import { SAUDI } from './saudi';
import { TURKISH } from './turkish';
import { YEMENI } from './yemeni';

/** Every recipe, home kitchens first. All halal: no pork, no alcohol. */
export const RECIPES: Recipe[] = [
  ...SAUDI,
  ...YEMENI,
  ...GULF,
  ...LEVANT,
  ...EGYPTIAN,
  ...MOROCCAN,
  ...TURKISH,
  ...PERSIAN,
  ...INDIAN,
  ...ITALIAN,
  ...MEXICAN,
  ...AMERICAN,
  ...CHINESE,
  ...JAPANESE,
  ...KOREAN,
  ...THAI,
  ...GREEK,
  ...EUROPEAN,
];
