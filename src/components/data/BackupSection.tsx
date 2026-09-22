import { useRef, useState, type ChangeEvent } from 'react';
import { exportBackup, restoreBackup } from '../../db/backup';
import { parseBackup } from '../../utils/backupFormat';
import { downloadTextFile } from '../../utils/download';
import { formatDate, pluralize, toDateInputValue } from '../../utils/format';

const LAST_BACKUP_KEY = 'kraft-tracker:last-backup';

function readLastBackup(): Date | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    return raw ? new Date(raw) : null;
  } catch {
    return null;
  }
}

export function BackupSection() {
  const [lastBackup, setLastBackup] = useState(readLastBackup);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const now = new Date();
    downloadTextFile(await exportBackup(), `kraft-tracker-backup-${toDateInputValue(now)}.json`);
    try {
      localStorage.setItem(LAST_BACKUP_KEY, now.toISOString());
    } catch {
      // nur eine Anzeige-Hilfe
    }
    setLastBackup(now);
    setStatus({ ok: true, text: 'Backup-Datei wurde erstellt.' });
  };

  const handleFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // damit dieselbe Datei erneut gewählt werden kann
    if (!file) return;

    try {
      const data = parseBackup(await file.text());
      const summary = `${pluralize(data.workoutSessions.length, 'Training', 'Trainings')}, ${pluralize(data.sets.length, 'Satz', 'Sätze')} und ${pluralize(data.workoutPlans.length, 'Plan', 'Pläne')}`;
      const question =
        `Backup mit ${summary} wiederherstellen?\n\n` +
        'Einträge aus dem Backup werden eingefügt bzw. auf den Stand des Backups zurückgesetzt. ' +
        'Alles, was nicht im Backup ist, bleibt erhalten.';
      if (!window.confirm(question)) return;

      await restoreBackup(data);
      setStatus({ ok: true, text: `Wiederhergestellt: ${summary}.` });
    } catch (err) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : 'Import fehlgeschlagen.' });
    }
  };

  return (
    <div className="card">
      <h2 className="card__title">Backup</h2>
      <p className="muted card__text">
        Sichert alle Pläne, Trainings und Sätze in einer Datei. Bewahre sie z. B. in deiner Cloud
        oder per Mail auf – damit kannst du alles jederzeit wiederherstellen.
      </p>
      <p className="card__text">
        Letztes Backup: <strong>{lastBackup ? formatDate(lastBackup) : 'noch keins'}</strong>
      </p>

      <div className="card__actions">
        <button type="button" className="btn btn--primary" onClick={handleExport}>
          Backup herunterladen
        </button>
        <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
          Backup importieren …
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleFileChosen}
        />
      </div>

      {status && (
        <p className={status.ok ? 'success' : 'error'} role="status">
          {status.text}
        </p>
      )}
    </div>
  );
}
