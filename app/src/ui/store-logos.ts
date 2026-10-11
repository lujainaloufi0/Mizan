/**
 * Official supermarket logos, for stores you have permission to show.
 *
 * Logos are the stores' trademarks, so none ship with Mizan. To add one:
 *   1. put the image in assets/stores/ (square PNG, ~192×192, transparent or white background)
 *   2. map it below, e.g.  carrefour: require('../../assets/stores/carrefour.png'),
 * Every screen that shows the store (store picker, budget card, list) picks it up.
 * Stores without a logo show a monogram tile in the store's colour.
 */
import type { ImageSourcePropType } from 'react-native';
import type { StoreId } from '@/lib/types';

export const STORE_LOGOS: Partial<Record<StoreId, ImageSourcePropType>> = {};
