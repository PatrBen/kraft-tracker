/**
 * Bittet den Browser, die IndexedDB nicht bei Speicherknappheit zu räumen. Wichtig, weil alle
 * Daten nur lokal liegen. Chrome entscheidet still, Firefox fragt einmal nach.
 */
export function requestPersistentStorage(): void {
  navigator.storage?.persist?.().catch(() => {});
}
