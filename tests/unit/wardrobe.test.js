import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { addItem, removeItem, importJsonText, wardrobeItems } from '../../src/wardrobe.js';

beforeEach(() => {
  localStorage.clear();
  wardrobeItems.set([]);
});

describe('wardrobe', () => {
  it('adds an item with generated id', () => {
    addItem({ type: 'Shirt', color: 'White', gender: 'man' });
    const items = get(wardrobeItems);
    expect(items.length).toBe(1);
    expect(items[0].id).toBeTruthy();
  });

  it('removes by id', () => {
    addItem({ type: 'Shirt', color: 'White', gender: 'man' });
    const id = get(wardrobeItems)[0].id;
    removeItem(id);
    expect(get(wardrobeItems).length).toBe(0);
  });

  it('imports text and normalizes missing ids', () => {
    importJsonText('[{"type":"Shirt","color":"White"}]');
    const items = get(wardrobeItems);
    expect(items.length).toBe(1);
    expect(items[0].id).toBeTruthy();
  });

  it('rejects non-array imports', () => {
    expect(() => importJsonText('{"a":1}')).toThrow('Expected an array');
  });

  it('normalizes lowercase colours to title case on import', () => {
    importJsonText('[{"type":"Shirt","color":"white"}]');
    const items = get(wardrobeItems);
    expect(items.length).toBe(1);
    expect(items[0].color).toBe('White');
  });

  it('converts unknown colours to null on import', () => {
    importJsonText('[{"type":"Shirt","color":"Neon"}]');
    const items = get(wardrobeItems);
    expect(items.length).toBe(1);
    expect(items[0].color).toBeNull();
  });

  it('preserves Watch strap, case, and dial on import', () => {
    importJsonText('[{"type":"Watch","gender":"woman","strap":"black","case":"gold","dial":"blue"}]');
    const items = get(wardrobeItems);
    expect(items.length).toBe(1);
    expect(items[0].strap).toBe('black');
    expect(items[0].case).toBe('gold');
    expect(items[0].dial).toBe('blue');
    expect(items[0].color).toBeNull();
  });
});
