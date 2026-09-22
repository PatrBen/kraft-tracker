import { db } from './db';

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
    return existing ? existing.id : db.exercises.add({ name, createdAt: new Date() });
  });
}
