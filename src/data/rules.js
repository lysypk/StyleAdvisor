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
    man: 'Shirt: formal/business white or light blue; wedding guest white/light blue muted; funeral white only; date relaxed colours.'
  },
  Blouse: {
    woman: 'Blouse: formal/business white/light blue/soft neutrals minimal patterns; wedding silk/satin pastel or jewel; funeral dark modest; date expressive textures.',
    man: ''
  },
  Jacket: {
    woman: 'Blazer/Jacket: neutral base; tailors separates; black/dark for funeral/formal; optional for date.',
    man: 'Jacket: navy/charcoal business; black funeral/formal; optional informal/date.'
  },
  Tie: {
    woman: '',
    man: 'Tie: silk conservative patterns business; muted wedding; solid black/charcoal/navy/burgundy funeral; optional date.'
  },
  Belt: {
    woman: '',
    man: 'Belt: match shoes colour/finish; slim buckle.'
  },
  Watch: {
    woman: 'Watch: strap match shoes/belt; case metal harmonises; conservative formal/business/funeral; expressive date.',
    man: 'Watch: strap match shoes/belt; case metal harmonises; conservative formal/business/funeral; expressive date.'
  },
  Pants: {
    woman: 'Pants/Trousers: neutral tailored; wide/straight/tapered; fabric by occasion; black funeral/formal; lighter date.',
    man: 'Pants: dress pants for formal; chinos for informal/date.'
  },
  Shoes: {
    woman: 'Shoes: closed-toe for business/funeral; heels/flats/wedges/boots by occasion; coordinate with bag/hardware; leather/satin for formal.',
    man: 'Shoes: black/brown leather matched to belt; oxfords formal; loafers casual.'
  },
  Skirt: {
    woman: 'Skirt: knee or longer for business/funeral; cocktail length for wedding/date; pencil/A-line/pleated; neutral solid formal; prints wedding/date.',
    man: ''
  },
  Dress: {
    woman: 'Dress: full look excludes pants/skirt/blouse; fabric/colour by occasion; avoid white/ivory at weddings; closed-toe for funeral/formal.',
    man: ''
  },
  Handbag: {
    woman: 'Handbag/Clutch: small clutch neutral/metallic formal; structured tote business; coordinated statement date.',
    man: ''
  },
  Jewelry: {
    woman: 'Jewelry: minimal formal/funeral/business; statement date/wedding guest; metal tone coordinates with watch/bag hardware.',
    man: ''
  },
  'Pocket Square': {
    woman: 'Pocket square: echo one colour from tie/shirt; avoid identical match; white linen safest formal; silk richer formal; cotton/linen casual; pattern quieter than tie.',
    man: 'Pocket square: echo one colour from tie/shirt; avoid identical match; white linen safest formal; silk richer formal; cotton/linen casual; pattern quieter than tie.'
  }
};

const GENDER_STYLING = {
  woman: 'Woman styling: funeral/formal modest; shoes/bag/hardware coordinate; jewelry minimal for formal/funeral.',
  man: 'Men styling: as above.'
};

const COLOUR_GUIDANCE =
  'Colour guidance: black signals formality/sadness (funeral/formal); navy/charcoal for business; white/light-blue shirts; ' +
  'belt and watch strap should match shoes; watch case metal (silver/gold) may match other accessories; ' +
  'avoid identical primary and secondary unless plain.';

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
