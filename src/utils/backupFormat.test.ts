import { describe, expect, it } from 'vitest';
import { parseBackup, serializeBackup, type BackupData } from './backupFormat';

const data: BackupData = {
  exercises: [
    { id: 'exe1', name: 'Bankdrücken', createdAt: new Date('2026-09-01T10:00:00Z') },
    { id: 'exe2', name: 'Deadhang', measure: 'time', createdAt: new Date('2026-09-01T10:00:00Z') },
    { id: 'exe3', name: 'Klimmzug', measure: 'bodyweight', createdAt: new Date('2026-09-01T10:00:00Z') },
  ],
  pushups: [{ id: 'psh1', count: 12, doneAt: new Date('2026-09-22T08:00:00Z') }],
  bodyWeights: [{ id: 'bw1', weightKg: 82.4, measuredAt: new Date('2026-09-22T06:30:00Z') }],
  workoutPlans: [
    {
      id: 'pln1',
      name: 'Push-Tag',
      exercises: [{ exerciseId: 'exe1', targetSets: 3 }],
      createdAt: new Date('2026-09-01T10:00:00Z'),
    },
  ],
  workoutSessions: [
    {
      id: 'ses1',
      planId: 'pln1',
      planName: 'Push-Tag',
      exercises: [{ exerciseId: 'exe1', targetSets: 3 }],
      startedAt: new Date('2026-09-10T16:00:00Z'),
      endedAt: new Date('2026-09-10T17:00:00Z'),
    },
    {
      id: 'ses2',
      planId: null,
      planName: 'Freies Training',
      exercises: [],
      startedAt: new Date('2026-09-12T16:00:00Z'),
      endedAt: null,
    },
  ],
  sets: [
    {
      id: 'set1',
      sessionId: 'ses1',
      exerciseId: 'exe1',
      weightKg: 62.5,
      reps: 8,
      createdAt: new Date('2026-09-10T16:05:00Z'),
    },
  ],
};

describe('Backup-Format', () => {
  it('übersteht Export und Import verlustfrei, inklusive Datumswerten', () => {
    expect(parseBackup(serializeBackup(data))).toEqual(data);
  });

  it('lässt die Dexie-Cloud-Zugriffsfelder weg', () => {
    const withCloudProps = {
      ...data,
      exercises: data.exercises.map((e) => ({ ...e, owner: 'user@example.com', realmId: 'rlm1' })),
    };
    const json = serializeBackup(withCloudProps);
    expect(json).not.toContain('owner');
    expect(json).not.toContain('realmId');
  });

  it('lehnt fremde Dateien und kaputtes JSON ab', () => {
    expect(() => parseBackup('{kaputt')).toThrow('kein gültiges JSON');
    expect(() => parseBackup('{"format":"etwas-anderes"}')).toThrow('keine Kraft-Tracker-Backup-Datei');
  });

  it('liest Backups der Version 1 (ohne Liegestütze und Gewicht) weiterhin ein', () => {
    const file = JSON.parse(serializeBackup(data));
    file.version = 1;
    delete file.pushups;
    delete file.bodyWeights;
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed.pushups).toEqual([]);
    expect(parsed.bodyWeights).toEqual([]);
    expect(parsed.sets).toEqual(data.sets);
  });

  it('lehnt eine unbekannte Messart ab', () => {
    const file = JSON.parse(serializeBackup(data));
    file.exercises[1].measure = 'meter';
    expect(() => parseBackup(JSON.stringify(file))).toThrow('exercises[1].measure');
  });

  it('nennt das fehlerhafte Feld', () => {
    const file = JSON.parse(serializeBackup(data));
    file.sets[0].reps = 'acht';
    expect(() => parseBackup(JSON.stringify(file))).toThrow('sets[0].reps');
  });
});
