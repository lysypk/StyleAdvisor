# Women's Garments by Occasion (Research)

This file explores women’s outfit composition for the occasions in Style Advisor, and the implementation challenges given the current men-focused logic.

## Core principle: Women’s outfits are modular and often mutually exclusive
- **Dress** can replace pants/skirt + jacket as a complete look.
- **Jumpsuit** is a one-piece alternative to dress or separates.
- **Blazer** is optional except formal/business contexts; bolero/cardigan may replace it.
- **Garment combinations must be validated** (e.g., a dress excludes pants/skirt and sometimes jacket).

## Occasion-specific garment sets

### Wedding (guest)
- **Dressy separates OR dress**: midi/cocktail dress, or silk blouse + flowing skirt.
- **Blazer/jacket** optional (tailored blazer to elevate).
- **Shoes**: heels or dressy flats; clutch; minimal jewelry.
- **Colours**: day: pastels/florals; evening: darker jewel tones. Avoid matching bride/bridesmaids; avoid white/ivory.
- **Patterns**: florals, prints acceptable depending on dress code; solid for formal.

### Funeral
- **Dress/suit**: dark dress or dark skirt+blouse; dark pantsuit.
- **Jacket/blazer** optional but recommended for formal; can be dark cardigan in casual setting.
- **Shoes**: closed-toe dark pumps/flats.
- **Colours**: black, charcoal, navy; modest.
- **Patterns**: subtle only.

### Formal Business Meeting
- **Tailored suit** (trouser or skirt) or formal sheath dress + structured blazer.
- **Blouse**: crisp white/light colours, structured fabric.
- **Shoes**: closed-toe pumps/flats, polished.
- **Colours**: navy/charcoal/black with white/light blouse.
- **Patterns**: subtle stripes/pinstripes; avoid bold prints.

### Date / Smart Casual
- **Dress or separates**: slip dress with jacket, blouse + jeans/skirt, co-ord sets, jumpsuit.
- **Outerwear**: blazer, denim, or leather jacket.
- **Shoes**: heels, flats, or boots.
- **Colours/patterns**: expressive, richer textures, muted-bold accents.

## Women garment inventory for app
Possible garments (not all present in men app):
- Dress
- Jacket / Blazer
- Blouse / Shirt
- Skirt
- Pants / Trousers
- Jumpsuit
- Coat / Outer layer (optional)
- Shoes
- Belt (optional, often not needed with dresses)
- Handbag / Clutch (optional accessory)
- Jewelry (optional)

## Implementation challenges
1. **Mutual exclusivity**: If user picks Dress or Jumpsuit, disable/hide Pants, Skirt, and sometimes Jacket.
2. **Occasion-aware defaults**: Wedding guest should allow dress+optional blazer; funeral allows dress+jacket; business formal needs suit or dress+blazer.
3. **Color matching**: Shoes/bag/jewelry coordination rules differ; no (men) belt/shoes default.
4. **Fit/style attributes**: Sleeve length, neckline, skirt length; optional fields not currently modelled.
5. **Tie/pocket square**: Men-specific; women have equivalent optional items (scarf, jewelry) but not same logic.
6. **Garment list logic**: `App.svelte` garment lists are men-based; needs occasion+gender branch and exclusive choices.

## Suggested data model extensions
- Add `gender` to occasion state (already in store).
- Add `ensemble` type: full-dress vs separates.
- Validate combinations before display and disable conflicting garments.
- Add garment options (e.g. Jacket optional) per occasion and gender.


## Jewelry (Women, optional)
- Footwear/accessory context; keep minimal for formal/business; statement pieces only for date/casual weddings.
- Metals should coordinate with watch case and handbag hardware.
- Avoid distracting noise at funerals; small earrings/necklace only.

## Detailed garment research (women)

### Blouse
- **Role**: top layer for separates (business, wedding guest, funeral, date).
- **Styles**: button-down, wrap, peplum, puff/bishop sleeves, tie-neck.
- **Colours**: neutrals (white, ivory, beige, navy, black, gray) for formal/business; jewel tones (emerald, burgundy, sapphire) for weddings/dates; muted tones for funeral.
- **Patterns**: solid/minimal (stripes, polka dots, small geometric) for business/formal; florals/bolder prints for weddings/dates; avoid bold for funeral.
- **Occasion notes**: Formal blouse required for business formal; optional for wedding if dress replaces; modest necklines for funeral.

### Skirt
- **Role**: alternative to pants in separates; midi/knee-length typical.
- **Styles**: pencil, A-line, pleated, midi, maxi; mini only casual date settings.
- **Length rule**: knee or longer for funeral/business; cocktail length for weddings..
- **Colours**: neutral base with blouses; darker for funeral; brighter/pastel for wedding/date.
- **Patterns**: subtle for business/funeral; florals/prints for wedding/date.
- **Pairing**: blazer optional depending on formality.

### Pants / Trousers
- **Role**: separates base for business and casual; less common for weddings/funeral (suits).
- **Styles**: straight-leg, wide-leg, tapered, cigarette, palazzo, culottes; high/mid rise.
- **Fabric**: stretch crepe, wool-blends, poly-viscose for work; cotton/linen for casual; jersey for relaxed.
- **Colour**: navy, charcoal, black, gray neutrals; avoid brights for business; any for date with restraint.
- **Fit**: hem should complement shoe height; tailored polish for business.
- **Patterns**: solid for business/formal; subtle stripes for smart casual; avoid loud patterns.

### Shoes
- **Role**: closes formality level; heel height affects occasion.
- **Types**: closed-toe pumps (business/formal), flats/ballet, loafers, block heels, wedges (weddings/outdoor), boots (date/casual), sandals (casual/date, not formal business).
- **Heel height guide**: ~2in for long standing; higher for short events; flats acceptable with elegant material/details.
- **Colour**: black/navy/nude for business/formal; can coordinate with outfit for weddings/dates; avoid overly casual colors for funeral.
- **Formality cues**: shine/patent elevates; open-toe less formal (business); closed-toe more formal.

## Notes for implementation
- Women’s outfit validity needs garment exclusivity (dress vs pants/skirt).
- Blouse/Skirt/Pants all need colour sets; pattern options depend on occasion/formality.
- Shoes type options should vary by formality; colour matching with bag/hardware.
- Consider sleeve/length fields as extra attributes later.
