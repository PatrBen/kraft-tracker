import { describe, expect, it } from 'vitest';
import {
  addPeriods,
  averageByPeriod,
  isoWeek,
  periodLabel,
  startOfPeriod,
  sumByPeriod,
} from './periods';

describe('startOfPeriod', () => {
  const wed = new Date(2026, 8, 23, 17, 45); // Mittwoch, 23.09.2026

  it('liefert Tages-, Wochen- (Montag), Monats- und Jahresbeginn', () => {
    expect(startOfPeriod(wed, 'day')).toEqual(new Date(2026, 8, 23));
    expect(startOfPeriod(wed, 'week')).toEqual(new Date(2026, 8, 21));
    expect(startOfPeriod(wed, 'month')).toEqual(new Date(2026, 8, 1));
    expect(startOfPeriod(wed, 'year')).toEqual(new Date(2026, 0, 1));
  });

  it('zählt den Sonntag zur vorangehenden Woche', () => {
    expect(startOfPeriod(new Date(2026, 8, 27, 12), 'week')).toEqual(new Date(2026, 8, 21));
  });
});

describe('isoWeek', () => {
  it('berechnet Kalenderwochen auch über den Jahreswechsel', () => {
    expect(isoWeek(new Date(2026, 8, 23))).toEqual({ year: 2026, week: 39 });
    expect(isoWeek(new Date(2021, 0, 3))).toEqual({ year: 2020, week: 53 });
    expect(isoWeek(new Date(2024, 11, 30))).toEqual({ year: 2025, week: 1 });
  });

  it('beschriftet Wochen mit der KW', () => {
    expect(periodLabel(new Date(2026, 8, 21), 'week')).toBe('KW 39');
  });
});

describe('sumByPeriod', () => {
  const now = new Date(2026, 8, 23, 20);

  it('summiert je Tag und füllt leere Tage mit 0', () => {
    const result = sumByPeriod(
      [
        { date: new Date(2026, 8, 23, 8), value: 12 },
        { date: new Date(2026, 8, 23, 18), value: 12 },
        { date: new Date(2026, 8, 21, 9), value: 15 },
        { date: new Date(2026, 7, 1), value: 99 }, // außerhalb des Fensters
      ],
      'day',
      3,
      now,
    );
    expect(result.map((r) => [r.start.getDate(), r.value, r.count])).toEqual([
      [21, 15, 1],
      [22, 0, 0],
      [23, 24, 2],
    ]);
  });

  it('fasst Monate korrekt zusammen', () => {
    const result = sumByPeriod(
      [
        { date: new Date(2026, 7, 31, 23), value: 10 },
        { date: new Date(2026, 8, 1, 0, 30), value: 20 },
      ],
      'month',
      2,
      now,
    );
    expect(result.map((r) => r.value)).toEqual([10, 20]);
  });
});

describe('averageByPeriod', () => {
  it('mittelt je Woche und lässt Wochen ohne Messung weg', () => {
    const result = averageByPeriod(
      [
        { date: new Date(2026, 8, 21), value: 82 },
        { date: new Date(2026, 8, 23), value: 81 },
        { date: new Date(2026, 8, 7), value: 84 },
      ],
      'week',
    );
    expect(result.map((r) => [r.start.getDate(), r.value])).toEqual([
      [7, 84],
      [21, 81.5],
    ]);
  });

  it('begrenzt auf die letzten n Zeiträume', () => {
    const now = new Date(2026, 8, 23);
    const result = averageByPeriod(
      [
        { date: new Date(2025, 5, 1), value: 90 },
        { date: new Date(2026, 8, 1), value: 80 },
      ],
      'month',
      3,
      now,
    );
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(80);
  });
});

describe('addPeriods', () => {
  it('springt bei Monaten immer auf den Monatsersten', () => {
    expect(addPeriods(new Date(2026, 0, 1), 'month', 1)).toEqual(new Date(2026, 1, 1));
    expect(addPeriods(new Date(2026, 0, 1), 'month', -1)).toEqual(new Date(2025, 11, 1));
  });
});
