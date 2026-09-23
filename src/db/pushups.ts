import { startOfPeriod } from '../utils/periods';
import { db } from './db';

export function addPushups(count: number): Promise<string> {
  return db.pushups.add({ count, doneAt: new Date() });
}

/** Löscht den letzten Eintrag von heute (Rückgängig); liefert dessen Anzahl oder `null`. */
export function undoLastPushups(): Promise<number | null> {
  return db.transaction('rw', db.pushups, async () => {
    const last = await db.pushups
      .where('doneAt')
      .aboveOrEqual(startOfPeriod(new Date(), 'day'))
      .last();
    if (!last) return null;
    await db.pushups.delete(last.id);
    return last.count;
  });
}
