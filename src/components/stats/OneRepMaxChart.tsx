import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dateTicks, niceAxis } from '../../utils/chartAxis';
import { formatDate, formatKg, formatNumber, formatShortDate } from '../../utils/format';
import type { SessionBest } from '../../utils/oneRepMax';

interface ChartPoint extends SessionBest {
  time: number;
}

const DAY_MS = 86_400_000;
const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 12 };

export function OneRepMaxChart({ data }: { data: SessionBest[] }) {
  const points = useMemo<ChartPoint[]>(
    () => data.map((d) => ({ ...d, time: d.date.getTime() })),
    [data],
  );
  const xTicks = useMemo(() => dateTicks(points.map((p) => p.time)), [points]);
  const yAxis = useMemo(() => niceAxis(points.map((p) => p.oneRepMax)), [points]);

  const first = points[0];
  const last = points[points.length - 1];
  // Echte Zeitachse: Abstände zwischen Sessions entsprechen den realen Pausen.
  const xDomain: [number, number] =
    points.length > 1 ? [first.time, last.time] : [first.time - DAY_MS, first.time + DAY_MS];

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={points} margin={{ top: 28, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={xDomain}
            ticks={xTicks}
            tickFormatter={(t: number) => formatShortDate(new Date(t))}
            interval="preserveStartEnd"
            minTickGap={16}
            padding={{ left: 20, right: 20 }}
            stroke="var(--chart-axis)"
            tickLine={false}
            tick={AXIS_TICK}
          />
          <YAxis
            domain={yAxis.domain}
            ticks={yAxis.ticks}
            tickFormatter={(v: number) => formatNumber(v)}
            width={44}
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="oneRepMax"
            name="Geschätztes 1RM"
            stroke="var(--chart-line)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={{ r: 4, fill: 'var(--chart-line)', stroke: 'var(--surface)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--chart-line)', stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
          {/* Nur der aktuelle Wert wird direkt beschriftet, der Rest steht in Tooltip und Tabelle. */}
          <ReferenceDot
            x={last.time}
            y={last.oneRepMax}
            r={0}
            label={{
              value: formatKg(last.oneRepMax),
              position: 'top',
              offset: 12,
              fill: 'var(--text)',
              fontSize: 12,
              fontWeight: 600,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartPoint }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__value">
        <span className="chart-tooltip__key" aria-hidden="true" />
        {formatKg(point.oneRepMax)}
      </div>
      <div className="chart-tooltip__label">geschätztes 1RM</div>
      <div className="chart-tooltip__meta">
        {formatDate(point.date)} · {formatKg(point.weightKg)} × {point.reps}
      </div>
    </div>
  );
}
