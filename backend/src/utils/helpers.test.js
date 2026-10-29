const { monthRange } = require('./helpers');

describe('monthRange', () => {
  it('2026-10 → [2026-10-01, 2026-11-01) UTC', () => {
    const { start, end } = monthRange('2026-10');
    expect(start.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });
});
