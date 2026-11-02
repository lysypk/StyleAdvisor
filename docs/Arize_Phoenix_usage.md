# Arize Phoenix: Usage Guide

## Start / Stop
- Start: `uvx arize-phoenix serve`
- Stop: Ctrl+C in the terminal
- UI: http://localhost:6006
- Collector endpoint: http://localhost:6006/v1/traces

## In this app
- Ollama colour choice, pattern/type, and OCR calls are wrapped with a lightweight tracer.
- Each request sends a span (model/endpoint/duration/status) to Phoenix.
- Telemetry is best-effort; failures never block app flow.

## Basic workflow
1. Start Phoenix first.
2. Start frontend (`npm run dev`) and open app.
3. Perform colour suggestions, pattern selection, OCR, wardrobe AI.
4. Open Phoenix, Project view -> inspect traces/spans/errors/latencies.
5. Sort by duration to find slow calls; filter errors for debugging quality.

## Optional
- If needed, use `python -m pip install arize-phoenix && phoenix serve` (ensure same python/pip).
- Keep Phoenix running while developing for full trace visibility.

## Notes
- This is local-only and free.
- No automatic token-cost telemetry (Ollama doesn't provide it here).
- To disable telemetry later, remove `src/telemetry.js` wrapper imports.