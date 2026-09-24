import { CHART, Card } from './ui'
import type { plans } from '../lib/metrics'
import { fmtInt, fmtPct, fmtPts } from '../lib/format'
import { AnimatedNumber } from '../lib/motion'

export function PlansCard({ data }: { data: ReturnType<typeof plans> }) {
  const lift = data.withPlan - data.withoutPlan
  const maxCount = Math.max(...data.rows.map((r) => r.count), 1)

  return (
    <Card
      eyebrow="Herramientas financieras"
      title="Planes alternativos"
      subtitle="Frecuencia con que se ofrecen alternativas de pago en contactos efectivos y su relación con el resultado."
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Stat
          i={0}
          label="Contactos con oferta de plan"
          value={data.offerRate}
          format={(v) => fmtPct(v, 0)}
          caption={`${fmtInt(data.withPlanCount)} de ${fmtInt(data.effectiveCount)}`}
        />
        <Stat
          i={1}
          label="Diferencia en probabilidad favorable"
          value={lift}
          format={fmtPts}
          caption={`${fmtPct(data.withPlan, 0)} con plan · ${fmtPct(data.withoutPlan, 0)} sin plan`}
          accent={lift > 0}
        />
      </div>

      <div className="mt-6 flex-1 space-y-4">
        {data.rows.length === 0 && <p className="text-[13px] text-ink-3">No se ofrecieron planes en esta selección.</p>}
        {data.rows.map((r, i) => {
          const lead = r.id === data.rows[0].id
          return (
            <div
              key={r.id}
              className="stagger-item focus-row group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 @lg:grid-cols-[120px_minmax(0,1fr)_auto]"
              style={{ ['--i' as string]: i + 2 }}
            >
              <span className="truncate text-[13px] font-medium text-ink">{r.label}</span>
              <div className="order-last col-span-2 h-2 overflow-hidden rounded-full bg-ivory-sunken @lg:order-none @lg:col-span-1">
                <div
                  className="grow-x h-full rounded-full transition-[width,background-color] duration-700 ease-apple"
                  style={{
                    ['--i' as string]: i,
                    width: `${(r.count / maxCount) * 100}%`,
                    background: lead ? CHART.cid : undefined,
                  }}
                >
                  {!lead && <div className="h-full w-full bg-cid-light transition-colors duration-300 group-hover:bg-cid-mid" />}
                </div>
              </div>
              <span className="num text-right text-[12px] whitespace-nowrap text-ink-2 @lg:w-[132px]">
                <b className="font-semibold text-ink">{fmtInt(r.count)}</b> · {fmtPct(r.favorable, 0)} favorable
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function Stat({
  i,
  label,
  value,
  format,
  caption,
  accent,
}: {
  i: number
  label: string
  value: number
  format: (v: number) => string
  caption: string
  accent?: boolean
}) {
  return (
    <div
      className="stagger-item min-w-0 rounded-[16px] bg-ivory px-3 py-3 transition-colors duration-300 ease-apple hover:bg-white sm:px-4 sm:py-3.5"
      style={{ ['--i' as string]: i }}
    >
      <div className="text-[11.5px] font-medium text-ink-2">{label}</div>
      <AnimatedNumber
        value={value}
        format={format}
        className={`num mt-1 block text-[22px] leading-tight font-semibold sm:text-[26px] ${accent ? 'text-cid-deep' : 'text-ink'}`}
      />
      <div className="num mt-0.5 text-[11.5px] text-ink-3">{caption}</div>
    </div>
  )
}
