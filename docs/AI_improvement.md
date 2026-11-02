# AI Improvement Suggestions

Current app calls Ollama `/v1/systemone` with `choice` question type, passing occasion context and selected garment state. Results good but can improve:

1. **Better prompts/rules**
   - Provide structured rule sets per occasion and garment (already started in `rulesFor`).
   - Explicitly forbid invalid colour combos (e.g., primary == secondary).
   - State dressing constraints: belt matches shoes, watch strap matches shoes, formal colors.

2. **Relevant context**
   - Send full current selection state (done).
   - Include user's region/climate/season and dress-code if known.
   - Include material cues (wool vs linen) for colour probability.

3. **Choice candidate lists**
   - Restrict candidate colours per garment (watch case only metal colours etc.) (started via allowedColors maps).
   - For patterns/types, send curated candidate list as criteria.

4. **Output quality**
   - Ask model to return probabilities and short rationale; parse rationale maybe show to user.
   - Reduce temperature / set deterministic sampling for consistent runs.
   - Add `top_k` / repetition control if endpoint supports.

5. **Evaluation**
   - Log responses and user picks; refine rules.
   - Add feedback loop: if user changes selection, re-rank and update future prompts.

6. **Resilience**
   - Retry on failure; fallback static lists (done) but add user-visible status.
   - Cache results per (garment, state hash) to avoid repeated calls.