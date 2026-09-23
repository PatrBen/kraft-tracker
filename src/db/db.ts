import Dexie from 'dexie';
import dexieCloud, { type DexieCloudTable } from 'dexie-cloud-addon';
import type {
  BodyWeightEntry,
  Exercise,
  PushupEntry,
  WorkoutPlan,
  WorkoutSession,
  WorkoutSet,
} from './types';

// Neuer Name, weil sich der Primärschlüssel geändert hat (++id → @id); IndexedDB kann das
// bei einer bestehenden Tabelle nicht umstellen.
export const db = new Dexie('kraft-tracker-v2', { addons: [dexieCloud] }) as Dexie & {
  exercises: DexieCloudTable<Exercise, 'id'>;
  workoutPlans: DexieCloudTable<WorkoutPlan, 'id'>;
  workoutSessions: DexieCloudTable<WorkoutSession, 'id'>;
  sets: DexieCloudTable<WorkoutSet, 'id'>;
  pushups: DexieCloudTable<PushupEntry, 'id'>;
  bodyWeights: DexieCloudTable<BodyWeightEntry, 'id'>;
};

// `@id` = global eindeutige String-ID, erzeugt beim Anlegen. Nur indizierte Felder stehen im
// Schema; alle anderen Felder werden trotzdem gespeichert.
db.version(1).stores({
  exercises: '@id, name',
  workoutPlans: '@id, name',
  workoutSessions: '@id, planId, startedAt',
  sets: '@id, sessionId, exerciseId, [sessionId+exerciseId], [exerciseId+createdAt]',
});

// v2: Liegestütz-Zähler und Körpergewicht. Bestehende Tabellen bleiben unverändert.
db.version(2).stores({
  pushups: '@id, doneAt',
  bodyWeights: '@id, measuredAt',
});

/** URL der Dexie-Cloud-Datenbank aus `.env`. Ohne URL läuft die App rein lokal. */
export const cloudDatabaseUrl: string | undefined = import.meta.env.VITE_DEXIE_CLOUD_URL || undefined;

if (cloudDatabaseUrl) {
  db.cloud.configure({
    databaseUrl: cloudDatabaseUrl,
    // Ohne Login nutzbar; nach dem Login werden lokal erfasste Daten ins Konto übernommen.
    requireAuth: false,
    // Eigener, deutscher Login-Dialog im App-Design (CloudLoginDialog).
    customLoginGui: true,
    // Nur Login per E-Mail-Code, keine Google/GitHub-Weiterleitungen.
    socialAuth: false,
  });
}
