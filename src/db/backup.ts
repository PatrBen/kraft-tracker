import { serializeBackup, type BackupData } from '../utils/backupFormat';
import { db } from './db';

const TABLES = () => [db.exercises, db.workoutPlans, db.workoutSessions, db.sets, db.pushups, db.bodyWeights];

/** Alle Daten als JSON-Text (siehe utils/backupFormat.ts). */
export async function exportBackup(): Promise<string> {
  const data = await db.transaction('r', TABLES(), async () => ({
    exercises: await db.exercises.toArray(),
    workoutPlans: await db.workoutPlans.toArray(),
    workoutSessions: await db.workoutSessions.toArray(),
    sets: await db.sets.toArray(),
    pushups: await db.pushups.toArray(),
    bodyWeights: await db.bodyWeights.toArray(),
  }));
  return serializeBackup(data);
}

/**
 * Stellt ein Backup wieder her: Jeder Eintrag wird anhand seiner ID eingefügt oder
 * überschrieben. Einträge, die nicht im Backup sind, bleiben erhalten – ein Import löscht nie.
 * Mit aktivem Sync landen die wiederhergestellten Daten automatisch auch auf den anderen Geräten.
 */
export async function restoreBackup(data: BackupData): Promise<void> {
  await db.transaction('rw', TABLES(), async () => {
    await db.exercises.bulkPut(data.exercises);
    await db.workoutPlans.bulkPut(data.workoutPlans);
    await db.workoutSessions.bulkPut(data.workoutSessions);
    await db.sets.bulkPut(data.sets);
    await db.pushups.bulkPut(data.pushups);
    await db.bodyWeights.bulkPut(data.bodyWeights);
  });
}
