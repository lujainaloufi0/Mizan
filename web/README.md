# مِيزان · Mizan

Weekly meal planning, pantry tracking and grocery budgeting for Saudi households — priced in SAR across Carrefour, Panda, Othaim, Danube, Tamimi and LuLu.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # production build
npm run build:preview  # preview-dist/mizan.html — single self-contained file
```

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 3.4 · Framer Motion · Lucide React.

## Structure

```
tailwind.config.js            8pt grid, Thmanyah families, Obsidian / Mint / Sand tokens
public/fonts/                 Thmanyah woff2 (sans, serif text, serif display)
src/app/                      layout (RTL, Arabic), page, globals.css (@font-face, slider)
src/lib/
  types.ts                    domain types
  data.ts                     stores + weekly deals, ingredients + pack prices, recipes
  planner.ts                  plan engine: scheduling, cheapest-store pricing, budget fitting
  format.ts                   SAR formatting, Arabic count nouns
src/components/
  MizanApp.tsx                wizard → loading → dashboard
  PlanLoader.tsx              deal-checking loading sequence
  onboarding/                 OnboardingWizard + 6 steps
  dashboard/                  FinancialSummary, GroceryList, RecipePlan, RecipeCard
  ui/                         primitives (buttons, stepper, mark), BalanceScale
preview/ + scripts/           standalone single-file preview build
```

## Design rules

- **8pt grid is enforced by the config.** Spacing key `N` = `N × 8px` (`p-2` = 16px, `gap-3` = 24px). No 4/12/20px steps exist. Every font size has an 8-multiple line height. Radii are 8 / 16 / 24 / 32.
- **Type roles:** `font-sans` (thmanyahsans) for UI and numbers, `font-serif` (thmanyahseriftext) for recipe steps and tips, `font-display` (thmanyahserifdisplay) for headlines and hero figures. The Thmanyah fonts render `ر.س` as the new Saudi Riyal symbol.
- **RTL first:** `dir="rtl"`; logical spacing (`ps-`/`pe-`/`ms-`); forward = left.
- **Motion:** springs for selection, ease-out-expo for reveals, `MotionConfig reducedMotion="user"`.

## Visual system

- **Dark palette** — semantic tokens in `tailwind.config.js` (mirrored for SVG in `src/lib/palette.ts`): `canvas #121417`, `surface #1E2228`, `raised`, `line #2A2E39`, `ink`, `sand #E5D4C0` (selection, primary action), `mint #10B981` (money saved, success, cooked), `clay` (warnings, allergies).
- **Icons** — one line-art family at a 1.5px stroke (set once in `globals.css` on `.lucide`): Lucide plus Mizan's own set in `src/components/ui/icons/food.tsx` (onion, garlic, rice, flatbread, cardamom, loomi, oven…). Everything is mapped in `src/components/ui/icon-map.ts`; food icons are coloured by aisle (`AISLE_HUE`).
- **Motion** — shared vocabulary in `primitives.tsx`: `spring` for selection, `barSpring` for progress fills, `press` (`scale: [1, 1.15, 1]`) for counters and confirmations, `easeOut` for reveals. `MotionConfig reducedMotion="user"` respects the OS setting.
- **Sound** — `src/lib/sound.ts` synthesizes tiny cues with the Web Audio API (no audio files): `tick` (counters, chips, tabs), `pop` (swap, copy, ban), `step` (wizard), `success` (finish, تم الطبخ). Quiet by design, started on the first tap, mute toggle in every header (remembered).

## Returning households

- **Home & one-tap repeat** — the last week (settings, exact dish per slot, ticked items) is saved in `localStorage` (`src/lib/storage.ts`, key `mizan:v1`). Returning users land on Home and can repeat it in one tap; prices are recalculated with this week's deals.
- **Swap** — each card's بدّل tray shows the 3 best alternatives, ranked: not already on that day → covered by what the basket already buys → lowest extra cost. Totals and the grocery list update in place.
- **Never suggest again** — 🚫 on a card adds the dish to a permanent blacklist and replaces it everywhere that week (undo in the toast; restore from the المستبعدة menu).
- **Copy list** — copies the items still to buy, grouped by aisle (or by store) as WhatsApp-friendly text (`src/lib/grocery-text.ts`). Falls back to a pre-selected text sheet if the clipboard is blocked.

## Zero-waste loop

- **Kitchen inventory** (`kitchenInventory` in `planner.ts`) = whole packs bought + leftovers carried in − ingredients of meals marked **تم الطبخ**. The grocery panel's **في مطبخي** view shows it live.
- **بواقي الأسبوع** (`estimateLeftovers`): when a new week starts, last week's inventory is offered as leftovers (only food that keeps — see `keepsOf` in `data.ts`). If no meal was marked cooked, the plan is assumed to have been followed.
- Checked leftovers become `prefs.stock`: they are deducted from the new list (partly or fully), the SAR saved is shown, and recipes that use them most (by SAR value) are scheduled first.

## How the plan is priced

1. Servings = adults + ½ × kids (rounded to 0.5).
2. Recipes are rotated across the chosen days and meal slots so dishes don't repeat on the same day.
3. Each ingredient is bought from the cheapest selected store this week (shelf factor × aisle deal), rounded up to whole packs. Pantry items are skipped.
4. **Saved** = average regular shelf price across your selected stores − what you pay.
5. If the basket exceeds the budget, the priciest dish leaves the rotation and the week is rebuilt (floor: 3 mains, 2 breakfasts).

Prices and deals in `data.ts` are prototype values — the next step is swapping them for live store feeds.
