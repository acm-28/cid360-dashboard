import clsx from 'clsx'
import { Check, ChevronRight } from 'lucide-react'
import { Card } from './ui'
import { StatusDot, rateTone } from './DeliveryCalendarCard'
import { STATUS, dayLabel, describe, inRange, tally, type DeliveryFeed, type Incident, type Provider } from '../lib/deliveries'
import { fmtDate, fmtInt, fmtPct } from '../lib/format'

export function AttentionCard({
  items,
  asOf,
  onOpen,
}: {
  items: Incident[]
  asOf: string
  onOpen: (p: Provider) => void
}) {
  return (
    <Card
      eyebrow="Seguimiento"
      title="Requiere atención"
      subtitle="Incidencias abiertas por proveedor. Se cierran solas cuando llega un lote válido."
    >
      {items.length === 0 ? (
        <div className="grid flex-1 place-items-center py-8 text-center">
          <div className="stagger-item">
            <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-positive/10 text-positive">
              <Check className="size-5" strokeWidth={2} />
            </span>
            <div className="text-[14px] font-semibold text-ink">Sin incidencias abiertas</div>
            <p className="mt-0.5 text-[12.5px] text-ink-2">Todos los proveedores están al día.</p>
          </div>
        </div>
      ) : (
        <ul className="-mx-2 flex-1">
          {items.map((inc, i) => {
            const { title, detail } = describe(inc, asOf)
            const status = inc.kind === 'mixed' ? 'missing' : inc.kind
            return (
              <li key={`${inc.provider.id}-${inc.kind}`} className="stagger-item focus-row" style={{ ['--i' as string]: i }}>
                <button
                  onClick={() => onOpen(inc.provider)}
                  className="group flex w-full items-center gap-3.5 rounded-[16px] px-2 py-3 text-left transition-colors duration-200 hover:bg-ivory"
                >
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full"
                    style={{ background: `${STATUS[status].color}1A` }}
                  >
                    <StatusDot status={status} className="size-2.5!" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] text-ink @lg:truncate">
                      <span className="font-semibold">{inc.provider.name}</span>
                      <span className="text-ink-3"> · </span>
                      {title}
                    </span>
                    <span className="block text-[12px] text-ink-2 @lg:truncate">{detail}</span>
                  </span>
                  <span className="hidden shrink-0 text-right text-[11.5px] text-ink-3 @md:block">
                    {inc.kind === 'pending' ? 'hoy' : inc.count > 1 ? `desde ${dayLabel(inc.from)}` : dayLabel(inc.from)}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-3 transition-transform duration-300 ease-apple group-hover:translate-x-0.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function ReliabilityCard({
  feed,
  days,
  onOpen,
}: {
  feed: DeliveryFeed
  days: string[]
  onOpen: (p: Provider) => void
}) {
  const rows = feed.providers
    .map((p) => ({ provider: p, t: tally(inRange(p, days)) }))
    .filter((r) => r.t.expected > 0)
    .sort((a, b) => a.t.rate - b.t.rate || b.t.expected - a.t.expected)
  const base = rows.reduce((s, r) => s + r.t.expected, 0)

  return (
    <Card
      eyebrow="Confiabilidad"
      title="Cumplimiento por proveedor"
      subtitle="Lotes esperados en el período, del menor al mayor cumplimiento."
    >
      <div key={days.length} className="flex-1 space-y-3.5">
        {rows.map(({ provider: p, t }, i) => (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className="stagger-item focus-row group block w-full text-left"
            style={{ ['--i' as string]: i }}
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="truncate">
                <span className="font-medium text-ink">{p.name}</span>
                {p.since > days[0] && (
                  <span className="ml-1.5 text-[11.5px] text-ink-3">desde {fmtDate(p.since, 'short').toLowerCase()}</span>
                )}
              </span>
              <span className="shrink-0 text-[12px] text-ink-3">
                <span className="num">
                  {fmtInt(t.ok)}/{fmtInt(t.expected)}
                </span>
                <span className={clsx('num ml-2 text-[13px] font-semibold', rateTone(t.rate))}>{fmtPct(t.rate, 0)}</span>
              </span>
            </div>
            <div className="grow-x flex h-1.5 gap-[2px] overflow-hidden rounded-full" style={{ ['--i' as string]: i }}>
              {(['ok', 'rejected', 'missing'] as const).map(
                (s) =>
                  t[s] > 0 && (
                    <span
                      key={s}
                      className="h-full first:rounded-l-full last:rounded-r-full transition-opacity duration-300 group-hover:opacity-90"
                      style={{ flexGrow: t[s], background: s === 'ok' ? `${STATUS.ok.color}B3` : STATUS[s].color }}
                    />
                  ),
              )}
            </div>
          </button>
        ))}
      </div>
      <p className="mt-5 border-t border-hairline pt-4 text-[12px] text-ink-3">
        Base: {fmtInt(base)} lotes esperados en {days.length} días hábiles. Los lotes pendientes de hoy no se cuentan hasta que cierra la
        ventana.
      </p>
    </Card>
  )
}
