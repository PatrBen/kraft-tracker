import type { BodyWeightEntry, ExerciseMeasure, WorkoutSet } from '../db/types';
import { bodyWeightAt, DEFAULT_BODY_WEIGHT_KG, type BodyWeightAt } from './bodyWeight';

/** Geschätztes 1RM nach Epley: Gewicht × (1 + Wiederholungen / 30). */
export function epley1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

/**
 * Kennzahl eines Satzes für die Statistik:
 * - `reps`: geschätztes 1RM aus Gewicht × Wiederholungen
 * - `bodyweight`: geschätztes 1RM aus (Körpergewicht + Zusatzgewicht) × Wiederholungen
 * - `repsOnly`: Anzahl der Wiederholungen
 * - `time`: Haltezeit in Sekunden
 */
export function setScore(
  set: Pick<WorkoutSet, 'weightKg' | 'reps'>,
  measure: ExerciseMeasure,
  bodyWeightKg = DEFAULT_BODY_WEIGHT_KG,
): number {
  switch (measure) {
    case 'time':
    case 'repsOnly':
      return set.reps;
    case 'bodyweight':
      return epley1RM(bodyWeightKg + set.weightKg, set.reps);
    case 'reps':
      return epley1RM(set.weightKg, set.reps);
  }
}

export interface SessionBest {
  sessionId: string;
  date: Date;
  /** 1RM in kg bzw. Haltezeit in Sekunden – je nach Messart. */
  value: number;
  /** Der Satz, aus dem der Bestwert der Session stammt. */
  weightKg: number;
  reps: number;
  /** Nur bei Körpergewichtsübungen: das verwendete Körpergewicht. */
  bodyWeight: BodyWeightAt | null;
}

/**
 * Bester Satz pro Session nach `setScore`, chronologisch aufsteigend sortiert.
 * Sätze, deren Session in `sessionDates` fehlt, werden ignoriert. Für Körpergewichtsübungen
 * gilt das Körpergewicht am Trainingstag (`bodyWeights` chronologisch sortiert).
 */
export function bestPerSession(
  sets: WorkoutSet[],
  sessionDates: Map<string, Date>,
  measure: ExerciseMeasure,
  bodyWeights: BodyWeightEntry[] = [],
): SessionBest[] {
  const bestBySession = new Map<string, SessionBest>();

  for (const set of sets) {
    const date = sessionDates.get(set.sessionId);
    if (!date) continue;

    const bodyWeight = measure === 'bodyweight' ? bodyWeightAt(bodyWeights, date) : null;
    const value = setScore(set, measure, bodyWeight?.weightKg);
    const current = bestBySession.get(set.sessionId);
    if (!current || value > current.value) {
      bestBySession.set(set.sessionId, {
        sessionId: set.sessionId,
        date,
        value,
        weightKg: set.weightKg,
        reps: set.reps,
        bodyWeight,
      });
    }
  }

  return [...bestBySession.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.sessionId.localeCompare(b.sessionId),
  );
}

/** Prozentuale Veränderung von `first` zu `current`; `null`, wenn `first` keine sinnvolle Basis ist. */
export function percentChange(first: number, current: number): number | null {
  if (!(first > 0)) return null;
  return ((current - first) / first) * 100;
}
