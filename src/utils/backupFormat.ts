import type {
  BodyWeightEntry,
  Exercise,
  ExerciseMeasure,
  PlanExercise,
  PushupEntry,
  WorkoutPlan,
  WorkoutSession,
  WorkoutSet,
} from '../db/types';

export const BACKUP_FORMAT = 'kraft-tracker-backup';
/** v2: + Liegestütze, Körpergewicht, Messart je Übung. v1-Dateien bleiben importierbar. */
export const BACKUP_VERSION = 2;

export interface BackupData {
  exercises: Exercise[];
  workoutPlans: WorkoutPlan[];
  workoutSessions: WorkoutSession[];
  sets: WorkoutSet[];
  pushups: PushupEntry[];
  bodyWeights: BodyWeightEntry[];
}

interface BackupFile extends BackupData {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
}

/** Ohne die Dexie-Cloud-Zugriffsfelder, damit ein Backup in jedes Konto (oder ganz ohne) passt. */
function withoutCloudProps<T extends object>(row: T): T {
  const copy = { ...row } as Record<string, unknown>;
  delete copy.owner;
  delete copy.realmId;
  return copy as T;
}

export function serializeBackup(data: BackupData, exportedAt = new Date()): string {
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: exportedAt.toISOString(),
    exercises: data.exercises.map(withoutCloudProps),
    workoutPlans: data.workoutPlans.map(withoutCloudProps),
    workoutSessions: data.workoutSessions.map(withoutCloudProps),
    sets: data.sets.map(withoutCloudProps),
    pushups: data.pushups.map(withoutCloudProps),
    bodyWeights: data.bodyWeights.map(withoutCloudProps),
  };
  return JSON.stringify(file, null, 2);
}

// ---------- Einlesen mit Prüfung ----------

type Row = Record<string, unknown>;
type Fail = (field: string) => never;

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(row: Row, key: string, fail: Fail): string {
  const value = row[key];
  return typeof value === 'string' && value !== '' ? value : fail(key);
}

function num(row: Row, key: string, fail: Fail): number {
  const value = row[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fail(key);
}

/** JSON kennt keine Dates – sie stehen als ISO-String in der Datei. */
function date(row: Row, key: string, fail: Fail): Date {
  const value = row[key];
  const parsed = typeof value === 'string' ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : fail(key);
}

function planExercises(row: Row, key: string, fail: Fail): PlanExercise[] {
  const value = row[key];
  if (!Array.isArray(value)) return fail(key);
  return value.map((entry) =>
    isRow(entry) && typeof entry.exerciseId === 'string' && typeof entry.targetSets === 'number'
      ? { exerciseId: entry.exerciseId, targetSets: entry.targetSets }
      : fail(key),
  );
}

function isMeasure(value: unknown): value is ExerciseMeasure {
  return value === 'reps' || value === 'bodyweight' || value === 'time';
}

function list<T>(value: unknown, table: string, parseRow: (row: Row, fail: Fail) => T): T[] {
  if (!Array.isArray(value)) throw new Error(`Ungültige Backup-Datei: „${table}“ fehlt.`);
  return value.map((row, index) => {
    const fail: Fail = (field) => {
      throw new Error(`Ungültige Backup-Datei: ${table}[${index}].${field} fehlt oder ist ungültig.`);
    };
    return isRow(row) ? parseRow(row, fail) : fail('(Eintrag)');
  });
}

/** Liest eine Backup-Datei ein und prüft jede Zeile; wirft bei Fehlern mit verständlicher Meldung. */
export function parseBackup(text: string): BackupData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.');
  }
  if (!isRow(raw) || raw.format !== BACKUP_FORMAT) {
    throw new Error('Das ist keine Kraft-Tracker-Backup-Datei.');
  }
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    throw new Error('Das Backup stammt aus einer neueren App-Version – bitte die App aktualisieren.');
  }

  // Tabellen, die es erst seit v2 gibt, fehlen in älteren Backups.
  const sinceV2 = (value: unknown) => (raw.version === 1 && value === undefined ? [] : value);

  return {
    exercises: list(raw.exercises, 'exercises', (row, fail) => ({
      id: str(row, 'id', fail),
      name: str(row, 'name', fail),
      ...(row.measure === undefined
        ? {}
        : { measure: isMeasure(row.measure) ? row.measure : fail('measure') }),
      createdAt: date(row, 'createdAt', fail),
    })),
    workoutPlans: list(raw.workoutPlans, 'workoutPlans', (row, fail) => ({
      id: str(row, 'id', fail),
      name: str(row, 'name', fail),
      exercises: planExercises(row, 'exercises', fail),
      createdAt: date(row, 'createdAt', fail),
    })),
    workoutSessions: list(raw.workoutSessions, 'workoutSessions', (row, fail) => ({
      id: str(row, 'id', fail),
      planId: row.planId === null ? null : str(row, 'planId', fail),
      planName: str(row, 'planName', fail),
      exercises: planExercises(row, 'exercises', fail),
      startedAt: date(row, 'startedAt', fail),
      endedAt: row.endedAt === null ? null : date(row, 'endedAt', fail),
    })),
    sets: list(raw.sets, 'sets', (row, fail) => ({
      id: str(row, 'id', fail),
      sessionId: str(row, 'sessionId', fail),
      exerciseId: str(row, 'exerciseId', fail),
      weightKg: num(row, 'weightKg', fail),
      reps: num(row, 'reps', fail),
      createdAt: date(row, 'createdAt', fail),
    })),
    pushups: list(sinceV2(raw.pushups), 'pushups', (row, fail) => ({
      id: str(row, 'id', fail),
      count: num(row, 'count', fail),
      doneAt: date(row, 'doneAt', fail),
    })),
    bodyWeights: list(sinceV2(raw.bodyWeights), 'bodyWeights', (row, fail) => ({
      id: str(row, 'id', fail),
      weightKg: num(row, 'weightKg', fail),
      measuredAt: date(row, 'measuredAt', fail),
    })),
  };
}
