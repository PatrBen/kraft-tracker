import type { Navigate } from '../../hooks/useHashRoute';
import { useSessionHistory } from '../../hooks/useSessions';
import { useStartWorkout } from '../../hooks/useStartWorkout';
import { useWorkoutPlans } from '../../hooks/useWorkoutPlans';
import { formatDate, formatDurationMinutes, formatTime, pluralize } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';
import { BackfillSessionForm } from './BackfillSessionForm';

export function JournalOverview({ navigate }: { navigate: Navigate }) {
  const plans = useWorkoutPlans();
  const history = useSessionHistory();
  const startWorkout = useStartWorkout(navigate);

  if (plans === undefined || history === undefined) return null;

  const active = history.find((h) => h.session.endedAt === null);
  const past = history.filter((h) => h.session.endedAt !== null);

  return (
    <section>
      <div className="page-header">
        <h1>Trainingstagebuch</h1>
      </div>

      {active && (
        <button
          type="button"
          className="live-card"
          onClick={() => navigate('journal', active.session.id)}
        >
          <span className="live-dot" aria-hidden="true" />
          <span className="live-card__body">
            <strong>Training läuft: {active.session.planName}</strong>
            <span className="muted">
              seit {formatTime(active.session.startedAt)} Uhr ·{' '}
              {pluralize(active.setCount, 'Satz', 'Sätze')}
            </span>
          </span>
          <span className="live-card__cta">Fortsetzen →</span>
        </button>
      )}

      <h2 className="section-title">Training starten</h2>
      {plans.length === 0 ? (
        <EmptyState title="Noch keine Trainingspläne">
          <p>Lege zuerst einen Plan mit deinen Übungen an.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('plans')}>
            Zu den Plänen
          </button>
        </EmptyState>
      ) : (
        <div className="plan-picker">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className="plan-picker__item"
              onClick={() => startWorkout(plan)}
            >
              <strong>{plan.name}</strong>
              <span className="muted">{pluralize(plan.exercises.length, 'Übung', 'Übungen')}</span>
            </button>
          ))}
        </div>
      )}
      <BackfillSessionForm plans={plans} onCreated={(id) => navigate('journal', id)} />

      <h2 className="section-title">Verlauf</h2>
      {past.length === 0 ? (
        <p className="muted">Noch keine abgeschlossenen Trainings.</p>
      ) : (
        <ul className="history-list">
          {past.map(({ session, setCount }) => (
            <li key={session.id}>
              <button
                type="button"
                className="history-item"
                onClick={() => navigate('journal', session.id)}
              >
                <span className="history-item__date">{formatDate(session.startedAt)}</span>
                <span className="history-item__name">{session.planName}</span>
                <span className="muted">
                  {pluralize(setCount, 'Satz', 'Sätze')}
                  {session.endedAt && ` · ${formatDurationMinutes(session.startedAt, session.endedAt)}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
