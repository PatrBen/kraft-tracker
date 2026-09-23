import { bodyWeightAt } from '../utils/bodyWeight';
import { exerciseMeasure } from '../utils/exerciseMeasure';
import { sessionFileName, sessionToText, type SessionTextExercise } from '../utils/sessionText';
import { db } from './db';
import { getLastPerformance } from './sessions';

export interface SessionExportText {
  text: string;
  fileName: string;
}

/** Sammelt alles zu einem Training (inkl. "Letztes Mal" und Körpergewicht) und formatiert es als Text. */
export async function buildSessionText(sessionId: string): Promise<SessionExportText | null> {
  const session = await db.workoutSessions.get(sessionId);
  if (!session) return null;

  const sets = await db.sets.where('sessionId').equals(sessionId).sortBy('createdAt');
  // Plan-Übungen in Plan-Reihenfolge, danach evtl. Übungen mit Sätzen, die nicht (mehr) im Plan stehen.
  const exerciseIds = [...new Set([...session.exercises.map((e) => e.exerciseId), ...sets.map((s) => s.exerciseId)])];
  const [exercises, previous, bodyWeights] = await Promise.all([
    db.exercises.bulkGet(exerciseIds),
    Promise.all(exerciseIds.map((id) => getLastPerformance(id, session.startedAt))),
    db.bodyWeights.orderBy('measuredAt').toArray(),
  ]);

  const rows: SessionTextExercise[] = exerciseIds.map((id, i) => ({
    name: exercises[i]?.name ?? 'Unbekannte Übung',
    measure: exerciseMeasure(exercises[i]),
    targetSets: session.exercises.find((e) => e.exerciseId === id)?.targetSets ?? 0,
    sets: sets.filter((s) => s.exerciseId === id),
    previous: previous[i],
  }));

  return {
    text: sessionToText({
      planName: session.planName,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      exercises: rows,
      // Dieselbe Regel wie in Statistik und Tagebuch: Messung bis zum Trainingstag, sonst Standardwert.
      bodyWeight: bodyWeightAt(bodyWeights, session.startedAt),
    }),
    fileName: sessionFileName(session.planName, session.startedAt),
  };
}
