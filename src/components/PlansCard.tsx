import { CHART, Card } from './ui'
import type { plans } from '../lib/metrics'
import { fmtInt, fmtPct, fmtPts } from '../lib/format'

export function PlansCard({ data }: { data: ReturnType<typeof plans> }) {
  const lift = data.withPlan - data.withoutPlan
  const maxCount = Math.max(...data.rows.map((r) => r.count), 1)

  return (
    <Card
      eyebrow="Herramientas financieras"
      title="Planes alternativos"
      subtitle="Frecuencia con que se ofrecen alternativas de pago en contactos efectivos y su relación con el resultado."
    >
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Contactos con oferta de plan" value={fmtPct(data.offerRate, 0)} caption={`${fmtInt(data.withPlanCount)} de ${fmtInt(data.effectiveCount)}`} />
        <Stat
          label="Diferencia en probabilidad favorable"
          value={fmtPts(lift)}
          caption={`${fmtPct(data.withPlan, 0)} con plan · ${fmtPct(data.withoutPlan, 0)} sin plan`}
          accent={lift > 0}
        />
      </div>

      <div className="mt-6 flex-1 space-y-4">
        {data.rows.length === 0 && <p className="text-[13px] text-ink-3">No se ofrecieron planes en esta selección.</p>}
        {data.rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-3">
            <span className="truncate text-[13px] font-medium text-ink">{r.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-ivory-sunken">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-apple"
                style={{ width: `${(r.count / maxCount) * 100}%`, background: r.id === data.rows[0].id ? CHART.cid : CHART.cidLight }}
              />
            </div>
            <span className="num w-[132px] text-right text-[12px] text-ink-2">
              <b className="font-semibold text-ink">{fmtInt(r.count)}</b> · {fmtPct(r.favorable, 0)} favorable
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Stat({ label, value, caption, accent }: { label: string; value: string; caption: string; accent?: boolean }) {
  return (
    <div className="rounded-[16px] bg-ivory px-4 py-3.5">
      <div className="text-[11.5px] font-medium text-ink-2">{label}</div>
      <div className={`num mt-1 text-[26px] leading-tight font-semibold ${accent ? 'text-cid-deep' : 'text-ink'}`}>{value}</div>
      <div className="num mt-0.5 text-[11.5px] text-ink-3">{caption}</div>
    </div>
  )
}
