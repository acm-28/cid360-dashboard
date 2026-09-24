import { useState } from 'react'
import { CHART, Card, Segmented } from './ui'
import { DYNAMICS_METRICS, dynamics, type DynamicsMetric } from '../lib/metrics'
import type { MacroRecord } from '../lib/types'
import { fmtDec, fmtInt } from '../lib/format'

const COLORS = { good: CHART.cid, regular: CHART.cidMid, bad: CHART.mutedDeep }
const SLIDE = 'transition-[left,width] duration-700 ease-apple'

function niceTicks(min: number, max: number, count = 5) {
  const span = max - min || 1
  const step = 10 ** Math.floor(Math.log10(span / count))
  const err = span / count / step
  const nice = step * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1)
  const lo = Math.floor(min / nice) * nice
  const out: number[] = []
  for (let v = lo; v <= max + nice * 0.5; v += nice) out.push(Number(v.toFixed(6)))
  return out
}

export function DynamicsCard({ records }: { records: MacroRecord[] }) {
  const [metric, setMetric] = useState<DynamicsMetric>('talkSpeed')
  const [hover, setHover] = useState<string | null>(null)
  const meta = DYNAMICS_METRICS.find((m) => m.id === metric)!
  const groups = dynamics(records, metric)
  const valid = groups.filter((g) => g.stats)

  const lo = valid.length ? Math.min(...valid.map((g) => g.stats!.min)) : 0
  const hi = valid.length ? Math.max(...valid.map((g) => g.stats!.max)) : 1
  const ticks = niceTicks(lo, hi)
  const domainLo = ticks[0]
  const domainHi = ticks[ticks.length - 1]
  const x = (v: number) => ((v - domainLo) / (domainHi - domainLo || 1)) * 100

  return (
    <Card
      eyebrow="Conversación"
      title="Dinámica conversacional"
      subtitle="Distribución por cuartiles en gestiones con contacto efectivo, según la probabilidad de pago resultante."
      actions={
        <Segmented
          size="sm"
          label="Métrica"
          value={metric}
          onChange={setMetric}
          options={DYNAMICS_METRICS.map((m) => ({ value: m.id, label: m.short }))}
        />
      }
    >
      <div className="relative flex-1 pt-2">
        <div className="relative ml-[76px]">
          {ticks.map((t) => (
            <div key={t} className="absolute top-0 bottom-0 border-l border-dashed border-hairline" style={{ left: `${x(t)}%`, height: groups.length * 64 }} />
          ))}
        </div>

        {groups.map((g, gi) => {
          const s = g.stats
          const color = COLORS[g.probability]
          return (
            <div
              key={g.probability}
              className="stagger-item relative flex h-16 items-center"
              style={{ ['--i' as string]: gi }}
              onMouseEnter={() => setHover(g.probability)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="w-[76px] shrink-0">
                <div className="text-[13px] font-medium text-ink">{g.label}</div>
                <div className="num text-[11px] text-ink-3">n = {s ? fmtInt(s.n) : 0}</div>
              </div>
              <div className="relative h-full flex-1">
                {s && (
                  <>
                    <div
                      className={`absolute top-1/2 h-px -translate-y-1/2 ${SLIDE}`}
                      style={{ left: `${x(s.min)}%`, width: `${x(s.max) - x(s.min)}%`, background: CHART.mutedDeep }}
                    />
                    {[s.min, s.max].map((v, i) => (
                      <div key={i} className={`absolute top-1/2 h-3 w-px -translate-y-1/2 ${SLIDE}`} style={{ left: `${x(v)}%`, background: CHART.mutedDeep }} />
                    ))}
                    <div
                      className="grow-x absolute top-1/2 h-7 -translate-y-1/2 rounded-[7px] transition-[left,width,opacity] duration-700 ease-apple"
                      style={{
                        ['--i' as string]: gi,
                        left: `${x(s.q1)}%`,
                        width: `${Math.max(x(s.q3) - x(s.q1), 0.6)}%`,
                        background: color,
                        opacity: hover && hover !== g.probability ? 0.35 : 0.9,
                      }}
                    />
                    <div className={`absolute top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-white ${SLIDE}`} style={{ left: `${x(s.median)}%` }} />
                    <div
                      className={`absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-ink bg-white ${SLIDE}`}
                      style={{ left: `${x(s.mean)}%` }}
                      title="Media"
                    />
                    {hover === g.probability && (
                      <div
                        className="bubble pop-in absolute right-0 bottom-full left-0 z-10 -mb-1 flex flex-wrap justify-between gap-x-4 gap-y-0.5 bg-white px-3 py-2 text-[11.5px] shadow-lift @lg:right-auto @lg:left-(--tip-left) @lg:max-w-[calc(100%-var(--tip-left))] @lg:justify-start"
                        style={{ ['--tip-left' as string]: `${Math.min(x(s.q1), 60)}%` }}
                      >
                        {[
                          ['Q1', s.q1],
                          ['Mediana', s.median],
                          ['Q3', s.q3],
                          ['Media', s.mean],
                        ].map(([k, v]) => (
                          <span key={k as string} className="whitespace-nowrap text-ink-2">
                            {k} <b className="num font-semibold text-ink">{fmtDec(v as number)}</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}

        <div className="relative mt-1 ml-[76px] h-5">
          {ticks.map((t, i) => (
            <span
              key={t}
              className={`num absolute -translate-x-1/2 text-[11px] text-ink-3 ${ticks.length > 6 && i % 2 ? 'hidden @lg:inline' : ''}`}
              style={{ left: `${x(t)}%` }}
            >
              {fmtDec(t).replace(/,0$/, '')}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-4 text-[12px] text-ink-2">
        <span>
          {meta.label} <span className="text-ink-3">({meta.unit})</span>
        </span>
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-[2px] rounded-full bg-ink-3" /> Mediana
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-[7px] rotate-45 border border-ink bg-white" /> Media
          </span>
          <span>Bigotes: 1,5 × IQR</span>
        </span>
      </div>
    </Card>
  )
}
