import { STATS_PUSHUPS, STATS_WEIGHT, type Navigate } from '../../hooks/useHashRoute';
import { SegmentedControl } from '../common/SegmentedControl';
import { BodyWeightStats } from './BodyWeightStats';
import { ExerciseStatsView } from './ExerciseStatsView';
import { PushupStats } from './PushupStats';

type View = 'exercises' | typeof STATS_PUSHUPS | typeof STATS_WEIGHT;

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'exercises', label: 'Übungen' },
  { value: STATS_PUSHUPS, label: 'Liegestütze' },
  { value: STATS_WEIGHT, label: 'Gewicht' },
];

interface StatsPageProps {
  /** Aus der URL: `pushups`, `weight` oder die ID einer Übung (`#/stats/<id>`). */
  exerciseId: string | null;
  navigate: Navigate;
}

export function StatsPage({ exerciseId: routeId, navigate }: StatsPageProps) {
  const view: View =
    routeId === STATS_PUSHUPS ? STATS_PUSHUPS : routeId === STATS_WEIGHT ? STATS_WEIGHT : 'exercises';

  return (
    <section>
      <div className="page-header">
        <h1>Statistik</h1>
      </div>

      <SegmentedControl
        label="Statistik-Bereich"
        options={VIEW_OPTIONS}
        value={view}
        onChange={(next) => navigate('stats', next === 'exercises' ? null : next)}
      />

      {view === 'exercises' && <ExerciseStatsView exerciseId={routeId} navigate={navigate} />}
      {view === STATS_PUSHUPS && <PushupStats />}
      {view === STATS_WEIGHT && <BodyWeightStats />}
    </section>
  );
}
