import type { WorkoutSet } from '../db/types';

/** Geschätztes 1RM nach Epley: Gewicht × (1 + Wiederholungen / 30). */
export function epley1RM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

export interface SessionBest {
  sessionId: string;
  date: Date;
  oneRepMax: number;
  /** Der Satz, aus dem das beste 1RM der Session stammt. */
  weightKg: number;
  reps: number;
}

/**
 * Bestes geschätztes 1RM pro Session, chronologisch aufsteigend sortiert.
 * Sätze, deren Session in `sessionDates` fehlt, werden ignoriert.
 */
export function bestOneRepMaxPerSession(
  sets: WorkoutSet[],
  sessionDates: Map<string, Date>,
): SessionBest[] {
  const bestBySession = new Map<string, SessionBest>();

  for (const set of sets) {
    const date = sessionDates.get(set.sessionId);
    if (!date) continue;

    const oneRepMax = epley1RM(set.weightKg, set.reps);
    const current = bestBySession.get(set.sessionId);
    if (!current || oneRepMax > current.oneRepMax) {
      bestBySession.set(set.sessionId, {
        sessionId: set.sessionId,
        date,
        oneRepMax,
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
