# Przyszłe ulepszenia / notatki

Ten plik zbiera krótkie wskazówki dotyczące rozszerzania aplikacji i poprawy wyników AI. To tylko dokumentacja; brak zależności uruchomieniowych.

## 1. Dodawanie większej liczby opcji do elementów garderoby

Interfejs jest napędzany danymi. Dodaj lub zmodyfikuj listy opcji, a następnie przebuduj (Vite hot-reload w trybie dev):

- **Wzory**: `src/data/colors.js` → tablica `patterns` (np. `['Plain','Stripes','Checks','Dots', 'Houndstooth']`).
- **Listy kolorów**:
  - Kolory bazowe w `src/data/colors.js`: `defaultColors`, `watchStrapColors`, `watchCaseColors`, `watchDialColors`.
  - Listy specyficzne dla elementów: `womenBlouseColors`, `womenDressColors`, `womenSkirtColors`, `womenPantsColors`, `womenShoesColors`, `womenBagColors`, `womenJewelryColors`.
  - Dodaj nazwę koloru do `colourHexMap`, żeby renderowały się próbki.
  - Dodaj pasujące klucze `color_<Nazwa>` w `src/i18n.ts` (EN/PL), żeby etykiety nie wyświetlały surowych kluczy.
- **Opcje typów (spodnie/buty/spódnice)**: `src/data/types.js` → `typeCriteria` (`PantsType`, `WomenPantsType`, `ShoesType`, `WomenShoesType`, `WomenSkirtType`).
  - Dodaj tłumaczenia `type_<Nazwa>` w `src/i18n.ts`, gdy pojawia się nowa nazwa techniczna.
- **Listy elementów wg okazji**: tablice w `src/data/garments.js` (`menFormal`, `menInformal`, `womenFormal`, itd.).
- **Mapowanie elementów do SVG**: `src/GarmentCard.svelte` → `svgMap` / `womenVariantMap` (dodaj plik SVG w `public/`).

Po zmianach danych uruchom `npm run build` i `npm run test:e2e`, żeby wykryć literówki lub brakujące tłumaczenia.

## 2. Poprawa wyników Ollama (reguły / prompty)

Jeśli sugestie są słabe, najpierw dost tune reguły, nie model:

- **Wskazówki wg elementu i okazji**: `src/data/rules.js`
  - `garmentSpecificRules(g, woman)` kontroluje tekst dla poszczególnych elementów.
  - `rulesFor(occ, currentGarment, selMap, genderInfo)` składa końcowy kontekst promptu.
- **Instrukcje AI** są w `src/GarmentCard.svelte` (`fetchColors`, `fetchWardrobe`, `fetchFor`) i `src/App.svelte` (ocena dopasowania stylizacji).
  - Dostosuj `instructions`, `criteria` i filtrowanie kandydatów.
  - Endpoint modelu tekstowego: `http://localhost:11434/v1/systemone`, model `tev1:4b`.
  - Endpoint modelu wizyjnego: `http://localhost:11434/api/chat`, model `lfm3-vl:2b`.
- **Kandydaci zapasowi**: `allowedColors`, `allowedPatterns` i listy typów ograniczają sugestie.
- **Pamięć podręczna / progi oceny**: `AI_SCORE_CACHE`, `visibleOpts()` (filtr prawdopodobieństwa >= 50) i ocena noul.
- **Ocena dopasowania stylizacji**: `src/data/scoring.js` kontroluje ostrzeżenia i wynik `/100` pokazywany w panelach.

Wskazówka: rób małe zmiany i testuj A/B przy użyciu trace'ów z Arize Phoenix, obserwując opóźnienia i błędy.

## 3. Użycie Arize Phoenix dla tej aplikacji

Phoenix jest opcjonalny, lokalny i nigdy nie blokuje przepływu aplikacji.

### Uruchomienie
```bash
uvx arize-phoenix serve
# lub
python -m pip install arize-phoenix
phoenix serve
```
UI: http://localhost:6006

### Przepływ dla tej aplikacji
1. Najpierw uruchom Phoenix.
2. Uruchom aplikację (`npm run dev`) i otwórz ją.
3. Wykonaj realistyczne scenariusze: sugestie kolorów/wzorów, wybór typów, ocenę garderoby, OCR ze zdjęcia.
4. W Phoenix przeglądnij trace'y/spany projektu, żeby zobaczyć błędy, czasy i payloady promptów/odpowiedzi.
5. Sortuj po czasie trwania, żeby znaleźć wolne wywołania; filtruj błędy do debugowania jakości.
6. Napraw prompty/reguły albo dodaj fallbacki, potem powtórz.

### Uwagi
- Nie wymaga Dockera.
- Ollama nie udostępnia tu kosztów tokenów; Phoenix służy trace'om/opóźnieniom/błędom.
- Telemetria jest best-effort i znajduje się tylko w `src/telemetry.js`; usuń importy wrappera, żeby ją wyłączyć.
