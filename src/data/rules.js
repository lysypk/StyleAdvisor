export function garmentSpecificRules(g, woman) {
  const rules = {
    Shirt: woman ? '' : 'Shirt: formal/business white or light blue; wedding guest white/light blue muted; funeral white only; date relaxed colours.',
    Blouse: woman ? 'Blouse: formal/business white/light blue/soft neutrals minimal patterns; wedding silk/satin pastel or jewel; funeral dark modest; date expressive textures.' : '',
    Jacket: woman ? 'Blazer/Jacket: neutral base; tailors separates; black/dark for funeral/formal; optional for date.' : 'Jacket: navy/charcoal business; black funeral/formal; optional informal/date.',
    Tie: woman ? '' : 'Tie: silk conservative patterns business; muted wedding; solid black/charcoal/navy/burgundy funeral; optional date.',
    Belt: woman ? '' : 'Belt: match shoes colour/finish; slim buckle.',
    Watch: woman ? 'Watch: strap match shoes/belt; case metal harmonises; conservative formal/business/funeral; expressive date.' : 'Watch: strap match shoes/belt; case metal harmonises; conservative formal/business/funeral; expressive date.',
    Pants: woman ? 'Pants/Trousers: neutral tailored; wide/straight/tapered; fabric by occasion; black funeral/formal; lighter date.' : 'Pants: dress pants for formal; chinos for informal/date.',
    Shoes: woman ? 'Shoes: closed-toe for business/funeral; heels/flats/wedges/boots by occasion; coordinate with bag/hardware; leather/satin for formal.' : 'Shoes: black/brown leather matched to belt; oxfords formal; loafers casual.',
    Skirt: woman ? 'Skirt: knee or longer for business/funeral; cocktail length for wedding/date; pencil/A-line/pleated; neutral solid formal; prints wedding/date.' : '',
    Dress: woman ? 'Dress: full look excludes pants/skirt/blouse; fabric/colour by occasion; avoid white/ivory at weddings; closed-toe for funeral/formal.' : '',
    Handbag: woman ? 'Handbag/Clutch: small clutch neutral/metallic formal; structured tote business; coordinated statement date.' : '',
    Jewelry: woman ? 'Jewelry: minimal formal/funeral/business; statement date/wedding guest; metal tone coordinates with watch/bag hardware.' : '',
    'Pocket Square': 'Pocket square: echo one colour from tie/shirt; avoid identical match; white linen safest formal; silk richer formal; cotton/linen casual; pattern quieter than tie.'
  };
  return rules[g] || '';
}

export function rulesFor(occ, currentGarment, selMap, genderInfo) {
  const parts = [];
  const c = occ?.category, v = occ?.variant;
  const isWoman = (genderInfo?.who || 'man') === 'woman';
  if (c === 'wedding') parts.push(isWoman ? (v === 'closeFamily' ? 'Woman wedding (close family): elegant dresses/separates, avoid white; pastel for day, jewel for evening.' : 'Woman wedding (guest): elegant midi/cocktail dress or separates; avoid matching bride/bridesmaids, avoid white.') : (v === 'closeFamily' ? 'Men wedding close family: dark suit, tie required, avoid bright patterns.' : 'Men wedding guest: dark suit, white shirt, muted tie, avoid bright patterns.'));
  if (c === 'funeral') parts.push(isWoman ? 'Woman funeral: dark modest dress/suit, closed-toe shoes, minimal jewelry.' : 'Men funeral: dark colours only (black/charcoal), plain patterns, dark tie.');
  if (c === 'formalBusiness') parts.push(isWoman ? 'Woman formal business: tailored suit/skirt or sheath + blazer, blouse in navy/charcoal/white.' : 'Men formal business: navy/charcoal suit, white or light blue shirt, matching tie, no bright patterns.');
  if (c === 'informalMeeting') parts.push('Date / Smart casual: polished but relaxed; jacket optional, no tie required; clean, venue-appropriate look.');
  if (isWoman) {
    parts.push('Woman styling: funeral/formal modest; shoes/bag/hardware coordinate; jewelry minimal for formal/funeral.');
  } else {
    parts.push('Men styling: as above.');
  }
  const gsr = garmentSpecificRules(currentGarment, isWoman);
  if (gsr) parts.push('Garment rules: ' + gsr);
  parts.push('Colour guidance: black signals formality/sadness (funeral/formal); navy/charcoal for business; white/light-blue shirts; belt and watch strap should match shoes; watch case metal (silver/gold) may match other accessories; avoid identical primary and secondary unless plain.');
  const entries = Object.entries(selMap || {}).filter(([g,sel]) => sel && (sel.color||sel.strap||sel.type));
  if (entries.length) parts.push('Already selected: ' + entries.map(([g,sel]) => g + '=' + (sel.color||sel.strap||sel.case||sel.dial||sel.type||'')).join(', ') + '. Complement these (belt/watch strap match shoes).');
  if (currentGarment) parts.push('Now selecting: ' + currentGarment + '.');
  return parts.join(' ');
}
