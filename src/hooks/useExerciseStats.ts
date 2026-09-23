import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { ExerciseMeasure } from '../db/types';
import { bestPerSession, type SessionBest } from '../utils/oneRepMax';

/** Bestwert je Session für eine Übung (1RM bzw. Haltezeit), chronologisch. */
export function useExerciseStats(
  exerciseId: string | null,
  measure: ExerciseMeasure,
): SessionBest[] | undefined {
  return useLiveQuery(async () => {
    if (exerciseId === null) return [];

    const sets = await db.sets.where('exerciseId').equals(exerciseId).toArray();
    const sessionIds = [...new Set(sets.map((s) => s.sessionId))];
    const sessions = await db.workoutSessions.bulkGet(sessionIds);

    const sessionDates = new Map<string, Date>();
    for (const session of sessions) {
      if (session) sessionDates.set(session.id, session.startedAt);
    }
    return bestPerSession(sets, sessionDates, measure);
  }, [exerciseId, measure]);
}

/** IDs aller Übungen, zu denen mindestens ein Satz existiert (direkt aus dem Index). */
export function useExerciseIdsWithSets(): Set<string> | undefined {
  return useLiveQuery(
    async () => new Set((await db.sets.orderBy('exerciseId').uniqueKeys()) as string[]),
    [],
  );
}
