import { describe, it, expect } from 'vitest';
import { parseDashboardFilters } from './dashboardFilters.js';

/** @param {Record<string, string>} entries */
function paramsFrom(entries) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    params.set(key, value);
  }
  return params;
}

describe('parseDashboardFilters', () => {
  it('returns applied filters when from, to, and dentistId are all well-formed', () => {
    const result = parseDashboardFilters(
      paramsFrom({ from: '2026-01-01', to: '2026-06-01', dentistId: '7' }),
    );

    expect(result).toEqual({
      valid: true,
      error: '',
      applied: { from: '2026-01-01', to: '2026-06-01', dentistId: 7 },
      raw: { from: '2026-01-01', to: '2026-06-01', dentistId: '7' },
    });
  });

  it('returns all-null/all-empty valid defaults when no params are present', () => {
    const result = parseDashboardFilters(new URLSearchParams());

    expect(result).toEqual({
      valid: true,
      error: '',
      applied: { from: null, to: null, dentistId: null },
      raw: { from: '', to: '', dentistId: '' },
    });
  });

  it('rejects an inverted range where from is after to', () => {
    const result = parseDashboardFilters(paramsFrom({ from: '2026-06-01', to: '2026-01-01' }));

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.applied).toEqual({ from: null, to: null, dentistId: null });
    expect(result.raw).toEqual({ from: '2026-06-01', to: '2026-01-01', dentistId: '' });
  });

  it('rejects an unparsable from date', () => {
    const result = parseDashboardFilters(paramsFrom({ from: 'not-a-date' }));

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.applied).toEqual({ from: null, to: null, dentistId: null });
    expect(result.raw).toEqual({ from: 'not-a-date', to: '', dentistId: '' });
  });

  it('rejects an unparsable to date', () => {
    const result = parseDashboardFilters(paramsFrom({ to: '31-02-2026' }));

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('accepts a from-only partial range', () => {
    const result = parseDashboardFilters(paramsFrom({ from: '2026-01-01' }));

    expect(result.valid).toBe(true);
    expect(result.error).toBe('');
    expect(result.applied).toEqual({ from: '2026-01-01', to: null, dentistId: null });
  });

  it('accepts a to-only partial range', () => {
    const result = parseDashboardFilters(paramsFrom({ to: '2026-06-01' }));

    expect(result.valid).toBe(true);
    expect(result.error).toBe('');
    expect(result.applied).toEqual({ from: null, to: '2026-06-01', dentistId: null });
  });

  it('rejects a non-numeric dentistId', () => {
    const result = parseDashboardFilters(paramsFrom({ dentistId: 'abc' }));

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.applied).toEqual({ from: null, to: null, dentistId: null });
    expect(result.raw).toEqual({ from: '', to: '', dentistId: 'abc' });
  });
});
