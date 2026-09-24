import { CHART, Card } from './ui'
import type { compliance } from '../lib/metrics'
import { fmtInt, fmtPct } from '../lib/format'

function Ring({ value }: { value: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 84 84" className="size-[84px] -rotate-90" aria-hidden>
      <circle cx="42" cy="42" r={r} fill="none" stroke="#EDEAE3" strokeWidth="6" />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke={value >= 0.9 ? CHART.cid : CHART.cidMid}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`}
        className="transition-[stroke-dasharray] duration-700 ease-apple"
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
        {items.map((it) => (
          <div key={it.id} className="flex flex-col items-center rounded-[18px] bg-ivory px-4 py-5 text-center">
            <div className="relative">
              <Ring value={it.rate} />
              <div className="absolute inset-0 grid place-items-center">
                <span className="num text-[19px] font-semibold text-ink">{fmtPct(it.rate, 1)}</span>
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
