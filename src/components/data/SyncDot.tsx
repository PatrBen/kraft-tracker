import type { SyncTone } from '../../hooks/useCloudSync';

/** Farbpunkt für den Sync-Zustand – steht immer neben einem Text, trägt also nie allein Bedeutung. */
export function SyncDot({ tone }: { tone: SyncTone }) {
  return <span className={`sync-dot sync-dot--${tone}`} aria-hidden="true" />;
}
