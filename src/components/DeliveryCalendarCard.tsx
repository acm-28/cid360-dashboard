import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Card, Segmented } from './ui'
import {
  STATUS,
  batchOn,
  dayLabel,
  dayNum,
  inRange,
  isMonday,
  lastOk,
  tally,
  weekday,
  type Batch,
  type BatchStatus,
  type DeliveryFeed,
  type Incident,
  type Provider,
} from '../lib/deliveries'
import { fmtInt, fmtPct } from '../lib/format'

export type Period = '10' | '20' | '40'

export function StatusDot({ status, className }: { status: BatchStatus; className?: string }) {
  if (status === 'pending') {
    return <span className={clsx('pending-pulse block size-3 rounded-full border-[1.5px] border-ink-3 bg-white', className)} />
  }
  return <span className={clsx('block size-3 rounded-full', className)} style={{ background: STATUS[status].color }} />
}

export const rateTone = (rate: number) => (rate >= 0.95 ? 'text-ink' : rate >= 0.8 ? 'text-caution' : 'text-negative')
export const rateColor = (rate: number) =>
  rate >= 0.95 ? STATUS.ok.color : rate >= 0.8 ? STATUS.rejected.color : STATUS.missing.color

const MONTH = new Intl.DateTimeFormat('es-AR', { month: 'short' })
const monthOf = (iso: string) => MONTH.format(new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, 1)).replace('.', '')

/** Soft fade on the sticky provider column so dots slide under it when the calendar scrolls on phones. */
const EDGE =
  "max-sm:after:pointer-events-none max-sm:after:absolute max-sm:after:inset-y-0 max-sm:after:-right-3 max-sm:after:w-3 max-sm:after:bg-gradient-to-r max-sm:after:from-ivory-raised max-sm:after:to-transparent max-sm:after:content-['']"

interface Tip {
  provider: Provider
  batch: Batch
  x: number
  y: number
}

