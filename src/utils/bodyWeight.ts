import type { BodyWeightEntry } from '../db/types';
import { startOfPeriod, addPeriods } from './periods';

/** Angenommenes Körpergewicht für Trainings vor der ersten Messung. */
export const DEFAULT_BODY_WEIGHT_KG = 75;

export interface BodyWeightAt {
  weightKg: number;
  /** Datum der verwendeten Messung; `null` = Standardwert, weil es noch keine Messung gab. */
  measuredAt: Date | null;
}

/**
 * Körpergewicht zu einem Trainingstag: die letzte Messung bis zum Ende dieses Tages
 * (auch eine abends nach dem Training). Gibt es keine, gilt der Standardwert.
 * `entries` müssen chronologisch sortiert sein.
 */
export function bodyWeightAt(entries: BodyWeightEntry[], date: Date): BodyWeightAt {
  const endOfDay = addPeriods(startOfPeriod(date, 'day'), 'day', 1).getTime();
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].measuredAt.getTime() < endOfDay) {
      return { weightKg: entries[i].weightKg, measuredAt: entries[i].measuredAt };
    }
  }
  return { weightKg: DEFAULT_BODY_WEIGHT_KG, measuredAt: null };
}
