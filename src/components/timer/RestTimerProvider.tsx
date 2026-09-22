import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  RestTimerContext,
  type RestTimerApi,
  type RestTimerSettings,
} from '../../hooks/useRestTimer';
import { formatClock } from '../../utils/format';
import { beepNow, scheduleBeeps, unlockAudio, vibrate } from '../../utils/signal';

const SETTINGS_KEY = 'kraft-tracker:rest-timer:settings';
const RUN_KEY = 'kraft-tracker:rest-timer:run';
const DEFAULT_SETTINGS: RestTimerSettings = { durationSec: 90, sound: true };
const BASE_TITLE = document.title;

interface Run {
  endsAt: number;
  totalSec: number;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Speicher nicht verfügbar (z. B. privater Modus) – Timer funktioniert trotzdem.
  }
}

/**
 * Hält den Timer-Zustand app-weit, damit er beim Wechsel zwischen den Tabs weiterläuft.
 * Die Restzeit wird immer aus `endsAt` berechnet, nicht heruntergezählt – so bleibt sie
 * auch bei gedrosselten Hintergrund-Tabs exakt, und ein laufender Timer übersteht einen Reload.
 */
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RestTimerSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readJson<Partial<RestTimerSettings>>(SETTINGS_KEY),
  }));
  const [run, setRun] = useState<Run | null>(() => {
    const saved = readJson<Run>(RUN_KEY);
    return saved && saved.endsAt > Date.now() ? saved : null;
  });
  const [finished, setFinished] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const cancelBeepsRef = useRef<(() => void) | null>(null);

  useEffect(() => writeJson(SETTINGS_KEY, settings), [settings]);
  useEffect(() => writeJson(RUN_KEY, run), [run]);

  const clearBeeps = useCallback(() => {
    cancelBeepsRef.current?.();
    cancelBeepsRef.current = null;
  }, []);

  const armBeeps = useCallback(
    (endsAt: number, sound: boolean) => {
      clearBeeps();
      if (sound) cancelBeepsRef.current = scheduleBeeps((endsAt - Date.now()) / 1000);
    },
    [clearBeeps],
  );

  useEffect(() => clearBeeps, [clearBeeps]);

  useEffect(() => {
    if (!run) return;
    const tick = () => {
      const t = Date.now();
      if (t < run.endsAt) {
        setNow(t);
        return;
      }
      setRun(null);
      setFinished(true);
      vibrate();
      // Nach einem Reload konnte der Ton nicht vorab geplant werden.
      if (settings.sound && !cancelBeepsRef.current) beepNow();
      cancelBeepsRef.current = null;
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [run, settings.sound]);

  const start = useCallback(
    (durationSec?: number) => {
      const totalSec = durationSec ?? settings.durationSec;
      const t = Date.now();
      const endsAt = t + totalSec * 1000;
      unlockAudio();
      armBeeps(endsAt, settings.sound);
      setRun({ endsAt, totalSec });
      setNow(t);
      setFinished(false);
    },
    [settings, armBeeps],
  );

  const adjust = useCallback(
    (deltaSec: number) => {
      if (!run) return;
      const t = Date.now();
      const endsAt = Math.max(t, run.endsAt + deltaSec * 1000);
      armBeeps(endsAt, settings.sound);
      setRun({ endsAt, totalSec: Math.max(1, run.totalSec + deltaSec) });
      setNow(t);
    },
    [run, settings.sound, armBeeps],
  );

  const stop = useCallback(() => {
    clearBeeps();
    setRun(null);
    setFinished(false);
  }, [clearBeeps]);

  const updateSettings = useCallback(
    (patch: Partial<RestTimerSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      if (patch.sound !== undefined && run) {
        unlockAudio();
        armBeeps(run.endsAt, patch.sound);
      }
    },
    [run, armBeeps],
  );

  const remainingMs = run ? Math.max(0, run.endsAt - now) : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = run ? Math.min(1, remainingMs / (run.totalSec * 1000)) : 0;
  const status = run ? 'running' : finished ? 'finished' : 'idle';

  // Restzeit im Tab-Titel – sichtbar, auch wenn man gerade in einem anderen Tab ist.
  useEffect(() => {
    document.title =
      status === 'running'
        ? `⏱ ${formatClock(remainingSec)} · ${BASE_TITLE}`
        : status === 'finished'
          ? `⏰ Pause vorbei! · ${BASE_TITLE}`
          : BASE_TITLE;
  }, [status, remainingSec]);

  const api = useMemo<RestTimerApi>(
    () => ({ status, remainingSec, progress, settings, updateSettings, start, adjust, stop }),
    [status, remainingSec, progress, settings, updateSettings, start, adjust, stop],
  );

  return <RestTimerContext.Provider value={api}>{children}</RestTimerContext.Provider>;
}
