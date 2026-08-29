import { describe, it, expect } from 'vitest';
import { categoryXAxis } from './categoryAxis.js';

const STATUS_LABELS = {
  1: 'Programada',
  2: 'En curso',
  3: 'Completada',
  4: 'Cancelada',
};

describe('categoryXAxis', () => {
  it('uses integer increments and exact category splits so labels are unique', () => {
    const axis = categoryXAxis(STATUS_LABELS);

    expect(axis.incrs).toEqual([1]);
    expect(axis.splits()).toEqual([1, 2, 3, 4]);

    const ticks = axis.values(null, axis.splits());
    expect(ticks).toEqual(['Programada', 'En curso', 'Completada', 'Cancelada']);
    expect(new Set(ticks).size).toBe(ticks.length);
  });

  it('does not emit half-step splits that would duplicate rounded labels', () => {
    const axis = categoryXAxis({ 1: 'mar 2026', 2: 'abr 2026' });

    expect(axis.splits()).not.toContain(1.5);
    expect(axis.values(null, axis.splits())).toEqual(['mar 2026', 'abr 2026']);
  });
});
