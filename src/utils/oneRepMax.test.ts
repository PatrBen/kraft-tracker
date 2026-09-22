import { describe, expect, it } from 'vitest';
import type { WorkoutSet } from '../db/types';
import { bestOneRepMaxPerSession, epley1RM, percentChange } from './oneRepMax';

function set(id: string, sessionId: string, weightKg: number, reps: number): WorkoutSet {
  return { id, sessionId, exerciseId: 'ex1', weightKg, reps, createdAt: new Date(2026, 0, 1) };
}

describe('epley1RM', () => {
  it('berechnet Gewicht × (1 + Wdh/30)', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.333, 3);
    expect(epley1RM(80, 5)).toBeCloseTo(93.333, 3);
    expect(epley1RM(60, 0)).toBe(60);
  });
});

describe('bestOneRepMaxPerSession', () => {
  const dates = new Map([
    ['s1', new Date(2026, 0, 5)],
    ['s2', new Date(2026, 0, 1)],
    ['s3', new Date(2026, 0, 9)],
  ]);

  it('nimmt pro Session den Satz mit dem höchsten 1RM und sortiert chronologisch', () => {
    const result = bestOneRepMaxPerSession(
      [
        set('a', 's1', 100, 5), // 116,67
        set('b', 's1', 90, 10), // 120  ← bestes in Session 1
        set('c', 's2', 80, 8), // 101,33
        set('d', 's3', 105, 3), // 115,5
      ],
      dates,
    );

    expect(result.map((r) => r.sessionId)).toEqual(['s2', 's1', 's3']);
    expect(result[1]).toMatchObject({ weightKg: 90, reps: 10 });
    expect(result[1].oneRepMax).toBeCloseTo(120, 5);
  });

  it('ignoriert Sätze ohne bekannte Session', () => {
    expect(bestOneRepMaxPerSession([set('a', 'unbekannt', 100, 5)], dates)).toEqual([]);
  });
});

describe('percentChange', () => {
  it('berechnet die relative Veränderung', () => {
    expect(percentChange(100, 125)).toBe(25);
    expect(percentChange(120, 90)).toBe(-25);
  });

  it('liefert null ohne sinnvolle Basis', () => {
    expect(percentChange(0, 50)).toBeNull();
  });
});
