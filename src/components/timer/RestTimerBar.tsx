import { useRestTimer } from '../../hooks/useRestTimer';
import { formatClock } from '../../utils/format';

/** Fest am unteren Rand, auf allen Seiten sichtbar, solange eine Pause läuft oder abgelaufen ist. */
export function RestTimerBar() {
  const { status, remainingSec, progress, adjust, stop } = useRestTimer();

  if (status === 'idle') return null;

  if (status === 'finished') {
    return (
      <>
        <div className="timer-flash" aria-hidden="true" />
        <div className="timer-bar timer-bar--finished" role="alert">
          <div className="timer-bar__inner">
            <span className="timer-bar__done">Pause vorbei – nächster Satz!</span>
            <button type="button" className="btn timer-bar__btn" onClick={stop}>
              OK
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="timer-bar" role="timer" aria-label="Pausentimer">
      <div className="timer-bar__progress" style={{ transform: `scaleX(${progress})` }} />
      <div className="timer-bar__inner">
        <div className="timer-bar__readout">
          <span className="timer-bar__label">Pause</span>
          <span className="timer-bar__time">{formatClock(remainingSec)}</span>
        </div>
        <div className="timer-bar__actions">
          <button
            type="button"
            className="btn timer-bar__btn"
            onClick={() => adjust(-15)}
            aria-label="15 Sekunden weniger"
          >
            −15 s
          </button>
          <button
            type="button"
            className="btn timer-bar__btn"
            onClick={() => adjust(15)}
            aria-label="15 Sekunden mehr"
          >
            +15 s
          </button>
          <button type="button" className="btn timer-bar__btn" onClick={stop}>
            Überspringen
          </button>
        </div>
      </div>
    </div>
  );
}
