import { guessMeasure } from '../utils/exerciseMeasure';
import { db } from './db';
import type { ExerciseMeasure } from './types';

export function normalizeExerciseName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Liefert die ID der Übung mit diesem Namen (Groß-/Kleinschreibung egal) und legt sie bei Bedarf an. */
export async function findOrCreateExercise(rawName: string): Promise<string> {
  const name = normalizeExerciseName(rawName);
  if (!name) throw new Error('Übungsname fehlt');

  const key = name.toLocaleLowerCase('de-DE');
  return db.transaction('rw', db.exercises, async () => {
    const existing = await db.exercises
      .filter((e) => e.name.toLocaleLowerCase('de-DE') === key)
      .first();
    // Messart gleich beim Anlegen festhalten, z. B. "Deadhang" → Sekunden.
    return existing
      ? existing.id
      : db.exercises.add({ name, measure: guessMeasure(name), createdAt: new Date() });
  });
}

/** Wiederholungen ↔ Sekunden umstellen; gilt für alle Pläne und die Statistik dieser Übung. */
export async function setExerciseMeasure(id: string, measure: ExerciseMeasure): Promise<void> {
  await db.exercises.update(id, { measure });
}
