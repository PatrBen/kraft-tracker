import { useId } from 'react';
import { useRestTimer } from '../../hooks/useRestTimer';
import { formatClock } from '../../utils/format';

const DURATION_PRESETS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300];

function formatPreset(seconds: number): string {
  return seconds < 60 ? `${seconds} s` : `${formatClock(seconds)} min`;
}

export function RestTimerSettings() {
  const { settings, updateSettings, start, status } = useRestTimer();
  const selectId = useId();

  return (
    <div className="timer-settings">
      <label htmlFor={selectId} className="timer-settings__label">
        Pausentimer
      </label>
      <select
        id={selectId}
        className="input input--select"
        value={settings.durationSec}
        onChange={(e) => updateSettings({ durationSec: Number(e.target.value) })}
      >
        {DURATION_PRESETS.map((s) => (
          <option key={s} value={s}>
            {formatPreset(s)}
          </option>
        ))}
      </select>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={settings.sound}
          onChange={(e) => updateSettings({ sound: e.target.checked })}
        />
        Ton
      </label>
      <button
        type="button"
        className="btn btn--small timer-settings__start"
        onClick={() => start()}
        disabled={status === 'running'}
      >
        Jetzt starten
      </button>
    </div>
  );
}
