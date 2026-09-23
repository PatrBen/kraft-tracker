// IDs sind global eindeutige Strings (von Dexie Cloud erzeugt), damit Einträge von Handy und PC
// beim Synchronisieren nie kollidieren. Dexie Cloud ergänzt jede Zeile zusätzlich um `owner`
// und `realmId` (Zugriffsrechte) – die tauchen hier bewusst nicht auf.

/**
 * Wie eine Übung gemessen wird:
 * - `reps`: Gewicht × Wiederholungen (Langhantel, Maschine …)
 * - `bodyweight`: (Körpergewicht + Zusatzgewicht) × Wiederholungen (Klimmzüge …)
 * - `time`: Haltezeit in Sekunden (Deadhang, Plank …)
 */
export type ExerciseMeasure = 'reps' | 'bodyweight' | 'time';

/** Eine Übung aus der Übungsbibliothek, z. B. "Bankdrücken". */
export interface Exercise {
  id: string;
  name: string;
  /** Fehlt bei älteren Übungen – dann entscheidet der Name (siehe utils/exerciseMeasure.ts). */
  measure?: ExerciseMeasure;
  createdAt: Date;
}

/** Eintrag in einem Plan (bzw. Session-Snapshot): welche Übung mit wie vielen Ziel-Sätzen. */
export interface PlanExercise {
  exerciseId: string;
  targetSets: number;
}

/** Trainingsplan, z. B. "Push-Tag". Die Übungsreihenfolge ist die Array-Reihenfolge. */
export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: PlanExercise[];
  createdAt: Date;
}

/**
 * Eine konkrete Trainingseinheit. `exercises` ist eine Kopie der Plan-Übungen zum
 * Startzeitpunkt, damit spätere Plan-Änderungen die Historie nicht verfälschen.
 */
export interface WorkoutSession {
  id: string;
  planId: string | null;
  planName: string;
  exercises: PlanExercise[];
  startedAt: Date;
  /** `null` solange die Session läuft. */
  endedAt: Date | null;
}

/** Ein absolvierter Satz. Heißt `WorkoutSet`, um nicht mit dem JS-`Set` zu kollidieren. */
export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  /** Bei Körpergewichts- und Halteübungen nur das Zusatzgewicht (meist 0). */
  weightKg: number;
  /**
   * Wiederholungen – bei zeitbasierten Übungen (measure 'time') die Haltezeit in Sekunden.
   * Bewusst dasselbe Feld, damit bereits synchronisierte Sätze gültig bleiben.
   */
  reps: number;
  createdAt: Date;
}

/** Ein Eintrag im Liegestütz-Zähler, z. B. 12 Stück um 14:03 Uhr. */
export interface PushupEntry {
  id: string;
  count: number;
  doneAt: Date;
}

/** Eine Messung des Körpergewichts. */
export interface BodyWeightEntry {
  id: string;
  weightKg: number;
  measuredAt: Date;
}
