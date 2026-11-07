// Centralised style rules used to guide the AI suggestions.
//
// Each section below is deliberately written as plain, editable text.
// Change a string here and it will influence the next suggestion request.
// Pages/components only call garmentSpecificRules() and rulesFor().

const OCCASION_RULES = {
  wedding: {
    closeFamily: {
      woman: 'Woman wedding (close family): elegant dresses/separates, avoid white; pastel for day, jewel for evening.',
      man: 'Men wedding close family: dark suit, tie required, avoid bright patterns.'
    },
    guest: {
      woman: 'Woman wedding (guest): elegant midi/cocktail dress or separates; avoid matching bride/bridesmaids, avoid white.',
      man: 'Men wedding guest: dark suit, white shirt, muted tie, avoid bright patterns.'
    }
  },
  funeral: {
    default: {
      woman: 'Woman funeral: dark modest dress/suit, closed-toe shoes, minimal jewelry.',
      man: 'Men funeral: dark colours only (black/charcoal), plain patterns, dark tie.'
    }
  },
  formalBusiness: {
    default: {
      woman: 'Woman formal business: tailored suit/skirt or sheath + blazer, blouse in navy/charcoal/white.',
      man: 'Men formal business: navy/charcoal suit, white or light blue shirt, matching tie, no bright patterns.'
    }
  },
  informalMeeting: {
    default: {
      woman: 'Date / Smart casual: polished but relaxed; jacket optional, no tie required; clean, venue-appropriate look.',
      man: 'Date / Smart casual: polished but relaxed; jacket optional, no tie required; clean, venue-appropriate look.'
    }
  }
};

const GARMENT_COLOR_RULES = {
  Shirt: { woman: '', man: 'Shirt colour: solid for formal/business/funeral; white or light blue for business; white only at funerals; subtle stripes or checks at weddings/date; keep the shirt quieter than a strong tie.' },
  Blouse: { woman: 'Blouse colour: formal/business in white, light blue or soft neutrals; silk or satin pastel/jewel for weddings; dark and modest for funerals; expressive textures for dates.', man: '' },
  Jacket: { woman: 'Jacket colour: neutral base; structured blazer for business, black or dark for funeral/formal, lighter or relaxed for date; patterns must be quieter than the top.', man: 'Jacket colour: navy or charcoal for business, black for funeral/formal, optional for date; subtle pattern only when shirt and tie are plain.' },
  Tie: { woman: '', man: 'Tie colour: silk with conservative patterns for business; muted wedding patterns; solid black, charcoal, navy or burgundy for funeral; neat optional tie for date; tie should not compete with a strong shirt pattern.' },
  Belt: { woman: '', man: 'Belt colour and finish should agree with shoes; slim buckle for dress trousers, broader for jeans; keep plain when another garment has a strong pattern.' },
  Watch: { woman: 'Watch: strap matches shoes or belt; case metal harmonises with accessories; conservative dial for formal/funeral; expressive case/dial choices only for date; strap and case metals must not clash.', man: 'Watch: strap matches shoes or belt; case metal harmonises with accessories; conservative dial for formal/funeral; expressive case/dial choices only for date; strap and case metals must not clash.' },
  Pants: { woman: 'Pants colour: neutral tailored; wide, straight or tapered; darker for funeral/formal, lighter for date; type must fit occasion formality.', man: 'Pants colour: dress or tailored for formal, chinos for smart-casual, jeans or chinos for date; dark colours for funeral/formal.' },
  Shoes: { woman: 'Shoes colour: closed-toe and conservative for business or funeral, coordinated with bag and hardware; lighter or statement choices for date, matched by occasion formality.', man: 'Shoes colour: black or brown leather for formal; black, brown or navy coordinated with belt; lighter or casual pairs for date.' },
  Skirt: { woman: 'Skirt colour: knee or longer and somber for business/funeral; cocktail or jewel tones for wedding/date; neutral solid for formal; prints mainly for wedding or date.', man: '' },
  Dress: { woman: 'Dress colour: fabric and colour by occasion; avoid white or ivory at weddings; dark, modest choices for funeral/formal; prints mainly for date or wedding.', man: '' },
  Handbag: { woman: 'Handbag colour: small neutral or metallic clutch for formal, structured tote for business, coordinated statement for date; hardware harmonises with watch and jewellery.', man: '' },
  Jewelry: { woman: 'Jewelry colour: minimal for formal/funeral/business, statement for date or wedding guest; metal tone coordinates with watch case and bag hardware.', man: '' },
  'Pocket Square': { woman: 'Pocket square colour: echo one colour from tie or shirt; avoid an identical match; white linen for formal, silk for richer formal, cotton or linen for casual.', man: 'Pocket square colour: echo one colour from tie or shirt; avoid an identical match; white linen for formal, silk for richer formal, cotton or linen for casual.' }
};

