import { CHART, Card, Legend } from './ui'
import type { durationMix } from '../lib/metrics'
import { fmtInt, fmtPct } from '../lib/format'

const SEGMENTS = [
  { key: 'good', label: 'Buena', color: CHART.cid },
  { key: 'regular', label: 'Regular', color: CHART.cidLight },
  { key: 'bad', label: 'Mala', color: CHART.muted },
] as const

export function DurationCard({ rows }: { rows: ReturnType<typeof durationMix> }) {
  const deep = rows[rows.length - 1]
  const nulls = rows[0]
  return (
    <Card
      eyebrow="Profundidad"
      title="Duración y resultado"
      subtitle="Distribución de la probabilidad de pago según cuánto dura la conversación."
    >
      <div className="flex flex-1 flex-col justify-center gap-5">
        {rows.map((r, i) => (
          <div key={r.id} className="stagger-item focus-row" style={{ ['--i' as string]: i }}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="num shrink-0 text-[13px] font-semibold text-ink">{r.label}</span>
                <span className="truncate text-[12px] text-ink-3">{r.hint}</span>
              </div>
              <span className="num shrink-0 text-[12px] text-ink-3">{fmtInt(r.count)} gestiones</span>
            </div>
            <div className="grow-x flex h-7 gap-[2px] overflow-hidden rounded-[8px]" style={{ ['--i' as string]: i }}>
              {r.count === 0 ? (
                <div className="flex-1 bg-ivory-sunken" />
              ) : (
                SEGMENTS.map((s) => (
                  <div
                    key={s.key}
                    title={`${s.label}: ${fmtPct(r[s.key])}`}
                    className="flex items-center justify-center transition-[flex-basis] duration-700 ease-apple"
                    style={{ flexBasis: `${r[s.key] * 100}%`, background: s.color }}
                  >
                    {r[s.key] >= 0.12 && (
                      <span className={`num text-[11px] font-semibold ${s.key === 'good' ? 'text-white' : 'text-ink/70'}`}>
                        {fmtPct(r[s.key], 0)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <Legend items={SEGMENTS.map((s) => ({ color: s.color, label: s.label }))} />
        {nulls.count > 0 && deep.count > 0 && (
          <span className="text-[12px] text-ink-2">
            La probabilidad buena o regular pasa de{' '}
            <b className="num font-semibold text-ink">{fmtPct(nulls.good + nulls.regular, 0)}</b> a{' '}
            <b className="num font-semibold text-cid-deep">{fmtPct(deep.good + deep.regular, 0)}</b>
          </span>
        )}
      </div>
    </Card>
  )
}
