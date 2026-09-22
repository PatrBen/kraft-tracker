import { useEffect } from 'react';

/**
 * Hält das Display an, solange `enabled` gilt. Am Handy wichtig: Bei gesperrtem Bildschirm
 * pausiert der Browser die Seite, und der Pausentimer könnte nicht mehr signalisieren.
 * Der Browser gibt den Lock beim Wechsel in eine andere App frei – beim Zurückkehren
 * wird er neu angefordert.
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (disposed) void lock.release();
        else sentinel = lock;
      } catch {
        // z. B. Energiesparmodus – dann eben ohne Wake Lock.
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', acquire);
      void sentinel?.release();
    };
  }, [enabled]);
}
