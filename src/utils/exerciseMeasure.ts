import type { Exercise, ExerciseMeasure } from '../db/types';

// Halteübungen, die in Sekunden gemessen werden. Erweiterbar – oder im Plan-Editor je Übung umschalten.
const TIME_BASED_NAMES = [
  /dead\s*-?\s*hang/i,
  /toter\s*hang/i,
  /plank/i,
  /unterarmst(ü|ue)tz/i,
  /\bl-?sit\b/i,
  /wandsitz/i,
  /wall\s*sit/i,
  /hollow\s*(body\s*)?hold/i,
];

export function guessMeasure(name: string): ExerciseMeasure {
  return TIME_BASED_NAMES.some((pattern) => pattern.test(name)) ? 'time' : 'reps';
}

/** Messart einer Übung: gespeicherter Wert, sonst aus dem Namen abgeleitet (z. B. Deadhang → Sekunden). */
export function exerciseMeasure(exercise: Pick<Exercise, 'name' | 'measure'> | undefined): ExerciseMeasure {
  if (!exercise) return 'reps';
  return exercise.measure ?? guessMeasure(exercise.name);
}
