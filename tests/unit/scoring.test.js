import { describe, it, expect } from 'vitest';
import { scoreOutfit, conflictsByGarment } from '../../src/data/scoring.js';

describe('scoring', () => {
  it('penalizes belt and shoe colour mismatch', () => {
    const sel = {
      'man:Belt': { included: true, color: 'Black' },
      'man:Shoes': { included: true, color: 'Brown' }
    };
    const { score, warnings } = scoreOutfit(sel, { category: 'formalBusiness' }, 'man');
    expect(score).toBe(88);
    expect(warnings.join(' ')).toContain('Belt and shoes');
  });

  it('penalizes multiple patterns', () => {
    const sel = {
      'man:Shirt': { included: true, pattern: 'Stripes' },
      'man:Tie': { included: true, pattern: 'Checks' }
    };
    const { score, warnings } = scoreOutfit(sel, { category: 'formalBusiness' }, 'man');
    expect(score).toBe(90);
    expect(warnings.join(' ')).toContain('patterned');
  });

  it('penalizes non-somber funeral tie colour', () => {
    const sel = { 'man:Tie': { included: true, color: 'Red' } };
    const { score, warnings } = scoreOutfit(sel, { category: 'funeral' }, 'man');
    expect(score).toBe(80);
    expect(warnings.join(' ')).toContain('Tie should be dark');
  });

  it('penalizes funeral outer garment colour', () => {
    const sel = { 'man:Shirt': { included: true, color: 'Red' } };
    const { score, warnings } = scoreOutfit(sel, { category: 'funeral' }, 'man');
    expect(score).toBe(92);
    expect(warnings.join(' ')).toContain('colour should stay somber');
  });

  it('penalizes watch strap mismatch', () => {
    const sel = {
      'man:Watch': { included: true, strap: 'Red' },
      'man:Shoes': { included: true, color: 'Black' }
    };
    const { score, warnings } = scoreOutfit(sel, { category: 'formalBusiness' }, 'man');
    expect(score).toBe(92);
    expect(warnings.join(' ')).toContain('Watch strap');
  });

  it('records conflicts for belt/shoe and patterns', () => {
    const sel = {
      'man:Belt': { included: true, color: 'Black' },
      'man:Shoes': { included: true, color: 'Brown' },
      'man:Shirt': { included: true, pattern: 'Stripes' },
      'man:Tie': { included: true, pattern: 'Checks' }
    };
    const conflicts = conflictsByGarment(sel, { category: 'formalBusiness' }, 'man');
    expect(conflicts.Belt).toContain('Belt/shoe colour mismatch');
    expect(conflicts.Shoes).toContain('Belt/shoe colour mismatch');
    expect(conflicts.Shirt).toContain('Pattern clash');
    expect(conflicts.Tie).toContain('Pattern clash');
  });
});