const GARMENT_PATTERN_RULES = {
  Shirt: { woman: '', man: 'Shirt pattern: plain or subtle stripes for business; muted patterns for wedding; plain only for funeral; at most one strong pattern around the outfit.' },
  Blouse: { woman: 'Blouse pattern: minimal for business; silk or satin texture or pastel for wedding; dark modest for funeral; expressive but single-pattern for date.', man: '' },
  Jacket: { woman: 'Jacket pattern: quieter than shirt or accessories; avoid competing textures.', man: 'Jacket pattern: subtle only when shirt and tie are plain; avoid competing with shirt or tie.' },
  Tie: { woman: '', man: 'Tie pattern: conservative stripes or checks for business; muted wedding patterns; plain for funeral; optional subtle pattern for date; tie must be quieter than a bold shirt.' },
  Skirt: { woman: 'Skirt pattern: plain for business/formal; controlled prints for wedding or date; avoid strong pattern with a bold shirt.', man: '' },
  Dress: { woman: 'Dress pattern: prints mainly for wedding or date; plain or subtle for formal/funeral.', man: '' },
  'Pocket Square': { woman: 'Pocket square pattern must be quieter than the tie and should echo, not duplicate, it.', man: 'Pocket square pattern must be quieter than the tie and should echo, not duplicate, it.' }
};

const GARMENT_TYPE_RULES = {
  Pants: { woman: 'Pants type: straight, tapered or cigarette for business; palazzo or wide-leg for dressy or date; culottes or skater for casual; casual types are unsuitable for funeral or formal business.', man: 'Pants type: dress, tailored or slim for formal; chinos for smart-casual; jeans, cargo or corduroy for casual or date; joggers informal only.' },
  Shoes: { woman: 'Shoes type: closed-toe oxford or pump for business and funeral; loafer or ballet flat for smart-casual; sandal, wedge or mule for date; boots seasonally and by occasion.', man: 'Shoes type: oxford or derby for business and formal; monk or loafer for smart occasions; brogue or chelsea for smart-casual; sneaker or espadrille for casual or date.' },
  Skirt: { woman: 'Skirt type: pencil for business or formal; midi, A-line or pleated for versatile or date; mini, maxi or wrap for date or casual.', man: '' }
};

const GENDER_STYLING = {
  woman: 'Woman styling: funeral/formal modest; shoes/bag/hardware coordinate; jewelry minimal for formal/funeral.',
  man: 'Men styling: as above.'
};

const COLOR_GUIDANCE =
  'Colour guidance: black signals formality or mourning for funeral or formal occasions; navy and charcoal suit business; ' +
  'white or light-blue shirts; belt and watch strap should match shoes; watch case metal such as silver or gold should match other accessories; ' +
  'avoid identical primary and secondary colours unless the garment is plain; secondary colours support, not compete with, the primary colour; ' +
  'funeral outer garments should be dark; avoid white or ivory as a wedding guest.';

const PATTERN_GUIDANCE =
  'Pattern guidance: Plain is the safest and preferred choice unless the occasion, garment and existing outfit clearly justify Stripes, Checks, Dots or another named pattern. ' +
  'Funerals must be plain only; formal business should be plain or very subtle; weddings and dates may use subtle or controlled bold patterns. ' +
  'Keep at most one strong pattern, and if another garment already has a pattern score Plain highest while unsuitable bold patterns score 0-40.';

const TYPE_GUIDANCE =
  'Type guidance: garment type must suit occasion formality; formal and business occasions need formal cuts; ' +
  'casual-only types are unsuitable for funeral or formal business.';

export function garmentSpecificRules(g, woman, field = 'color') {
  const genderKey = woman ? 'woman' : 'man';
  const source =
    field === 'pattern' ? GARMENT_PATTERN_RULES :
    field === 'type' ? GARMENT_TYPE_RULES :
    GARMENT_COLOR_RULES;
  const entry = source[g];
  if (!entry) return '';
  return entry[genderKey] || entry.woman || entry.man || '';
}

export function rulesFor(occ, currentGarment, selMap, genderInfo, field = 'color') {
  const parts = [];
  const c = occ?.category;
  const v = occ?.variant;
  const isWoman = (genderInfo?.who || 'man') === 'woman';
  const genderKey = isWoman ? 'woman' : 'man';

  if (c && OCCASION_RULES[c]) {
    const variantRules = OCCASION_RULES[c][v] || OCCASION_RULES[c].default || OCCASION_RULES[c].guest;
    if (variantRules && variantRules[genderKey]) parts.push(variantRules[genderKey]);
  }

  parts.push(GENDER_STYLING[genderKey]);

  const gsr = garmentSpecificRules(currentGarment, isWoman, field);
  if (gsr) parts.push('Garment rules: ' + gsr);

  if (field === 'pattern') parts.push(PATTERN_GUIDANCE);
  else if (field === 'type') parts.push(TYPE_GUIDANCE);
  else parts.push(COLOR_GUIDANCE);

  const entries = Object.entries(selMap || {}).filter(([g, sel]) => sel && (sel.color || sel.strap || sel.type));
  if (entries.length) {
    parts.push(
      'Already selected: ' +
        entries.map(([g, sel]) => g + '=' + (sel.color || sel.strap || sel.case || sel.dial || sel.type || '')).join(', ') +
        '. Complement these (belt/watch strap match shoes).'
    );
  }

  if (currentGarment) parts.push('Now selecting: ' + String(field || 'color').toUpperCase() + ' for ' + currentGarment + '.');
  if (field === 'pattern') parts.push('For this pattern dropdown, Plain should be the highest-scoring option unless a specific pattern is clearly appropriate.');
  return parts.join(' ');
}
