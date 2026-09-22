// IDs sind global eindeutige Strings (von Dexie Cloud erzeugt), damit Einträge von Handy und PC
// beim Synchronisieren nie kollidieren. Dexie Cloud ergänzt jede Zeile zusätzlich um `owner`
// und `realmId` (Zugriffsrechte) – die tauchen hier bewusst nicht auf.

/** Eine Übung aus der Übungsbibliothek, z. B. "Bankdrücken". */
export interface Exercise {
  id: string;
  name: string;
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
  weightKg: number;
  reps: number;
  createdAt: Date;
}
