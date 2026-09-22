import { BackupSection } from './BackupSection';
import { SyncSection } from './SyncSection';

export function DataPage() {
  return (
    <section>
      <div className="page-header">
        <h1>Daten</h1>
      </div>
      <SyncSection />
      <BackupSection />
    </section>
  );
}