export function DeliveryCalendarCard({
  feed,
  days,
  period,
  onPeriod,
  open,
  onOpen,
}: {
  feed: DeliveryFeed
  days: string[]
  period: Period
  onPeriod: (p: Period) => void
  open: Map<string, Incident>
  onOpen: (p: Provider) => void
}) {
  const [scope, setScope] = useState<'all' | 'issues'>('all')
  const [tip, setTip] = useState<Tip | null>(null)
  const [col, setCol] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // Narrow screens can't fit the whole period: start at the most recent days.
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [period, scope])

  useEffect(() => {
    if (!tip) return
    const hide = () => setTip(null)
    window.addEventListener('scroll', hide, { passive: true, capture: true })
    return () => window.removeEventListener('scroll', hide, { capture: true })
  }, [tip])

  const rows = feed.providers
    .map((p) => ({ provider: p, t: tally(inRange(p, days)) }))
    .filter(({ provider, t }) => scope === 'all' || t.rejected + t.missing > 0 || open.has(provider.id))

  const template = `minmax(var(--provider-col), var(--provider-max)) repeat(${days.length}, minmax(22px, var(--day-max))) var(--rate-col)`
  const cellEdge = (i: number) => (i > 0 && isMonday(days[i]) ? 'border-l border-hairline/70' : '')
  const isToday = (d: string) => d === feed.asOf

  const show = (provider: Provider, batch: Batch, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setTip({ provider, batch, x: r.left + r.width / 2, y: r.top })
  }

  return (
    <Card
      eyebrow="Control diario"
      title="Calendario de envíos"
      subtitle="Un punto por proveedor y día hábil. Cada proveedor debe entregar su lote antes del cierre de su ventana; tocá una fila para ver el historial."
      actions={
        <>
          <Segmented
            size="sm"
            label="Proveedores"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'issues', label: 'Con incidencias' },
            ]}
          />
          <Segmented
            size="sm"
            label="Período"
            value={period}
            onChange={onPeriod}
            options={[
              { value: '10', label: '2 semanas' },
              { value: '20', label: '4 semanas' },
              { value: '40', label: '8 semanas' },
            ]}
          />
        </>
      }
    >
      <div
        ref={scroller}
        className="overflow-x-auto overscroll-x-contain pb-1 [--day-max:30px] [--provider-col:136px] [--provider-max:136px] [--rate-col:0px] max-sm:no-scrollbar sm:[--day-max:48px] sm:[--provider-col:168px] sm:[--provider-max:1fr] sm:[--rate-col:76px]"
      >
        <div key={period} className="min-w-max" onPointerLeave={() => setCol(null)}>
          <div className="grid items-end pb-2" style={{ gridTemplateColumns: template }}>
            <div className={`eyebrow sticky left-0 z-10 flex self-stretch items-end bg-ivory-raised pb-1 pl-3 ${EDGE}`}>Proveedor</div>
            {days.map((d, i) => {
              const monthStart = i === 0 || d.slice(5, 7) !== days[i - 1].slice(5, 7)
              return (
                <div
                  key={d}
                  className={clsx(
                    'flex flex-col items-center pb-0.5 leading-none transition-colors duration-200',
                    cellEdge(i),
                    col === i || isToday(d) ? 'text-ink' : 'text-ink-3',
                  )}
                >
                  <span className="mb-1.5 h-2.5 text-[10px] font-semibold tracking-[0.06em] text-cid-deep uppercase">
                    {monthStart ? monthOf(d) : ''}
                  </span>
                  <span className="text-[10.5px]">{isToday(d) ? 'hoy' : weekday(d)}</span>
                  <span
                    className={clsx(
                      'num mt-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11.5px] font-medium',
                      isToday(d) && 'bg-ink text-ivory',
                    )}
                  >
                    {dayNum(d)}
                  </span>
                </div>
              )
            })}
            <div className="eyebrow pr-3 text-right max-sm:hidden">Cumpl.</div>
          </div>

          <div>
            {rows.length === 0 && (
              <p className="px-3 py-8 text-center text-[13px] text-ink-3">Ningún proveedor registró incidencias en este período.</p>
            )}
            {rows.map(({ provider: p, t }, r) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(p)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return
                  e.preventDefault()
                  onOpen(p)
                }}
                aria-label={`Ver historial de ${p.name}`}
                className="focus-row group grid cursor-pointer items-stretch rounded-[14px] transition-colors duration-200 hover:bg-ivory"
                style={{ gridTemplateColumns: template }}
              >
                <div
                  className={`sticky left-0 z-10 flex items-center gap-2 rounded-l-[14px] bg-ivory-raised py-2.5 pr-2 pl-3 transition-colors duration-200 group-hover:bg-ivory sm:pr-3 ${EDGE}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-ink">{p.name}</span>
                      {t.expected > 0 && (
                        <span className={clsx('num shrink-0 text-[12px] font-semibold sm:hidden', rateTone(t.rate))}>
                          {fmtPct(t.rate, 0)}
                        </span>
                      )}
                    </div>
                    <RowStatus provider={p} incident={open.get(p.id)} />
                  </div>
                  <ChevronRight className="size-4 shrink-0 -translate-x-1 text-ink-3 opacity-0 transition-[opacity,translate] duration-300 ease-apple group-hover:translate-x-0 group-hover:opacity-100 max-sm:hidden" />
                </div>

                {days.map((d, c) => {
                  const b = batchOn(p, d)
                  return (
                    <div
                      key={d}
                      onPointerEnter={() => setCol(c)}
                      className={clsx(
                        'grid place-items-center transition-colors duration-200',
                        cellEdge(c),
                        isToday(d) && 'bg-ivory-sunken/60',
                        col === c && !isToday(d) && 'bg-ivory-sunken/40',
                      )}
                    >
                      {b ? (
                        <button
                          aria-label={`${p.name}, ${dayLabel(d)}: ${STATUS[b.status].label}`}
                          onPointerEnter={(e) => show(p, b, e.currentTarget)}
                          onPointerLeave={() => setTip(null)}
                          onFocus={(e) => show(p, b, e.currentTarget)}
                          onBlur={() => setTip(null)}
                          className="dot-in grid size-6 place-items-center rounded-full"
                          style={{ ['--r' as string]: r, ['--c' as string]: c }}
                        >
                          <StatusDot
                            status={b.status}
                            className="transition-transform duration-300 ease-spring hover:scale-[1.35]"
                          />
                        </button>
                      ) : (
                        <span aria-hidden className="size-1 rounded-full bg-hairline" />
                      )}
                    </div>
                  )
                })}

                <div className="flex flex-col items-end justify-center gap-1 pr-3 max-sm:hidden">
                  {t.expected ? (
                    <>
                      <span className={clsx('num text-[14px] font-semibold', rateTone(t.rate))}>{fmtPct(t.rate, 0)}</span>
                      <span className="h-[3px] w-10 overflow-hidden rounded-full bg-ivory-sunken">
                        <span
                          className="grow-x block h-full rounded-full"
                          style={{
                            width: `${t.rate * 100}%`,
                            background: rateColor(t.rate),
                            ['--i' as string]: r,
                          }}
                        />
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] text-ink-3">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-hairline pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-2">
          {(['ok', 'rejected', 'missing', 'pending'] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <StatusDot status={s} className="size-2.5!" />
              {STATUS[s].label}
            </span>
          ))}
        </div>
        <span className="text-[12px] text-ink-3">Solo días hábiles · los puntos grises indican que el proveedor aún no estaba conectado.</span>
      </div>

      {tip && <DotTip tip={tip} />}
    </Card>
  )
}

function RowStatus({ provider, incident }: { provider: Provider; incident?: Incident }) {
  if (incident && incident.kind !== 'pending') {
    const days = incident.count > 1 ? `${incident.count} días` : dayLabel(incident.latest.date)
    const label = { missing: 'No enviado', rejected: 'Rechazado', mixed: 'Sin lote válido' }[incident.kind]
    return (
      <div className={clsx('truncate text-[11.5px] font-medium', incident.kind === 'rejected' ? 'text-caution' : 'text-negative')}>
        {label} · {days}
      </div>
    )
  }
  if (incident) return <div className="truncate text-[11.5px] text-ink-3">Pendiente · hasta {provider.cutoff}</div>
  const last = lastOk(provider)
  return <div className="truncate text-[11.5px] text-ink-3">Al día{last?.receivedAt ? ` · ${last.receivedAt} h` : ''}</div>
}

function DotTip({ tip }: { tip: Tip }) {
  const { provider: p, batch: b } = tip
  const x = Math.min(window.innerWidth - 130, Math.max(130, tip.x))
  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: tip.y - 8 }}
    >
      <div className="bubble pop-in w-max max-w-[240px] bg-white/95 px-3.5 py-2.5 shadow-lift backdrop-blur">
        <div className="mb-1.5 flex items-center justify-between gap-4 text-[12px]">
          <span className="font-semibold text-ink">{p.name}</span>
          <span className="text-ink-3">{dayLabel(b.date)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: STATUS[b.status].color }}>
          <StatusDot status={b.status} className="size-2!" />
          {STATUS[b.status].short}
        </div>
        {b.receivedAt && (
          <div className="mt-1 flex justify-between gap-4 text-[12px] leading-5 text-ink-2">
            <span>Recibido</span>
            <span className="num font-medium text-ink">{b.receivedAt} h</span>
          </div>
        )}
        {b.rows !== undefined && (
          <div className="flex justify-between gap-4 text-[12px] leading-5 text-ink-2">
            <span>Gestiones</span>
            <span className="num font-medium text-ink">{fmtInt(b.rows)}</span>
          </div>
        )}
        {b.status === 'missing' && <p className="mt-1 text-[12px] leading-snug text-ink-2">Sin recepción antes del cierre de las {p.cutoff} h.</p>}
        {b.status === 'pending' && <p className="mt-1 text-[12px] leading-snug text-ink-2">La ventana cierra a las {p.cutoff} h.</p>}
        {b.error && <p className="mt-1.5 border-t border-hairline pt-1.5 text-[12px] leading-snug text-ink-2">{b.error}</p>}
      </div>
    </div>,
    document.body,
  )
}
