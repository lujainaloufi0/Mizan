/**
 * Grocery list export: clipboard (paste anywhere), straight into a delivery app
 * (copy, then open the app), or the Android share sheet for anything else.
 */
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform, Share } from 'react-native';
import APPS from './delivery-apps.json';
import { groceryText, type ListMode } from '@/lib/grocery-text';
import type { WeeklyPlan } from '@/lib/types';

function textFor(plan: WeeklyPlan, checked: string[], mode: ListMode) {
  // what's still to buy; when everything is ticked, the full list
  const left = plan.grocery.filter((g) => !checked.includes(g.ingredient.id));
  return groceryText(left.length ? left : plan.grocery, mode, { servings: plan.servings, meals: plan.meals.length });
}

export async function copyList(plan: WeeklyPlan, checked: string[], mode: ListMode = 'aisle') {
  await Clipboard.setStringAsync(textFor(plan, checked, mode));
}

export async function shareList(plan: WeeklyPlan, checked: string[], mode: ListMode = 'aisle') {
  try {
    await Share.share({ message: textFor(plan, checked, mode), title: 'مقاضي الأسبوع — مِيزان' });
  } catch {
    /* the user closed the sheet */
  }
}

export type DeliveryApp = (typeof APPS)[number];
export const DELIVERY_APPS: DeliveryApp[] = APPS;

/**
 * Copy the list, then open the delivery app so the user can paste it into the
 * app's search or order notes. If the app isn't installed (or can't be seen),
 * open its Play Store page instead. Returns how the app was opened.
 */
export async function sendToApp(app: DeliveryApp, plan: WeeklyPlan, checked: string[]): Promise<'opened' | 'store' | 'copied'> {
  await copyList(plan, checked);
  if (Platform.OS !== 'android') return 'copied';
  try {
    IntentLauncher.openApplication(app.package);
    return 'opened';
  } catch {
    try {
      await Linking.openURL(`market://details?id=${app.package}`);
    } catch {
      await Linking.openURL(`https://play.google.com/store/apps/details?id=${app.package}`).catch(() => undefined);
    }
    return 'store';
  }
}

/** The app's real icon from the phone (only for installed apps; empty string otherwise). */
export async function installedIcon(app: DeliveryApp): Promise<string> {
  if (Platform.OS !== 'android') return '';
  try {
    return await IntentLauncher.getApplicationIconAsync(app.package);
  } catch {
    return '';
  }
}
