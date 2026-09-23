import { describe, expect, it } from 'vitest';
import type { BodyWeightEntry } from '../db/types';
import { DEFAULT_BODY_WEIGHT_KG, bodyWeightAt } from './bodyWeight';

const entry = (weightKg: number, measuredAt: Date): BodyWeightEntry => ({ id: String(weightKg), weightKg, measuredAt });

describe('bodyWeightAt', () => {
  const entries = [entry(84, new Date(2026, 8, 10, 7)), entry(83, new Date(2026, 8, 20, 21))];

  it('nimmt 75 kg, wenn es vor dem Training noch keine Messung gab', () => {
    expect(bodyWeightAt([], new Date(2026, 8, 8))).toEqual({ weightKg: DEFAULT_BODY_WEIGHT_KG, measuredAt: null });
    expect(bodyWeightAt(entries, new Date(2026, 8, 8, 18)).weightKg).toBe(75);
  });

  it('nimmt die letzte Messung bis zum Ende des Trainingstags', () => {
    expect(bodyWeightAt(entries, new Date(2026, 8, 15, 18)).weightKg).toBe(84);
    // Messung am Abend desselben Tages zählt noch.
    expect(bodyWeightAt(entries, new Date(2026, 8, 20, 18)).weightKg).toBe(83);
  });

  it('ignoriert spätere Messungen', () => {
    expect(bodyWeightAt(entries, new Date(2026, 8, 19, 23)).weightKg).toBe(84);
  });
});
