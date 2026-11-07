// Centralised style rules used to guide the AI suggestions.
//
// Each section below is deliberately written as plain, editable text.
// Change a string here and it will influence the next suggestion request.
// Pages/components only call garmentSpecificRules() and rulesFor().

// ---------------------------------------------------------------------------
// Occasion-level advice.
// Keys: [occasion][variant-or-default][woman|man]
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Garment-level advice.
// Empty strings mean "no specific extra rule for this garment/gender".
// ---------------------------------------------------------------------------
const STYLE_GUIDANCE = {
  Shirt: {
    woman: '',
    man: 'Shirt: solid colour for formal/business/funeral; white or light blue for business; white only at funerals; subtle stripes/checks only at weddings/date; keep the shirt quieter than a strong tie or jacket pattern.'
  },
  Blouse: {
    woman: 'Blouse: formal/business in white/light blue/soft neutrals with minimal patterns; silk/satin pastel or jewel for weddings; dark and modest for funerals; expressive textures for dates; use only one pattern or texture statement.',
    man: ''
  },
  Jacket: {
    woman: 'Blazer/Jacket: neutral structured base; tailored blazer for business, black/dark for funeral/formal, optional for date; keep jacket patterns quieter than shirt or accessories.',
    man: 'Jacket: navy/charcoal for business, black for funeral/formal, optional for date; subtle pattern only when shirt and tie are plain.'
  },
  Tie: {
    woman: '',
    man: 'Tie: silk with conservative patterns for business, muted wedding patterns, solid black/charcoal/navy/burgundy for funeral, optional but neat for date; tie should not compete with a strong shirt pattern.'
  },
  Belt: {
    woman: '',
    man: 'Belt: colour and finish should agree with shoes; slim buckle for dress trousers, broader for jeans; keep plain when another garment has a strong pattern.'
  },
  Watch: {
    woman: 'Watch: strap matches shoes/belt; case metal harmonises with accessories; keep dial conservative for formal/funeral; expressive case/dial choices only for date; avoid clashing strap and case metals.',
    man: 'Watch: strap matches shoes/belt; case metal harmonises with accessories; keep dial conservative for formal/funeral; expressive case/dial choices only for date; avoid clashing strap and case metals.'
  },
  Pants: {
    woman: 'Pants/Trousers: straight/tapered/cigarette for business, palazzo/wide-leg for dressy or date, culottes/skater for casual; dark for formal/funeral, lighter for date; choose a cut that matches occasion formality.',
    man: 'Pants: dress/tailored/slim for formal, chinos for smart-casual, jeans/cargo/corduroy for casual/date, joggers informal only; dark colours for formal/funeral.'
  },
  Shoes: {
    woman: 'Shoes: closed-toe oxford/pump for business and funeral, loafer/ballet flat for smart-casual, sandal/wedge/mule for date, boots seasonally; heel height and material must suit occasion formality.',
    man: 'Shoes: black/brown leather for formal; oxford/derby for business and formal, monk/loafer for smart occasions, brogue/chelsea for smart-casual, sneaker/espadrille for casual/date.'
  },
  Skirt: {
    woman: 'Skirt: pencil for business/formal, midi/A-line/pleated for versatile or date, mini/maxi/wrap for date or casual; knee or longer for business/funeral; prints only for wedding or date.',
    man: ''
  },
  Dress: {
    woman: 'Dress: full look excludes pants/skirt/blouse; fabric and colour by occasion; avoid white/ivory at weddings; closed-toe or refined shoes for funeral/formal; prints only for date or wedding.',
    man: ''
  },
  Handbag: {
    woman: 'Handbag/Clutch: small neutral or metallic clutch for formal, structured tote for business, coordinated statement for date; hardware should harmonise with watch and jewellery.',
    man: ''
  },
  Jewelry: {
    woman: 'Jewelry: minimal for formal/funeral/business, statement for date or wedding guest; metal tone should coordinate with watch case and bag hardware.',
    man: ''
  },
  'Pocket Square': {
    woman: 'Pocket square: echo one colour from tie or shirt; avoid an identical match; white linen safest for formal, silk richer for formal, cotton/linen casual; pattern must be quieter than the tie.',
    man: 'Pocket square: echo one colour from tie or shirt; avoid an identical match; white linen safest for formal, silk richer for formal, cotton/linen casual; pattern must be quieter than the tie.'
  }
};

const GENDER_STYLING = {
  woman: 'Woman styling: funeral/formal modest; shoes/bag/hardware coordinate; jewelry minimal for formal/funeral.',
  man: 'Men styling: as above.'
};

const COLOUR_GUIDANCE =
  'Colour and pattern guidance: black signals formality or mourning for funeral/formal; navy and charcoal for business; ' +
  'white or light-blue shirts; belt and watch strap should match shoes; watch case metal such as silver or gold should match other accessories; ' +
  'avoid identical primary and secondary colours unless the garment is plain; keep one strong pattern at most; ' +
  'secondary colours support, not compete with, the primary colour; funeral outer garments should be dark and plain; ' +
  'avoid white or ivory as a wedding guest; garment type must suit occasion formality.';

export function garmentSpecificRules(g, woman) {
  const genderKey = woman ? 'woman' : 'man';
  const entry = STYLE_GUIDANCE[g];
  if (!entry) return '';
  // Pocket Square (and other shared garments) expose one shared string.
  return entry[genderKey] || (entry.woman || entry.man || '');
}

export function rulesFor(occ, currentGarment, selMap, genderInfo) {
  const parts = [];
  const c = occ?.category;
  const v = occ?.variant;
  const isWoman = (genderInfo?.who || 'man') === 'woman';
  const genderKey = isWoman ? 'woman' : 'man';

  // Occasion-level advice.
  if (c && OCCASION_RULES[c]) {
    const variantRules = OCCASION_RULES[c][v] || OCCASION_RULES[c].default || OCCASION_RULES[c].guest;
    if (variantRules && variantRules[genderKey]) parts.push(variantRules[genderKey]);
  }

  parts.push(GENDER_STYLING[genderKey]);

  // Garment-level advice.
  const gsr = garmentSpecificRules(currentGarment, isWoman);
  if (gsr) parts.push('Garment rules: ' + gsr);

  parts.push(COLOUR_GUIDANCE);

  // Already selected garments.
  const entries = Object.entries(selMap || {}).filter(([g, sel]) => sel && (sel.color || sel.strap || sel.type));
  if (entries.length) {
    parts.push(
      'Already selected: ' +
        entries.map(([g, sel]) => g + '=' + (sel.color || sel.strap || sel.case || sel.dial || sel.type || '')).join(', ') +
        '. Complement these (belt/watch strap match shoes).'
    );
  }

  if (currentGarment) parts.push('Now selecting: ' + currentGarment + '.');
  return parts.join(' ');
}
