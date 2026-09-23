import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getActiveSession, getLastPerformance, type LastPerformance } from '../db/sessions';
import type { WorkoutSession, WorkoutSet } from '../db/types';

export type { LastPerformance };

// Konvention: `undefined` = lädt noch, `null` = existiert nicht.

export function useActiveSession(): WorkoutSession | null | undefined {
  return useLiveQuery(async () => (await getActiveSession()) ?? null, []);
}

export function useSession(id: string): WorkoutSession | null | undefined {
  return useLiveQuery(async () => (await db.workoutSessions.get(id)) ?? null, [id]);
}

export function useSessionSets(sessionId: string): WorkoutSet[] | undefined {
  return useLiveQuery(
    () => db.sets.where('sessionId').equals(sessionId).sortBy('createdAt'),
    [sessionId],
  );
}

export interface SessionSummary {
  session: WorkoutSession;
  setCount: number;
}

/** Alle Sessions, neueste zuerst, mit Anzahl eingetragener Sätze. */
export function useSessionHistory(): SessionSummary[] | undefined {
  return useLiveQuery(async () => {
    const sessions = await db.workoutSessions.orderBy('startedAt').reverse().toArray();
    const counts = await Promise.all(
      sessions.map((s) => db.sets.where('sessionId').equals(s.id).count()),
    );
    return sessions.map((session, i) => ({ session, setCount: counts[i] }));
  }, []);
}

/** Die Sätze der letzten Session vor `before`, in der diese Übung trainiert wurde. */
export function useLastPerformance(
  exerciseId: string,
  before: Date,
): LastPerformance | null | undefined {
  const beforeTime = before.getTime();
  return useLiveQuery(
    () => getLastPerformance(exerciseId, new Date(beforeTime)),
    [exerciseId, beforeTime],
  );
}
