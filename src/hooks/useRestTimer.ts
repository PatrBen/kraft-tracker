import { createContext, useContext } from 'react';

export interface RestTimerSettings {
  durationSec: number;
  sound: boolean;
}

export type RestTimerStatus = 'idle' | 'running' | 'finished';

export interface RestTimerApi {
  status: RestTimerStatus;
  remainingSec: number;
  /** Anteil der verbleibenden Zeit, läuft von 1 nach 0. */
  progress: number;
  settings: RestTimerSettings;
  updateSettings: (patch: Partial<RestTimerSettings>) => void;
  /** Startet (oder startet neu) mit der eingestellten Dauer. */
  start: (durationSec?: number) => void;
  adjust: (deltaSec: number) => void;
  /** Bricht ab bzw. quittiert das Ablauf-Signal. */
  stop: () => void;
}

export const RestTimerContext = createContext<RestTimerApi | null>(null);

export function useRestTimer(): RestTimerApi {
  const api = useContext(RestTimerContext);
  if (!api) throw new Error('useRestTimer muss innerhalb von <RestTimerProvider> verwendet werden');
  return api;
}
