import {
  toLondonDateKey,
  todayLondonKey,
  addDaysToKey,
  weekdayOfKey,
  londonWallTimeToUtc,
} from '../london';

// Fixed UTC instants used across tests
// 2026-09-24T23:30:00Z = 2026-09-25 00:30 BST → should key as 2026-09-25
const LATE_NIGHT_BST_UTC = new Date('2026-09-24T23:30:00Z');
// 2026-01-15T01:00:00Z = 2026-01-15 01:00 GMT → should key as 2026-01-15
const WINTER_UTC = new Date('2026-01-15T01:00:00Z');
// 2026-03-29T01:00:00Z = 2026-03-29 02:00 BST (clocks spring forward at 01:00 → 02:00)
const DST_SPRING_UTC = new Date('2026-03-29T02:00:00Z'); // 03:00 BST
// 2026-10-25T01:30:00Z = 2026-10-25 01:30 BST still (clocks fall back at 02:00 → 01:00)
const DST_FALL_UTC = new Date('2026-10-25T01:30:00Z'); // still BST

describe('toLondonDateKey', () => {
  it('advances to next calendar day in BST for a late-night UTC instant', () => {
    // 23:30 UTC on 24th = 00:30 BST on 25th
    expect(toLondonDateKey(LATE_NIGHT_BST_UTC)).toBe('2026-09-25');
  });

  it('returns same day in GMT for a winter instant', () => {
    expect(toLondonDateKey(WINTER_UTC)).toBe('2026-01-15');
  });

  it('handles the BST spring-forward day', () => {
    // 02:00 UTC on 2026-03-29 = 03:00 BST
    expect(toLondonDateKey(DST_SPRING_UTC)).toBe('2026-03-29');
  });

  it('handles the BST fall-back day', () => {
    // 01:30 UTC on 2026-10-25 = 01:30 BST (before the 02:00→01:00 rollback)
    expect(toLondonDateKey(DST_FALL_UTC)).toBe('2026-10-25');
  });
});

describe('todayLondonKey', () => {
  it('accepts a fixed now for deterministic output', () => {
    expect(todayLondonKey(LATE_NIGHT_BST_UTC)).toBe('2026-09-25');
    expect(todayLondonKey(WINTER_UTC)).toBe('2026-01-15');
  });
});

describe('addDaysToKey', () => {
  it('adds days without crossing DST boundary incorrectly', () => {
    expect(addDaysToKey('2026-09-24', 1)).toBe('2026-09-25');
    expect(addDaysToKey('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles adding 0 days', () => {
    expect(addDaysToKey('2026-06-15', 0)).toBe('2026-06-15');
  });

  it('handles adding 21 days', () => {
    expect(addDaysToKey('2026-09-24', 21)).toBe('2026-10-15');
  });
});

describe('weekdayOfKey', () => {
  // 2026-09-25 is a Friday
  it('returns 5 for Friday', () => {
    expect(weekdayOfKey('2026-09-25')).toBe(5);
  });

  // 2026-09-27 is a Sunday
  it('returns 0 for Sunday', () => {
    expect(weekdayOfKey('2026-09-27')).toBe(0);
  });

  // 2026-09-26 is a Saturday
  it('returns 6 for Saturday', () => {
    expect(weekdayOfKey('2026-09-26')).toBe(6);
  });

  // 2026-09-28 is a Monday
  it('returns 1 for Monday', () => {
    expect(weekdayOfKey('2026-09-28')).toBe(1);
  });
});

describe('londonWallTimeToUtc', () => {
  it('converts BST morning to UTC correctly (BST = UTC+1)', () => {
    // 08:00 BST on 2026-09-25 = 07:00 UTC
    const result = londonWallTimeToUtc('2026-09-25', 8, 0);
    expect(result.toISOString()).toBe('2026-09-25T07:00:00.000Z');
  });

  it('converts GMT morning to UTC correctly (GMT = UTC+0)', () => {
    // 08:00 GMT on 2026-01-15 = 08:00 UTC
    const result = londonWallTimeToUtc('2026-01-15', 8, 0);
    expect(result.toISOString()).toBe('2026-01-15T08:00:00.000Z');
  });

  it('handles afternoon slot in BST (12:00 BST = 11:00 UTC)', () => {
    const result = londonWallTimeToUtc('2026-09-25', 12, 0);
    expect(result.toISOString()).toBe('2026-09-25T11:00:00.000Z');
  });

  it('handles the spring DST switch day', () => {
    // 2026-03-29: clocks go forward at 01:00 UTC (= 01:00 GMT) → 02:00 BST
    // So 08:00 BST = 07:00 UTC
    const result = londonWallTimeToUtc('2026-03-29', 8, 0);
    expect(result.toISOString()).toBe('2026-03-29T07:00:00.000Z');
  });

  it('handles the fall DST switch day (before fallback)', () => {
    // 2026-10-25: clocks go back at 02:00 BST → 01:00 GMT
    // 08:00 GMT on that day = 08:00 UTC (we're already in GMT post-fallback)
    const result = londonWallTimeToUtc('2026-10-25', 8, 0);
    // After 02:00 BST the offset is 0, so 08:00 wall = 08:00 UTC
    expect(result.toISOString()).toBe('2026-10-25T08:00:00.000Z');
  });
});
