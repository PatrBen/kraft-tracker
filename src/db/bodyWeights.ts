import { db } from './db';

export function addBodyWeight(weightKg: number, measuredAt = new Date()): Promise<string> {
  return db.bodyWeights.add({ weightKg, measuredAt });
}

export function deleteBodyWeight(id: string): Promise<void> {
  return db.bodyWeights.delete(id);
}
