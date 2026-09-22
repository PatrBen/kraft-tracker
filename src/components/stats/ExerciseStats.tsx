import { formatDate, formatKg, formatPercent, pluralize } from '../../utils/format';
import { percentChange, type SessionBest } from '../../utils/oneRepMax';
import { EmptyState } from '../common/EmptyState';
import { OneRepMaxChart } from './OneRepMaxChart';
import { SessionTable } from './SessionTable';
import { StatTile } from './StatTile';

export function ExerciseStats({ data }: { data: SessionBest[] }) {
  if (data.length === 0) {
    return <EmptyState title="Für diese Übung wurden noch keine Sätze eingetragen." />;
  }

  const first = data[0];
  const current = data[data.length - 1];
  const best = data.reduce((a, b) => (b.oneRepMax > a.oneRepMax ? b : a));
  const change = data.length > 1 ? percentChange(first.oneRepMax, current.oneRepMax) : null;

  return (
    <>
      <div className="stat-tiles">
        <StatTile
          label="Erste Session"
          value={formatKg(first.oneRepMax)}
          detail={formatDate(first.date)}
        />
        <StatTile
          label="Aktuelle Session"
          value={formatKg(current.oneRepMax)}
          detail={formatDate(current.date)}
        />
        <StatTile
          label="Steigerung"
          value={change === null ? '–' : formatPercent(change)}
          trend={change === null ? undefined : change > 0 ? 'up' : change < 0 ? 'down' : 'flat'}
          detail={
            data.length > 1
              ? `erste vs. aktuelle, ${pluralize(data.length, 'Session', 'Sessions')}`
              : 'ab der zweiten Session'
          }
          highlight
        />
        <StatTile
          label="Bestwert"
          value={formatKg(best.oneRepMax)}
          detail={`${formatKg(best.weightKg)} × ${best.reps} am ${formatDate(best.date)}`}
        />
      </div>

      <div className="card chart-card">
        <h2 className="card__title">Geschätztes 1RM in kg</h2>
        <p className="chart-card__subtitle">
          Bester Satz je Session nach Epley: Gewicht × (1 + Wdh. / 30)
        </p>
        <OneRepMaxChart data={data} />
      </div>

      <SessionTable data={data} />
    </>
  );
}
