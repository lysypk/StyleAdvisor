# Future Upgrades / Handy Notes

This file collects small guidance for extending the app and improving AI results. It is documentation only; no runtime dependency.

## 1. Adding more options to garments

The UI is data-driven. Add or modify option lists, then rebuild (Vite hot-reloads in dev):

- **Pattern options**: `src/data/colors.js` → `patterns` array (e.g. `['Plain','Stripes','Checks','Dots', 'Houndstooth']`).
- **Colour lists**:
  - Base colours in `src/data/colors.js`: `defaultColors`, `watchStrapColors`, `watchCaseColors`, `watchDialColors`.
  - Garment-specific lists: `womenBlouseColors`, `womenDressColors`, `womenSkirtColors`, `womenPantsColors`, `womenShoesColors`, `womenBagColors`, `womenJewelryColors`.
  - Add the colour name to `colourHexMap` so swatches render.
  - Add matching `color_<Name>` keys to `src/i18n.ts` (EN/PL) so labels do not show raw keys.
- **Type options (Pants/Shoes/Skirt)**: `src/data/types.js` → `typeCriteria` (`PantsType`, `WomenPantsType`, `ShoesType`, `WomenShoesType`, `WomenSkirtType`).
  - Add `type_<Name>` translations in `src/i18n.ts` when a new technical name is introduced.
- **Garment lists per occasion**: `src/data/garments.js` arrays (`menFormal`, `menInformal`, `womenFormal`, etc.).
- **Garment-to-SVG mapping**: `src/GarmentCard.svelte` → `svgMap` / `womenVariantMap` (add the SVG under `public/`).

After changing data, run `npm run build` and `npm run test:e2e` to catch typos or missing translations.

## 2. Improving Ollama results (rules / prompts)

If suggestions are weak, tune without touching the model first:

- **Garment and occasion guidance**: `src/data/rules.js`
  - `garmentSpecificRules(g, woman)` controls per-garment text.
  - `rulesFor(occ, currentGarment, selMap, genderInfo)` assembles the final prompt context.
- **AI instructions** live in `src/GarmentCard.svelte` (`fetchColors`, `fetchWardrobe`, `fetchFor`) and `src/App.svelte` (outfit fit score).
  - Adjust `instructions`, `criteria`, and candidate filtering.
  - Text model endpoint: `http://localhost:11434/v1/systemone` with model `tev1:4b`.
  - Vision model endpoint: `http://localhost:11434/api/chat` with model `lfm3-vl:2b`.
- **Fallback candidates**: `allowedColors`, `allowedPatterns`, and type lists constrain suggestions.
- **Caching / scoring thresholds**: `AI_SCORE_CACHE`, `visibleOpts()` (probability >= 50 filter), and noul scoring.
- **Outfit fit score**: `src/data/scoring.js` controls warnings and the `/100` score shown in the summary panels.

Tip: keep changes small and A/B test with Arize Phoenix traces to see latency and errors.

## 3. Using Arize Phoenix for this app

Phoenix is optional, local-only, and never blocks app flow.

### Start
```bash
uvx arize-phoenix serve
# or
python -m pip install arize-phoenix
phoenix serve
```
UI: http://localhost:6006

### Workflow for this app
1. Start Phoenix first.
2. Start the app with `npm run dev` and open it.
3. Run realistic flows: colour/pattern suggestions, type selection, wardrobe scoring, photo OCR.
4. In Phoenix inspect project traces/spans for errors, durations, and prompt/response payloads.
5. Sort by duration to find slow calls; filter errors for debugging quality.
6. Fix prompts/rules or add fallbacks, then repeat.

### Notes
- No Docker required.
- Ollama does not provide token cost here; Phoenix focuses on traces/latency/errors.
- Telemetry is best-effort and only lives in `src/telemetry.js`; remove wrapper imports to disable it.
