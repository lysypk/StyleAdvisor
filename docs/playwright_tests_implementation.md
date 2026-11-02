# Playwright Test Implementation Plan

## Scope
Smoke/e2e tests for the Svelte frontend garment flow, wardrobe, and modal interactions. No backend DB; rely on local Ollama optional (skip AI assertions if unavailable).

## Setup
- Install dev deps: `@playwright/test`.
- Add `playwright.config.js` (baseURL `http://localhost:5173`, headless by default, 2 retries in CI).
- Start dev server via `webServer` config.

## Priority tests
1. Welcome flow
   - Select occasion (Wedding guest), select gender (Man) → garments screen visible.
   - Selected values reflected in header.
2. Garment modal
   - Click shirt → modal opens.
   - Colour dropdown focus triggers request or fallback list; selecting colour updates.
   - Pattern changes and secondary colour appears when non-plain.
   - Save gating: disabled until fields filled.
   - Save → under-card summary shows chosen options; excluded remains hidden.
3. Optional garments
   - Belt/Watch unchecked → Save allowed, card summary hidden, excluded from Selected outfit.
4. Carousel
   - Resize viewport to force overflow; arrows visible on hover; click next scrolls.
5. Wardrobe
   - Open wardrobe, add item with all params, custom name prompt, verify item saved with swatch.
   - Use wardrobe only → dropdown shows item names; selecting greys out manual params.

## Selectors
- Use role/text/aria labels and data attributes (`data-testid`) for stability.
- Avoid XPath or brittle CSS.

## Data
- Seed localStorage when needed via `page.addInitScript`.
- Mock `/v1/systemone` and `/api/chat` if hardware unavailable.

## Commands
```bash
npm i -D @playwright/test
npx playwright install
npx playwright test
```

## CI
- Run build + preview + tests; upload traces on failure.

This is a planning document; implementation can be incremental.