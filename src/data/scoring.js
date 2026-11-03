import { t } from '../i18n.ts';
import { get as getStore } from 'svelte/store';

function addConflict(conflicts, g, label) {
  if (!g) return;
  conflicts[g] = conflicts[g] || [];
  if (!conflicts[g].includes(label)) conflicts[g].push(label);
}
export function scoreOutfit(selMap, occasion, who = 'man') {
  const map = selMap || {};
  const get = (g) => map[`${who}:${g}`];
  const warnings = [];
  const tr = (key) => getStore(t)(key);
  let score = 100;
  const category = occasion?.category || '';

  const belt = get('Belt');
  const shoes = get('Shoes');
  if (belt && shoes && belt.included !== false && shoes.included !== false) {
    const beltColor = belt.color;
    const shoeColor = shoes.color;
    if (beltColor && shoeColor && beltColor !== shoeColor) {
      warnings.push(tr('warning_belt_shoes'));
      score -= 12;
    }
  }

  const namedGarments = ['Shirt', 'Jacket', 'Tie', 'Pants', 'Skirt', 'Blouse', 'Dress'];
  const patterns = namedGarments.map(get).filter((s) => s && s.included !== false && s.pattern && s.pattern !== 'Plain');
  if (patterns.length >= 2) {
    warnings.push(tr('warning_multiple_patterns'));
    score -= 10;
  }

  if (category === 'funeral') {
    const tie = get('Tie');
    if (tie && tie.included !== false) {
      const tieColor = String(tie.color || '').toLowerCase();
      if (!['black', 'charcoal', 'navy', 'burgundy'].includes(tieColor)) {
        warnings.push(tr('warning_funeral_tie'));
        score -= 20;
      }
    }
    for (const g of ['Shirt', 'Blouse', 'Jacket']) {
      const s = get(g);
      if (s && s.included !== false) {
        const c = String(s.color || '').toLowerCase();
        if (c && !['black', 'charcoal', 'navy', 'grey', 'white'].includes(c)) {
        const name = tr(`garment_${g}`);
        warnings.push(tr('warning_funeral_colour').replace('{garment}', name));
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
      warnings.push(tr('warning_watch_strap'));
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
