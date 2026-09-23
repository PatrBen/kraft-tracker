import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { buildSessionText, type SessionExportText } from '../../db/sessionExport';
import type { WorkoutSession } from '../../db/types';
import { downloadTextFile } from '../../utils/download';

type Status = { ok: boolean; text: string } | null;

/** Training als Text teilen, speichern oder kopieren – z. B. um es Claude zur Analyse zu geben. */
export function SessionExport({ session }: { session: WorkoutSession }) {
  // Vorab berechnen: Teilen und Kopieren müssen direkt im Klick passieren, sonst blockiert der Browser.
  const exported = useLiveQuery(() => buildSessionText(session.id), [session.id]);
  const [status, setStatus] = useState<Status>(null);
  const canShare = typeof navigator.share === 'function';

  const run = async (action: (exp: SessionExportText) => Promise<string> | string) => {
    if (!exported) return;
    try {
      setStatus({ ok: true, text: await action(exported) });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // Teilen abgebrochen
      setStatus({ ok: false, text: 'Das hat nicht geklappt – versuch es mit „Textdatei“.' });
    }
  };

  const share = async ({ text, fileName }: SessionExportText) => {
    const file = new File([text], fileName, { type: 'text/plain' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
    } else {
      await navigator.share({ title: fileName, text });
    }
    return 'Geteilt.';
  };

  const download = ({ text, fileName }: SessionExportText) => {
    downloadTextFile(text, fileName, 'text/plain;charset=utf-8');
    return `Textdatei „${fileName}“ erstellt.`;
  };

  const copy = async ({ text }: SessionExportText) => {
    await navigator.clipboard.writeText(text);
    return 'Kopiert – du kannst den Text jetzt z. B. in Claude einfügen.';
  };

  return (
    <div className="card session-export">
      <h2 className="card__title">Training als Text</h2>
      <p className="muted card__text">
        Alle Sätze, Bestwerte und der Vergleich zum letzten Mal – z. B. zum Weitergeben an Claude
        für eine Analyse.
      </p>
      <div className="card__actions">
        {canShare && (
          <button type="button" className="btn btn--primary" onClick={() => run(share)} disabled={!exported}>
            Teilen …
          </button>
        )}
        <button
          type="button"
          className={canShare ? 'btn' : 'btn btn--primary'}
          onClick={() => run(download)}
          disabled={!exported}
        >
          Textdatei
        </button>
        <button type="button" className="btn" onClick={() => run(copy)} disabled={!exported}>
          Kopieren
        </button>
      </div>
      {status && (
        <p className={status.ok ? 'success' : 'error'} role="status">
          {status.text}
        </p>
      )}
    </div>
  );
}
