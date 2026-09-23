import { describe, expect, it } from 'vitest';
import type { WorkoutSet } from '../db/types';
import { bestPerSession, epley1RM, percentChange } from './oneRepMax';

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

describe('bestPerSession', () => {
  const dates = new Map([
    ['s1', new Date(2026, 0, 5)],
    ['s2', new Date(2026, 0, 1)],
    ['s3', new Date(2026, 0, 9)],
  ]);

  it('nimmt pro Session den Satz mit dem höchsten 1RM und sortiert chronologisch', () => {
    const result = bestPerSession(
      [
        set('a', 's1', 100, 5), // 116,67
        set('b', 's1', 90, 10), // 120  ← bestes in Session 1
        set('c', 's2', 80, 8), // 101,33
        set('d', 's3', 105, 3), // 115,5
      ],
      dates,
      'reps',
    );

    expect(result.map((r) => r.sessionId)).toEqual(['s2', 's1', 's3']);
    expect(result[1]).toMatchObject({ weightKg: 90, reps: 10 });
    expect(result[1].value).toBeCloseTo(120, 5);
  });

  it('wertet zeitbasierte Übungen nach der längsten Haltezeit, nicht nach 1RM', () => {
    // 20 kg × 30 s hätte das höhere "1RM", zählt hier aber nur als 30 s.
    const result = bestPerSession([set('a', 's1', 20, 30), set('b', 's1', 0, 45)], dates, 'time');
    expect(result[0]).toMatchObject({ value: 45, reps: 45, weightKg: 0 });
  });

  it('ignoriert Sätze ohne bekannte Session', () => {
    expect(bestPerSession([set('a', 'unbekannt', 100, 5)], dates, 'reps')).toEqual([]);
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
