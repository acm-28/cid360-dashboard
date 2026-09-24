import { useCallback, useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { CHART, Delta, Words } from './ui'
import { Logo } from './Logo'
import { DeliveryCalendarCard, StatusDot, type Period } from './DeliveryCalendarCard'
import { AttentionCard, ReliabilityCard } from './DeliveryCards'
import { ProviderPanel } from './ProviderPanel'
import {
  DELIVERIES,
  batchOn,
  clause,
  daily,
  dayLabel,
  incidents,
  inRange,
  joinEs,
  tally,
  type Provider,
} from '../lib/deliveries'
import { fmtDate, fmtDec, fmtInt, fmtPct } from '../lib/format'
import { AnimatedNumber, RevealContext, spotlight, useReveal } from '../lib/motion'

export function DeliveriesPage() {
  const feed = DELIVERIES
  const [period, setPeriod] = useState<Period>('20')
  const [selected, setSelected] = useState<Provider | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const [days, previousDays] = useMemo(() => {
    const n = Number(period)
    return [feed.days.slice(-n), feed.days.slice(-2 * n, -n)]
  }, [feed, period])

  const open = useMemo(() => incidents(feed), [feed])
  const openById = useMemo(() => new Map(open.filter((i) => i.kind !== 'pending').map((i) => [i.provider.id, i])), [open])
  const pendingById = useMemo(() => new Map(open.filter((i) => i.kind === 'pending').map((i) => [i.provider.id, i])), [open])
  const rowIncidents = useMemo(() => new Map([...pendingById, ...openById]), [openById, pendingById])

  const view = useMemo(() => {
    const all = feed.providers.flatMap((p) => inRange(p, days))
    const prev = previousDays.length ? feed.providers.flatMap((p) => inRange(p, previousDays)) : []
    return { t: tally(all), prev: prev.length ? tally(prev) : undefined, series: daily(feed, days) }
  }, [feed, days, previousDays])

  const active = feed.providers.filter((p) => p.since <= feed.asOf)
  const deliveredToday = active.filter((p) => batchOn(p, feed.asOf)?.status === 'ok').length
  const issues = open.filter((i) => i.kind !== 'pending')
  const pending = open.filter((i) => i.kind === 'pending')
  const upToDate = active.filter((p) => !openById.has(p.id))

  const openPanel = useCallback((p: Provider) => {
    setSelected(p)
    setPanelOpen(true)
  }, [])
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const summary = [
    issues.length ? `${joinEs(issues.map((i) => clause(i, feed.asOf)))}.` : 'Todos los lotes con ventana cerrada llegaron sin errores.',
    pending.length ? `${joinEs(pending.map((i) => clause(i, feed.asOf)))}.` : '',
  ].join(' ')

  return (
    <main className="mx-auto max-w-[1440px] px-5 pb-20 md:px-8">
      <div className="hidden print:block print:pt-2">
        <Logo />
      </div>

      <section className="pt-10 pb-8 md:pt-14">
        <div className="fade-in mb-3 text-[13px] font-medium text-ink-2">
          {fmtDate(feed.asOf)} · actualizado a las {feed.updatedAt} h
        </div>
        <h1 className="max-w-[24ch] text-[34px] leading-[1.08] font-semibold tracking-[-0.035em] text-ink md:text-[48px]">
          {deliveredToday === active.length ? (
            <Words text={`Los ${active.length} proveedores entregaron hoy un lote válido.`} />
          ) : (
            <>
              <span className="word text-cid-deep" style={{ ['--i' as string]: 0 }}>
                <AnimatedNumber value={deliveredToday} format={(v) => fmtInt(Math.round(v))} className="num" /> de {active.length}
              </span>{' '}
              <Words text="proveedores entregaron hoy un lote válido." offset={1} />
            </>
          )}
        </h1>
        <p className="fade-in mt-4 max-w-[68ch] text-[15px] text-ink-2" style={{ ['--delay' as string]: '520ms' }}>
          {summary}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Tile
          label="Cumplimiento del período"
          value={view.t.rate * 100}
          format={fmtDec}
          unit="%"
          accent
          delta={view.prev && <Delta value={(view.t.rate - view.prev.rate) * 100} />}
          caption={`${fmtInt(view.t.ok)} de ${fmtInt(view.t.expected)} lotes esperados`}
        >
          <DayBars
            days={days}
            values={view.series.map((d) => d.rate)}
            max={1}
            color={(v) => (v >= 1 ? CHART.muted : CHART.cid)}
            format={(v) => fmtPct(v, 0)}
          />
        </Tile>
        <Tile
          label="Rechazados por error técnico"
          value={view.t.rejected}
          format={(v) => fmtInt(Math.round(v))}
          delta={view.prev && <Delta value={view.t.rejected - view.prev.rejected} suffix="" inverse />}
          caption={`${fmtPct(view.t.expected ? view.t.rejected / view.t.expected : 0)} de los lotes esperados`}
        >
          <DayBars days={days} values={view.series.map((d) => d.rejected)} color={() => '#D98A1C'} format={countLabel} />
        </Tile>
        <Tile
          label="No enviados"
          value={view.t.missing}
          format={(v) => fmtInt(Math.round(v))}
          delta={view.prev && <Delta value={view.t.missing - view.prev.missing} suffix="" inverse />}
          caption={`${fmtPct(view.t.expected ? view.t.missing / view.t.expected : 0)} de los lotes esperados`}
        >
          <DayBars days={days} values={view.series.map((d) => d.missing)} color={() => '#B8412E'} format={countLabel} />
        </Tile>
        <Tile
          label="Proveedores al día"
          value={upToDate.length}
          format={(v) => fmtInt(Math.round(v))}
          unit={`/${active.length}`}
          caption="Con su último lote válido"
        >
          <div className="flex h-8 flex-wrap content-end gap-x-3 gap-y-1 text-[11.5px] text-ink-2">
            {active.map((p) => (
              <button
                key={p.id}
                onClick={() => openPanel(p)}
                className="press inline-flex items-center gap-1.5 hover:text-ink"
              >
                <StatusDot
                  status={openById.get(p.id)?.kind === 'rejected' ? 'rejected' : openById.has(p.id) ? 'missing' : 'ok'}
                  className="size-2!"
                />
                {p.name}
              </button>
            ))}
          </div>
        </Tile>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex min-w-0 lg:col-span-12 [&>section]:flex-1">
          <DeliveryCalendarCard
            feed={feed}
            days={days}
            period={period}
            onPeriod={setPeriod}
            open={rowIncidents}
            onOpen={openPanel}
          />
        </div>
        <div className="flex min-w-0 lg:col-span-7 [&>section]:flex-1">
          <AttentionCard items={open} asOf={feed.asOf} onOpen={openPanel} />
        </div>
        <div className="flex min-w-0 lg:col-span-5 [&>section]:flex-1">
          <ReliabilityCard feed={feed} days={days} onOpen={openPanel} />
        </div>
      </div>

      <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6 text-[12px] text-ink-3">
        <Logo compact />
        <p className="max-w-[80ch]">
          Monitoreo de los lotes diarios que cada proveedor conectado entrega a CID360, del {dayLabel(days[0])} al{' '}
          {dayLabel(days[days.length - 1])}. Un lote se considera enviado con éxito cuando supera la validación técnica de formato y
          contenido. Se controlan días hábiles, de lunes a viernes.
        </p>
      </footer>

      <ProviderPanel
        provider={selected}
        incident={selected ? rowIncidents.get(selected.id) : undefined}
        days={days}
        asOf={feed.asOf}
        open={panelOpen}
        onClose={closePanel}
      />
    </main>
  )
}

const countLabel = (v: number) => (v === 1 ? '1 lote' : `${fmtInt(v)} lotes`)

function Tile({
  label,
  value,
  format,
  unit,
  accent = false,
  delta,
  caption,
  children,
}: {
  label: string
  value: number
  format: (v: number) => string
  unit?: string
  accent?: boolean
  delta?: ReactNode
  caption: string
  children: ReactNode
}) {
  const [ref, visible] = useReveal<HTMLElement>()
  return (
    <RevealContext.Provider value={visible}>
      <article ref={ref} data-reveal={visible ? 'in' : 'pending'} onPointerMove={spotlight} className="card flex flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
          {delta}
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <AnimatedNumber
            value={value}
            format={format}
            className={clsx('num text-[40px] leading-none font-medium', accent ? 'text-cid-deep' : 'text-ink')}
          />
          {unit && <span className="text-[15px] font-medium text-ink-3">{unit}</span>}
        </div>
        <div className="mt-4">{children}</div>
        <div className="mt-2 text-[12px] text-ink-2">{caption}</div>
      </article>
    </RevealContext.Provider>
  )
}

function DayBars({
  days,
  values,
  max,
  color,
  format,
}: {
  days: string[]
  values: number[]
  max?: number
  color: (v: number) => string
  format: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const top = max ?? Math.max(...values, 1)
  return (
    <div className="relative" onPointerLeave={() => setHover(null)}>
      <div className="flex h-8 items-end gap-[2px]">
        {values.map((v, i) => (
          <span
            key={days[i]}
            onPointerEnter={() => setHover(i)}
            className="grow-y flex-1 rounded-[2px] transition-opacity duration-200"
            style={{
              height: v ? `${Math.max(14, (v / top) * 100)}%` : '2px',
              background: v ? color(v) : CHART.muted,
              opacity: hover === null || hover === i ? 1 : 0.45,
              ['--i' as string]: i,
            }}
          />
        ))}
      </div>
      {hover !== null && (
        <span
          className="pop-in num pointer-events-none absolute -top-6 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[10.5px] whitespace-nowrap text-ivory"
          style={{ left: `${Math.min(84, Math.max(16, ((hover + 0.5) / values.length) * 100))}%` }}
        >
          {dayLabel(days[hover])} · {format(values[hover])}
        </span>
      )}
    </div>
  )
}
