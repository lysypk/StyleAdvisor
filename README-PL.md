# Style Advisor (Frontend Svelte)

Minimalny, przeglądarkowy kreator stylizacji. Użytkownik wybiera okazję i osobę (mężczyzna, kobieta, para; flow dla mężczyzny jest obecnie najbardziej rozbudowany), a następnie wybiera elementy garderoby i ich kolory/wzory. Kolory, wzory i typy mogą być sugerowane przez lokalny model Ollama.

## Uruchomienie
```bash
cd C:/Users/lysyp/suite/new-frontend
npm install
npm run dev
```
Otwórz podany adres URL (zwykle http://localhost:5173).

## Budowanie
```bash
npm run build
npm run preview
```

## Sugestie kolorów/wzorów (Ollama, lokalnie)
- Uruchom Ollama pod adresem `http://localhost:11434`.
- Model tekstowy powinien odpowiadać na `/v1/systemone` (typ pytania `choice`).
- Model wizyjny/OCR powinien odpowiadać na `/api/chat` z `images`.
- Domyślne modele w kodzie: `tev1:4b` dla wyborów tekstowych, `lfm3-vl:2b` dla wizji.
- Jeśli Ollama jest niedostępna, listy kolorów/typów/wzorów korzystają z zapasowych list statycznych.

## Przełączanie na model chmurowy (ręczne, przykład)
Aplikacja aktualnie celuje w endpointy Ollama. Aby użyć dostawcy chmurowego (zgodnego z OpenAI), typowe zmiany:

1. **URL endpointu**: zamień `http://localhost:11434/v1/systemone` i `/api/chat` na adres chmurowy.
   Przykład:
   ```js
   // Przed (Ollama)
   const r = await fetch('http://localhost:11434/v1/systemone', { ... });

   // Po (chmura)
   const r = await fetch('https://api.example.com/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer ' + import.meta.env.VITE_API_KEY
     },
     body: JSON.stringify({ model: 'gpt-4o-mini', messages: [...] })
   });
   ```
2. **Nazwy modeli**: zamień `tev1:4b` i `lfm3-vl:2b` na identyfikatory modeli chmurowych.
3. **Autoryzacja**: dodaj `Authorization: Bearer ***` (klucze przechowuj w env, nigdy w repo).
4. **Parsowanie odpowiedzi**: dostosuj do kształtu JSON dostawcy.
5. **Limity**: skaluj obrazy i ogranicz tokeny zgodnie z dokumentacją dostawcy.

Automatyczne przełączanie nie jest zaimplementowane; to są ręczne zmiany.

## SVG elementów garderoby
Umieść pliki SVG (400x400, wycentrowane) w `public/`. Mapa `svgMap` w `src/GarmentCard.svelte` wiąże nazwy elementów garderoby z nazwami plików. Warianty kobiece używają sufiksu `_woman.svg`, gdy są dostępne.

## Uwagi
- Dane garderoby są przechowywane w localStorage przeglądarki (offline-first) i mogą być eksportowane/importowane jako JSON.
- Interfejs jest dwujęzyczny (EN/PL); użyj przełącznika EN/PL w nagłówku.
- Wyniki OCR są weryfikowane przez użytkownika przed zapisem; obrazy nie są przechowywane.
- Dokumentacja (tymczasowa, głównie badawcza): docs/Research.md, docs/woman_garment.md, docs/AI_improvement.md, docs/LLM_observability_research.md, docs/playwright_tests_implementation.md, docs/Arize_Phoenix_usage.md.

## Testy
```bash
npm run test:e2e
npm run test:unit
```
Uruchamia testy smoke Playwright (headless). Do interaktywnego debugowania użyj `npx playwright test --ui`.

## Tracing Arize Phoenix (opcjonalne, bez Dockera)
Uruchom lokalnie (wymaga `uv`):
```bash
uvx arize-phoenix serve
```
Albo przez pip:
```bash
python -m pip install arize-phoenix
phoenix serve
```
Otwórz http://localhost:6006. Aplikacja best-effort wysyła tam trace'y i nigdy nie blokuje normalnego przepływu.

## Gdzie są reguły / dane
- `src/data/rules.js`: wskazówki dotyczące okazji/elementów garderoby i tekst reguł przekazywany do Ollama.
- `src/data/colors.js`: mapa kolorów HEX, domyślne i specyficzne dla elementów listy kolorów, wzory.
- `src/data/types.js`: opcje typów (spodnie/buty/spódnice/typy kobiece).
- `src/data/garments.js`: listy elementów garderoby wg okazji/płci (mężczyzna/kobieta/para formalne).
- `src/data/scoring.js`: implementacja oceny dopasowania i ostrzeżeń.

## Tłumaczenia
Wszystkie tłumaczenia interfejsu są w `src/i18n.ts` (jeden plik; języki: en/pl).
