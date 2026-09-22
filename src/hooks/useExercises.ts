import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '../db/db';
import type { Exercise } from '../db/types';

/** Alle Übungen, alphabetisch sortiert. `undefined` während des Ladens. */
export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(
    async () => (await db.exercises.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [],
  );
}

export function useExerciseMap(): Map<string, Exercise> | undefined {
  const exercises = useExercises();
  return useMemo(() => exercises && new Map(exercises.map((e) => [e.id, e])), [exercises]);
}
