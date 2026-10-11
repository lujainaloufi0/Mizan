# مِيزان · Mizan

A Saudi meal-planning, pantry and grocery-budget app. Pick your supermarkets, your household and a weekly budget in SAR; Mizan plans the week's meals from **163 halal recipes across 18 cuisines**, builds the shopping list sorted by aisle across Carrefour, Panda, Othaim, Danube, Tamimi and LuLu, and tracks what's left in your kitchen.

## Repository layout

```
.
├── app/   Android app: Expo SDK 57, React Native, Reanimated, expo-router (the main product)
└── web/   Web prototype: Next.js, Tailwind, Framer Motion (where the design started)
```

### `app/` — Android (Expo)

| Path | What's there |
|---|---|
| `src/app/` | Screens (expo-router): first-run profile, weekly plan wizard, tabs (home, week, shopping list, profile) |
| `src/features/` | Recipe card, repeat-week banner, leftovers, delivery-app picker, budget card |
| `src/lib/` | Pure TypeScript planner (pricing, budget balancing, swaps, leftovers) and the recipe catalog in `lib/catalog/` |
| `src/store/` | App state (zustand + AsyncStorage): permanent profile, current and last week |
| `src/ui/` | Design system: tokens (8pt grid, dark palette), motion, kit components, icons |
| `tests/` | Catalog integrity, planner rules and end-to-end flows in the Android test environment |
| `plugins/` | Expo config plugin for opening delivery apps on Android 11+ |

### `web/` — Web prototype (Next.js)

The original multi-step onboarding and dashboard prototype, built with Tailwind (Thmanyah type, 8pt grid) and Framer Motion.

## Run it

**Fonts first:** Thmanyah's license doesn't allow sharing the font files, so they aren't in this repo. Download them from [thmanyah.com](https://thmanyah.com) and follow `app/assets/fonts/README.md` (and `web/public/fonts/README.md` for the web prototype).

```bash
# Android app
cd app
npm install
npx expo start          # scan the QR code with Expo Go
npm run check           # types, lint, tests, worklet safety

# Web prototype
cd web
npm install
npm run dev             # http://localhost:3000
```

Installable Android build: `cd app && npx eas-cli@latest build -p android --profile preview`.

See `app/README.md` for the architecture and design notes.

## Author

Lujain Aloufi ([@lujainaloufi0](https://github.com/lujainaloufi0))
