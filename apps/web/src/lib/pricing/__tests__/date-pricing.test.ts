import { buildDatePrices, DATE_WINDOW_DAYS, getDateFactor } from '../date-pricing';

describe('date-pricing parity window', () => {
  const todayKey = '2026-09-24'; // Thursday

  it('builds the same 21-day window used by the booking calendar', () => {
    const prices = buildDatePrices(10000, todayKey);

    expect(prices).toHaveLength(DATE_WINDOW_DAYS);
    expect(prices.map((entry) => entry.dateKey)).toEqual([
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
    ]);
  });

  it('keeps the explicit date factors stable across the full booking window', () => {
    const factors = Array.from({ length: DATE_WINDOW_DAYS }, (_, index) => {
      const dateKey = buildDatePrices(10000, todayKey)[index].dateKey;
      return Number(getDateFactor(dateKey, todayKey).toFixed(2));
    });

    expect(factors).toEqual([
      1.25,
      1.15,
      1.13,
      1.13,
      1.02,
      1.02,
      1.02,
      0.96,
      0.96,
      1.01,
      1.01,
      0.92,
      0.92,
      0.92,
      0.92,
      0.90,
      0.95,
      0.95,
      0.90,
      0.90,
      0.90,
    ]);
  });

  it('marks only the first three cheapest dates', () => {
    const cheapest = buildDatePrices(10000, todayKey).filter((entry) => entry.cheapest);

    expect(cheapest).toHaveLength(3);
    expect(cheapest.map((entry) => entry.dateKey)).toEqual([
      '2026-10-09',
      '2026-10-12',
      '2026-10-13',
    ]);
  });
});
