import type { Exercise, ExerciseMeasure } from '../db/types';

// Automatische Erkennung am Namen. Erweiterbar – oder im Plan-Editor je Übung umstellen.

/** Halteübungen, gemessen in Sekunden. */
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

/** Übungen mit dem eigenen Körpergewicht als Last (plus optionalem Zusatzgewicht). */
const BODYWEIGHT_NAMES = [/klimmz(ü|ue|u)g/i, /pull-?\s?ups?\b/i, /chin-?\s?ups?\b/i];

/** Übungen, bei denen nur die Wiederholungen zählen – es wird nicht der ganze Körper bewegt. */
const REPS_ONLY_NAMES = [/leg\s*-?\s*raises?/i, /beinheben/i, /knee\s*-?\s*raises?/i, /knieheben/i];

export function guessMeasure(name: string): ExerciseMeasure {
  if (TIME_BASED_NAMES.some((pattern) => pattern.test(name))) return 'time';
  if (BODYWEIGHT_NAMES.some((pattern) => pattern.test(name))) return 'bodyweight';
  if (REPS_ONLY_NAMES.some((pattern) => pattern.test(name))) return 'repsOnly';
  return 'reps';
}

/** Messart einer Übung: gespeicherter Wert, sonst aus dem Namen abgeleitet (z. B. Klimmzug → Körpergewicht). */
export function exerciseMeasure(exercise: Pick<Exercise, 'name' | 'measure'> | undefined): ExerciseMeasure {
  if (!exercise) return 'reps';
  return exercise.measure ?? guessMeasure(exercise.name);
}
