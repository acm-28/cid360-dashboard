import { useState } from 'react'
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART, Card, Legend, Segmented, TooltipShell, axisProps } from './ui'
import { bestAndWorstHours, type HourlyMetric, type hourly } from '../lib/metrics'
import { fmtDec, fmtDuration, fmtInt, fmtPct, hourLabel } from '../lib/format'
import { WhenRevealed } from '../lib/motion'

const METRICS: Record<HourlyMetric, { label: string; format: (v: number) => string; domain: [number | 'auto', number | 'auto'] }> = {
  favorable: { label: 'Probabilidad favorable', format: (v) => fmtPct(v, 0), domain: [0, 1] },
  score: { label: 'Score IA', format: (v) => fmtDec(v), domain: ['auto', 100] },
  duration: { label: 'Duración media', format: (v) => fmtDuration(v), domain: [0, 'auto'] },
}

export function HourlyCard({ rows }: { rows: ReturnType<typeof hourly> }) {
  const [metric, setMetric] = useState<HourlyMetric>('favorable')
  const m = METRICS[metric]
  const extremes = bestAndWorstHours(rows)
  const [active, setActive] = useState<number | null>(null)

  return (
    <Card
      eyebrow="Receptividad"
      title="Ventana horaria"
      subtitle="Volumen de gestiones por hora y su efectividad. Ayuda a asignar la dotación a las franjas de mayor respuesta."
      actions={
        <Segmented
          size="sm"
          label="Métrica de la línea"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'favorable', label: 'Favorable' },
            { value: 'score', label: 'Score IA' },
            { value: 'duration', label: 'Duración' },
          ]}
        />
      }
    >
      {extremes && metric === 'favorable' && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Callout i={0} tone="accent" label="Mejor franja" hour={extremes.best.hour} value={fmtPct(extremes.best.favorable!, 0)} />
          <Callout i={1} tone="muted" label="Franja más débil" hour={extremes.worst.hour} value={fmtPct(extremes.worst.favorable!, 0)} />
        </div>
      )}

      <div className="h-[260px] w-full min-w-0 overflow-hidden">
        <WhenRevealed>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
            onMouseMove={(s) => setActive(s?.activeTooltipIndex == null ? null : Number(s.activeTooltipIndex))}
            onMouseLeave={() => setActive(null)}
          >
            <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="2 4" />
            <XAxis dataKey="hour" tickFormatter={hourLabel} {...axisProps} />
            <YAxis yAxisId="v" {...axisProps} width={44} />
            <YAxis
              yAxisId="m"
              orientation="right"
              {...axisProps}
              width={52}
              domain={m.domain}
              tickFormatter={(v: number) => (metric === 'duration' ? `${Math.round(v / 60)}m` : m.format(v))}
            />
            <Tooltip
              cursor={false}
              animationDuration={260}
              animationEasing="ease-out"
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as (typeof rows)[number] | undefined
                if (!active || !p) return null
                const v = p[metric]
                return (
                  <TooltipShell
                    title={`${hourLabel(p.hour)} – ${hourLabel(p.hour + 1)}`}
                    rows={[
                      { label: 'Gestiones', value: fmtInt(p.volume), color: CHART.muted },
                      { label: m.label, value: v === null ? '—' : m.format(v), color: CHART.cid },
                    ]}
                  />
                )
              }}
            />
            <Bar
              yAxisId="v"
              dataKey="volume"
              fill={CHART.muted}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {rows.map((r, i) => (
                <Cell
                  key={r.hour}
                  fill={extremes && metric === 'favorable' && r.hour === extremes.best.hour ? CHART.cidLight : CHART.muted}
                  fillOpacity={active === null || active === i ? 1 : 0.45}
                />
              ))}
            </Bar>
            <Line
              yAxisId="m"
              dataKey={metric}
              type="monotone"
              stroke={CHART.cid}
              strokeWidth={2}
              strokeLinecap="round"
              dot={{ r: 2.5, fill: CHART.cid, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#fff', stroke: CHART.cid, strokeWidth: 2 }}
              animationBegin={250}
              animationDuration={1200}
              animationEasing="ease-out"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
        </WhenRevealed>
      </div>
      <div className="mt-3">
        <Legend
          items={[
            { color: CHART.muted, label: 'Gestiones por hora' },
            { color: CHART.cid, label: m.label, shape: 'line' },
          ]}
        />
      </div>
    </Card>
  )
}

function Callout({ i, tone, label, hour, value }: { i: number; tone: 'accent' | 'muted'; label: string; hour: number; value: string }) {
  return (
    <div
      className={`stagger-item bubble px-4 py-3 ${tone === 'accent' ? 'bg-cid-soft/70' : 'bg-ivory-sunken/70'}`}
      style={{ ['--i' as string]: i }}
    >
      <div className="text-[11.5px] font-medium text-ink-2">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="num text-[20px] font-semibold text-ink">{hourLabel(hour)}</span>
        <span className={`num text-[13px] font-medium ${tone === 'accent' ? 'text-cid-deep' : 'text-ink-2'}`}>
          {value} favorable
        </span>
      </div>
    </div>
  )
}
