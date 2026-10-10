# Mobile Dev Fundamentals

An interactive guide to the fundamentals of mobile development, built with React, Tailwind CSS and Vite.

- **Playground** (`/`): an Android foldable emulator and an iPhone Duo simulator side by side. Tap actions (launch, Home, Back, Recents/App Switcher, rotate, fold, lock, low-memory kill, swipe away, second window) and watch the lifecycle swimlanes, the callback log and the "what survives?" state panel. Tap any callback to see an explanation and modern Compose/SwiftUI code.
- **Learn** (`/learn/*`): lifecycle diagrams, app building blocks, toolchain & emulators, UI widgets side by side, foldables & dual screens, and an Android ↔ iOS cheat sheet.
- English and Bahasa Indonesia; light and dark mode.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/mobile-dev-guide/
npm test           # engine + content coverage tests
npm run build      # typecheck + production build into dist/
```

## How it's built

All lifecycle logic lives in one pure module per platform, behind one interface:

```ts
engine.can(state, action)      // → { ok } | { ok: false, reasonKey }
engine.dispatch(state, action) // → { state, trace: TraceStep[] }
```

- `src/engine/` — `android.ts`, `ios.ts`: which callbacks fire, in what order, and what state survives. The tests in `*.test.ts` pin every sequence.
- `src/playground/` — the UI only *replays* the trace (`useSimulator`): emulator frames, swimlanes, log and state panel.
- `src/content/snippets.ts` — the modern code shown for each callback (`cid`).
- `src/i18n/en.ts` is the source of truth; `id.ts` is typed as `typeof en`, so a missing translation fails the build. `content.test.ts` walks the engines and checks that every callback, note and reason has text.

To add a behaviour: add the step to the engine, add a test, add `x.<cid>` text in both languages, and map the cid to a snippet.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. The Vite `base` is `/mobile-dev-guide/`, so the repository should be named `mobile-dev-guide` (or change `base` in `vite.config.ts`). In the repo settings, set **Pages → Source** to **GitHub Actions**. `404.html` is a copy of `index.html`, so deep links work.

## Accuracy notes

iPhone Duo (iOS 27.1) API names (`onHingeChange`, `UIHingeInteraction`, `reservedRegion`) come from Apple's iPhone Duo developer material, and their exact signatures may change. Some sequences are simplified for teaching (for example, the exact interleaving of fragment transactions); the explainer notes say where.
