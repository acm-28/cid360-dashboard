import { CHART, Card } from './ui'
import type { compliance } from '../lib/metrics'
import { fmtInt, fmtPct } from '../lib/format'
import { AnimatedNumber } from '../lib/motion'

function Ring({ value, i }: { value: number; i: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 84 84" className="size-[84px] -rotate-90" aria-hidden>
      <circle cx="42" cy="42" r={r} fill="none" stroke="#EEEFED" strokeWidth="6" />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke={value >= 0.9 ? CHART.cid : CHART.cidMid}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`}
        className="ring-progress"
        style={{ ['--i' as string]: i }}
      />
    </svg>
  )
}

export function ComplianceCard({ items }: { items: ReturnType<typeof compliance> }) {
  return (
    <Card
      eyebrow="Calidad"
      title="Cumplimiento y auditoría IA"
      subtitle="Adherencia sobre gestiones evaluables. Las no evaluables (por ejemplo, buzón de voz) se informan aparte y no penalizan."
    >
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((it, i) => (
          <div
            key={it.id}
            className="stagger-item flex flex-col items-center rounded-[18px] bg-ivory px-4 py-5 text-center transition-colors duration-300 ease-apple hover:bg-white"
            style={{ ['--i' as string]: i }}
          >
            <div className="relative">
              <Ring value={it.rate} i={i} />
              <div className="absolute inset-0 grid place-items-center">
                <AnimatedNumber value={it.rate} format={(v) => fmtPct(v, 1)} className="num text-[19px] font-semibold text-ink" />
              </div>
            </div>
            <div className="mt-3 text-[13px] font-semibold text-ink">{it.label}</div>
            <div className="mt-0.5 text-[11.5px] text-ink-3">{it.hint}</div>
            <dl className="mt-3 flex gap-3 text-[11.5px]">
              <div>
                <dt className="text-ink-3">Cumple</dt>
                <dd className="num font-medium text-ink">{fmtInt(it.yes)}</dd>
              </div>
              <div>
                <dt className="text-ink-3">No cumple</dt>
                <dd className="num font-medium text-negative">{fmtInt(it.no)}</dd>
              </div>
              <div>
                <dt className="text-ink-3">No evaluable</dt>
                <dd className="num font-medium text-ink-2">{fmtInt(it.na)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </Card>
  )
}
