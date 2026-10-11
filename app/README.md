# مِيزان · Mizan for Android

خطة وجبات أسبوعية ومقاضي بميزانيتك من كارفور وبنده والعثيم والدانوب والتميمي ولولو، بالريال السعودي.

Built with Expo (SDK 57) and React Native 0.86, with expo-router, Reanimated 4, Gesture Handler, expo-haptics, expo-audio and Lucide line icons. Typography is Thmanyah, the layout is dark, and spacing follows an 8pt grid.

## Run it

```bash
npm install
npx expo start          # press "a" for an Android emulator, or scan the QR with Expo Go
```

To get an installable APK, build it in the cloud:

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview      # APK to share and install
npx eas-cli@latest build -p android --profile production   # .aab for Google Play
```

Checks — run `npm run check` before every release. It runs:
- `tsc --noEmit` (types) and `expo lint`
- `jest` — the recipe catalog integrity checks, cuisine planning rules, and end-to-end flows rendered in the **Android** environment (`tests/`): first run, weekly plan with cuisines, every tab, cook/undo, swap, ban/undo, shopping list and delivery apps, repeat with leftovers, reset, and loading an older saved profile
- `scripts/check-worklets.js` — fails if any animation worklet calls a plain JS function. That works in the web preview but **crashes on a phone** (worklets run on the UI thread), so compute values outside `useAnimatedStyle` / gesture callbacks.

## How it works

| Moment | What the user does | Where |
|---|---|---|
| Once | One question per screen: goal (متوازن · عالي البروتين · تنشيف · تضخيم), allergies, appliances, always-have staples. Every screen skippable; saved on the phone. Dislikes aren't asked: ban a dish from its card (restore it in ملفي) | `src/app/welcome.tsx` |
| Every week | 4 short steps, pre-filled from last week: kitchens (one cuisine, several, or a mix) → stores → household and SAR budget → days/meals (+ optional leftovers), then a build checklist and a "أسبوعك جاهز" summary | `src/app/new-week.tsx` |
| Home | Today's meals, budget vs. spent and saved, export, **one-tap repeat** | `src/app/(tabs)/index.tsx` |
| Repeat | Leftovers check-in sheet subtracts what's still in the kitchen from the new list and shows SAR saved | `src/features/RepeatBanner.tsx` |
| Cooking | «تم الطبخ» deducts ingredients from في مطبخي, fills the weekly ring, and can be undone | `src/features/RecipeCard.tsx` |
| Swap / ban | 3 instant alternatives (grocery list re-syncs); ⃠ bans a dish forever, with undo | `RecipeCard.tsx`, `store/mizan.ts` |
| Shopping | Aisle-sorted list with ticks; «أرسل للتوصيل» copies the list and opens Nana, Ninja, HungerStation, ToYou, Keeta, Jahez or Mrsool (Play Store page if not installed); plus copy by aisle/store and the share sheet | `src/app/(tabs)/list.tsx`, `src/features/SendToDelivery.tsx` |
| ملفي | Edit the permanent profile any time; sound and haptics toggles; reset | `src/app/(tabs)/profile.tsx` |

```
src/
  app/        routes (expo-router): welcome, new-week, (tabs)/index|week|list|profile
  features/   screen-level pieces: RecipeCard, RepeatBanner, BudgetCard, LeftoversList, pickers, export
  lib/        pure TypeScript engine shared with the web prototype: data, planner (pricing, swaps, leftovers), formatting
  store/      zustand + AsyncStorage: permanent profile, current week, last week
  ui/         design system: theme tokens, kit (Tap, Button, Chip, Stepper, Ring…), Sheet/Toast, Slider, icons, feel (haptics + sound)
```

**Recipes:** 163 halal dishes from 18 kitchens (Saudi, Yemeni, Gulf, Levantine, Egyptian, Moroccan, Turkish, Persian, Indian/Pakistani, Italian, Mexican, American, Chinese, Japanese, Korean, Thai, Greek, European) over 128 priced ingredients, in `src/lib/catalog/`. Each recipe is one compact row (see `define.ts`): ingredients per serving, protein/carbs/fat (calories are derived), steps and a coach tip. `tests/catalog.test.tsx` checks every row: known ingredients, unique ids, plausible macros, halal, enough dishes per kitchen and per allergy.

**Cuisines** shape each week: chosen kitchens first, then (only when the budget or a small kitchen needs it) dishes from other kitchens. Every new week gets its own seed, so weeks vary; a week never reshuffles once made. Over budget, dishes are swapped for the next-cheaper dish from the same kitchens before variety is reduced.

**Delivery apps** are listed in `src/features/delivery-apps.json` (verified Android package IDs). `plugins/with-delivery-app-queries.js` declares exactly those packages in the Android manifest so the app can open them on Android 11+. Installed apps show their real icon, read from the phone.

**Store logos:** official logos are the stores' trademarks, so none ship with the app; each store shows a monogram in its colour. If you have permission to use a logo, put a square PNG in `assets/stores/` and map it in `src/ui/store-logos.ts`; it appears everywhere that store is shown.

**Goals** narrow the weekly rotation to the best-fitting ~60% of safe dishes (never fewer than 4 mains / 3 breakfasts), and «تضخيم» makes adult portions 25% bigger. The week view shows protein and calories per adult per day; swaps mark dishes that fit the goal. See `goalPool` / `servingsFor` / `nutritionFor` in `src/lib/planner.ts`.

**Motion** is deliberately quiet (`src/ui/motion.ts`): things fade instead of sliding, nothing bounces, presses sink to 0.98, state changes take 180 ms, and every animation respects Android's "Remove animations" setting.

**Notes**
- RTL is forced natively through the `expo-localization` plugin (`forcesRTL`). After changing it, rebuild the app; Expo Go may need a restart.
- Prices and weekly deals are sample data in `src/lib/data.ts`. Live supermarket prices need a backend feed.
- Sounds are small bundled WAVs in `assets/sounds`. Both sounds and haptics can be turned off in ملفي.
