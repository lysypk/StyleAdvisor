import { writable } from 'svelte/store';

const STORAGE_KEY = 'style-advisor-wardrobe';

const ALLOWED_TYPES = ['Shirt','Jacket','Tie','Belt','Watch','Pants','Shoes','Blouse','Skirt','Dress','Handbag','Jewelry','Pocket Square'];
const ALLOWED_COLORS = ['red','white','black','blue','grey','green','yellow','brown','purple','navy','charcoal','silver','royal blue','gold','ivory','beige','emerald','burgundy','sapphire','pastel pink','pastel blue','floral print','nude','rose gold','pearl'];
const PATTERNS = ['Plain','Stripes','Checks','Dots', 'Melange','Houndstooth','Pinstripes', 'Geometric', 'Floral'];

function toTitleCase(value) {
  if (typeof value !== 'string') return value;
  return value.split(' ').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
}

function load() {
  try { const raw = localStorage.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch (e) { return []; }
}
export const wardrobeItems = writable(load());
wardrobeItems.subscribe(value => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (e) {}
});

export function addItem(item) {
  wardrobeItems.update(items => [...items, { ...item, id: crypto.randomUUID() }]);
}

export function removeItem(id) {
  wardrobeItems.update(items => items.filter(i => i.id !== id));
}

export function updateItem(id, patch) {
  wardrobeItems.update(items => items.map(i => i.id === id ? { ...i, ...patch } : i));
}

export function exportJson() {
  const blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'wardrobe.json'; a.click();
  URL.revokeObjectURL(url);
}

export function importJsonText(text) {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('Expected an array');

  const normalized = [];
  const errors = [];
  parsed.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`item ${index} must be an object`);
      return;
    }

    if (!ALLOWED_TYPES.includes(item.type)) {
      errors.push(`item ${index} has an unsupported type`);
      return;
    }

    const gender = item.gender === 'woman' ? 'woman' : 'man';
    const color = typeof item.color === 'string' ? (ALLOWED_COLORS.includes(item.color.toLowerCase()) ? toTitleCase(item.color.toLowerCase()) : null) : item.color;
    const pattern = typeof item.pattern === 'string' ? PATTERNS.includes(item.pattern) ? item.pattern : null : item.pattern;
    const secondary = typeof item.secondary === 'string' ? toTitleCase(item.secondary.toLowerCase()) : item.secondary;
    const normalizedItem = {
      id: item.id ? item.id : crypto.randomUUID(),
      gender,
      type: item.type,
      color,
      pattern,
      secondary: secondary || null,
      itemType: item.itemType ?? null,
      name: typeof item.name === 'string' ? item.name.trim() || null : null
    };
    if (item.type === 'Watch') {
      normalizedItem.color = null;
      normalizedItem.pattern = null;
      normalizedItem.strap = String(item.strap || '').trim();
      normalizedItem.case = String(item.case || '').trim();
      normalizedItem.dial = String(item.dial || '').trim();
    }
    normalized.push(normalizedItem);
  });

  wardrobeItems.set(normalized);
  return { imported: normalized.length, skipped: errors.length, errors };
}
