import { CHART, Card } from './ui'
import type { compliance } from '../lib/metrics'
import { fmtInt, fmtPct } from '../lib/format'
import { AnimatedNumber } from '../lib/motion'

function Ring({ value, i }: { value: number; i: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 84 84" className="size-[72px] -rotate-90 @lg:size-[84px]" aria-hidden>
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
      <div className="grid flex-1 grid-cols-1 gap-3 @lg:grid-cols-3 @lg:gap-4">
        {items.map((it, i) => (
          <div
            key={it.id}
            className="stagger-item grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 rounded-[18px] bg-ivory px-4 py-4 transition-colors duration-300 ease-apple hover:bg-white @lg:flex @lg:flex-col @lg:py-5 @lg:text-center"
            style={{ ['--i' as string]: i }}
          >
            <div className="relative row-span-3">
              <Ring value={it.rate} i={i} />
              <div className="absolute inset-0 grid place-items-center">
                <AnimatedNumber value={it.rate} format={(v) => fmtPct(v, 1)} className="num text-[16px] font-semibold text-ink @lg:text-[19px]" />
              </div>
            </div>
            <div className="text-[13px] font-semibold text-ink @lg:mt-3">{it.label}</div>
            <div className="mt-0.5 text-[11.5px] text-ink-3">{it.hint}</div>
            <dl className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] @lg:mt-3 @lg:justify-center">
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
