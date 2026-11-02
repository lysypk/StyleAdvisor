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
});
