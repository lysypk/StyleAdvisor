# New Functionalities & Improvements


## AI quality & observability (requested)
33. **AI score sensitivity (current logic)**  
    What affects results: `rulesFor` occasion/garment guidance, already-selected colours (rules text), criteria candidate lists, Ollama `noul` per-option independent probability, and low-confidence thresholds.  
    Improvements: clean `rulesFor`, supply compact selection summaries, calibrate 0–100 scale, and add a per-item probability check before showing 100%. — Complexity: High
34. **Use Arize Phoenix for diagnosis**  
    Suggestions: trace colour/type/pattern/OCR requests; compare latency and score variance; tag runs with occasion/garment; use historical traces to improve prompt consistency. — Complexity: Low


