function addConflict(conflicts, g, label) {
  if (!g) return;
  conflicts[g] = conflicts[g] || [];
  if (!conflicts[g].includes(label)) conflicts[g].push(label);
}
export function scoreOutfit(selMap, occasion, who = 'man', lang = 'en') {
  const map = selMap || {};
  const get = (g) => map[`${who}:${g}`];
  const warnings = [];
  const pl = lang === 'pl';
  let score = 100;
  const category = occasion?.category || '';

  const belt = get('Belt');
  const shoes = get('Shoes');
  if (belt && shoes && belt.included !== false && shoes.included !== false) {
    const beltColor = belt.color;
    const shoeColor = shoes.color;
    if (beltColor && shoeColor && beltColor !== shoeColor) {
      warnings.push(pl ? 'Pasek i buty powinny pasować kolorem.' : 'Belt and shoes should usually match in colour.');
      score -= 12;
    }
  }

  const namedGarments = ['Shirt', 'Jacket', 'Tie', 'Pants', 'Skirt', 'Blouse', 'Dress'];
  const patterns = namedGarments.map(get).filter((s) => s && s.included !== false && s.pattern && s.pattern !== 'Plain');
  if (patterns.length >= 2) {
    warnings.push(pl ? 'Wiele elementów ma wzór; zachowaj tylko jeden wyrazisty wzór, żeby uniknąć chaosu.' : 'Multiple garments are patterned; keep only one bold pattern to avoid clashes.');
    score -= 10;
  }

  if (category === 'funeral') {
    const tie = get('Tie');
    if (tie && tie.included !== false) {
      const tieColor = String(tie.color || '').toLowerCase();
      if (!['black', 'charcoal', 'navy', 'burgundy'].includes(tieColor)) {
        warnings.push(pl ? 'Krawat powinien być ciemny w stylizacji na pogrzeb.' : 'Tie should be dark for a funeral outfit.');
        score -= 20;
      }
    }
    for (const g of ['Shirt', 'Blouse', 'Jacket']) {
      const s = get(g);
      if (s && s.included !== false) {
        const c = String(s.color || '').toLowerCase();
        if (c && !['black', 'charcoal', 'navy', 'grey', 'white'].includes(c)) {
        const name = pl ? ({ Shirt: 'Koszula', Blouse: 'Bluzka', Jacket: 'Marynarka' }[g] || g) : g;
        warnings.push(pl ? `${name}: kolor powinien być stonowany na pogrzeb.` : g + ' colour should stay somber for a funeral.');
          score -= 8;
          break;
        }
      }
    }
  }

  const watch = get('Watch');
  if (watch && watch.included !== false && shoes && shoes.color) {
    const strap = watch.strap;
    if (strap && strap !== shoes.color && !['Silver', 'Gold', 'Black'].includes(strap)) {
      warnings.push(pl ? 'Pasek zegarka powinien współgrać z kolorem butów lub paska.' : 'Watch strap should complement shoes or belt tones.');
      score -= 8;
    }
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), warnings };
}

export function conflictsByGarment(selMap, occasion, who = 'man') {
  const map = selMap || {};
  const get = (g) => map[`${who}:${g}`];
  const conflicts = {};
  const belt = get('Belt');
  const shoes = get('Shoes');
  if (belt && shoes && belt.included !== false && shoes.included !== false && belt.color && shoes.color && belt.color !== shoes.color) {
    addConflict(conflicts, 'Belt', 'Belt/shoe colour mismatch');
    addConflict(conflicts, 'Shoes', 'Belt/shoe colour mismatch');
  }
  const namedGarments = ['Shirt', 'Jacket', 'Tie', 'Pants', 'Skirt', 'Blouse', 'Dress'];
  const patterned = namedGarments.filter((g) => {
    const s = get(g);
    return s && s.included !== false && s.pattern && s.pattern !== 'Plain';
  });
  if (patterned.length >= 2) for (const g of patterned) addConflict(conflicts, g, 'Pattern clash');
  if (occasion?.category === 'funeral') {
    const tie = get('Tie');
    if (tie && tie.included !== false && tie.color) {
      const tc = String(tie.color).toLowerCase();
      if (!['black', 'charcoal', 'navy', 'burgundy'].includes(tc)) addConflict(conflicts, 'Tie', 'Funeral tie colour');
    }
    for (const g of ['Shirt', 'Blouse', 'Jacket']) {
      const s = get(g);
      if (s && s.included !== false && s.color) {
        const c = String(s.color).toLowerCase();
        if (!['black', 'charcoal', 'navy', 'grey', 'white'].includes(c)) { addConflict(conflicts, g, 'Funeral colour'); break; }
      }
    }
  }
  const watch = get('Watch');
  if (watch && watch.included !== false && shoes?.color) {
    const strap = watch.strap;
    if (strap && strap !== shoes.color && !['Silver', 'Gold', 'Black'].includes(strap)) {
      addConflict(conflicts, 'Watch', 'Metal colour mismatch');
    }
  }
  return conflicts;
}
