import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { zeroBasedAxis } from '../../utils/chartAxis';
import { formatNumber } from '../../utils/format';
import { ChartTooltip, type TooltipContent } from './ChartTooltip';

export interface PeriodBar {
  /** Beginn des Zeitraums in ms (eindeutiger Schlüssel). */
  key: number;
  /** Kurzes Achsen-Label, z. B. "KW 39". */
  label: string;
  value: number;
}

interface PeriodBarChartProps<B extends PeriodBar> {
  bars: B[];
  tooltip: (bar: B) => TooltipContent;
}

const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 12 };

/** Summen je Zeitraum als Säulen – auch leere Zeiträume stehen drin, damit Lücken sichtbar sind. */
export function PeriodBarChart<B extends PeriodBar>({ bars, tooltip }: PeriodBarChartProps<B>) {
  const labels = useMemo(() => new Map(bars.map((b) => [b.key, b.label])), [bars]);
  const yAxis = useMemo(() => zeroBasedAxis(Math.max(...bars.map((b) => b.value))), [bars]);

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={bars} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="key"
            tickFormatter={(key: number) => labels.get(key) ?? ''}
            interval="preserveStartEnd"
            minTickGap={12}
            stroke="var(--chart-axis)"
            tickLine={false}
            tick={AXIS_TICK}
          />
          <YAxis
            domain={yAxis.domain}
            ticks={yAxis.ticks}
            tickFormatter={(v: number) => formatNumber(v)}
            width={40}
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
          />
          <Tooltip
            content={<ChartTooltip<B> render={tooltip} />}
            cursor={{ fill: 'var(--chart-cursor)' }}
            isAnimationActive={false}
          />
          <Bar
            dataKey="value"
            fill="var(--chart-line)"
            activeBar={{ fill: 'var(--accent-hover)' }}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
