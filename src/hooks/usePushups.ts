import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useState } from 'react';
import { db } from '../db/db';
import type { PushupEntry } from '../db/types';

const DEFAULT_COUNT_KEY = 'kraft-tracker:pushups:default-count';
export const PUSHUP_DEFAULT_COUNT = 12;

/** Alle Liegestütz-Einträge, chronologisch. */
export function usePushupEntries(): PushupEntry[] | undefined {
  return useLiveQuery(() => db.pushups.orderBy('doneAt').toArray(), []);
}

function readDefaultCount(): number {
  try {
    const stored = Number(localStorage.getItem(DEFAULT_COUNT_KEY));
    return Number.isInteger(stored) && stored > 0 ? stored : PUSHUP_DEFAULT_COUNT;
  } catch {
    return PUSHUP_DEFAULT_COUNT;
  }
}

/** Wie viele Liegestütze ein Klick auf "+1" einträgt – pro Gerät gespeichert. */
export function usePushupDefaultCount(): [number, (count: number) => void] {
  const [count, setCount] = useState(readDefaultCount);
  const update = useCallback((next: number) => {
    setCount(next);
    try {
      localStorage.setItem(DEFAULT_COUNT_KEY, String(next));
    } catch {
      // Einstellung gilt dann nur bis zum Neuladen.
    }
  }, []);
  return [count, update];
}
