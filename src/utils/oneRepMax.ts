import type { ExerciseMeasure, WorkoutSet } from '../db/types';

/** Geschätztes 1RM nach Epley: Gewicht × (1 + Wiederholungen / 30). */
export function epley1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

/**
 * Kennzahl eines Satzes für die Statistik: geschätztes 1RM (kg) bei Wiederholungsübungen,
 * Haltezeit (s) bei zeitbasierten Übungen.
 */
export function setScore(set: Pick<WorkoutSet, 'weightKg' | 'reps'>, measure: ExerciseMeasure): number {
  return measure === 'time' ? set.reps : epley1RM(set.weightKg, set.reps);
}

export interface SessionBest {
  sessionId: string;
  date: Date;
  /** 1RM in kg bzw. Haltezeit in Sekunden – je nach Messart. */
  value: number;
  /** Der Satz, aus dem der Bestwert der Session stammt. */
  weightKg: number;
  reps: number;
}

/**
 * Bester Satz pro Session nach `setScore`, chronologisch aufsteigend sortiert.
 * Sätze, deren Session in `sessionDates` fehlt, werden ignoriert.
 */
export function bestPerSession(
  sets: WorkoutSet[],
  sessionDates: Map<string, Date>,
  measure: ExerciseMeasure,
): SessionBest[] {
  const bestBySession = new Map<string, SessionBest>();

  for (const set of sets) {
    const date = sessionDates.get(set.sessionId);
    if (!date) continue;

    const value = setScore(set, measure);
    const current = bestBySession.get(set.sessionId);
    if (!current || value > current.value) {
      bestBySession.set(set.sessionId, {
        sessionId: set.sessionId,
        date,
        value,
        weightKg: set.weightKg,
        reps: set.reps,
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
