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
import { formatNumber, formatShortDate } from '../../utils/format';
import { ChartTooltip, type TooltipContent } from './ChartTooltip';

export interface TrendPoint {
  /** Zeitpunkt in ms – die X-Achse ist eine echte Zeitachse. */
  time: number;
  value: number;
}

interface TrendChartProps<P extends TrendPoint> {
  points: P[];
  /** Wert für Tooltip und Endbeschriftung, z. B. "79,2 kg". */
  formatValue: (value: number) => string;
  /** Beschriftung der X-Achse; Standard: "22.09.". */
  formatTick?: (time: number) => string;
  tooltip: (point: P) => TooltipContent;
}

const DAY_MS = 86_400_000;
const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 12 };

/** Einzelne Linie über die Zeit; nur der aktuellste Wert wird direkt beschriftet. */
export function TrendChart<P extends TrendPoint>({
  points,
  formatValue,
  formatTick = (t) => formatShortDate(new Date(t)),
  tooltip,
}: TrendChartProps<P>) {
  const xTicks = useMemo(() => dateTicks(points.map((p) => p.time)), [points]);
  const yAxis = useMemo(() => niceAxis(points.map((p) => p.value)), [points]);

  const first = points[0];
  const last = points[points.length - 1];
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
            tickFormatter={formatTick}
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
            content={<ChartTooltip<P> render={tooltip} />}
            cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="var(--chart-line)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={{ r: 4, fill: 'var(--chart-line)', stroke: 'var(--surface)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--chart-line)', stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <ReferenceDot
            x={last.time}
            y={last.value}
            r={0}
            label={{
              value: formatValue(last.value),
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
