import { useEffect } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { SheetHandle } from './ui'
import { StatusDot, rateColor, rateTone } from './DeliveryCalendarCard'
import { STATUS, dayLabel, describe, inRange, lastOk, tally, type Incident, type Provider } from '../lib/deliveries'
import { fmtDate, fmtInt, fmtPct } from '../lib/format'
import { useScrollLock } from '../lib/useScrollLock'

export function ProviderPanel({
  provider,
  incident,
  days,
  asOf,
  open,
  onClose,
}: {
  provider: Provider | null
  incident?: Incident
  days: string[]
  asOf: string
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useScrollLock(open)

  const batches = provider ? inRange(provider, days) : []
  const t = tally(batches)
  const last = provider ? lastOk(provider) : undefined
  const r = 38
  const c = 2 * Math.PI * r

  return (
    <div
      className={clsx(
        'no-print fixed inset-0 z-40 transition-[visibility] duration-300',
        open ? 'visible' : 'pointer-events-none invisible',
      )}
    >
      <div
        onClick={onClose}
        className={clsx('absolute inset-0 bg-ink/10 backdrop-blur-[2px] transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
      />
      <aside
        role="dialog"
        aria-label={provider ? `Historial de ${provider.name}` : 'Historial del proveedor'}
        className={clsx(
          'sheet absolute flex flex-col rounded-[24px] bg-ivory-raised shadow-lift transition-[translate] sm:w-[400px]',
          open ? 'duration-[560ms] ease-spring' : 'sheet-closed duration-300 ease-apple',
        )}
      >
        <SheetHandle />
        {provider && (
          <>
            <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
              <div>
                <div className="eyebrow mb-1">Proveedor</div>
                <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{provider.name}</h2>
                <p className="mt-0.5 text-[12.5px] text-ink-2">
                  Conectado desde el {fmtDate(provider.since, 'short').toLowerCase()} ·{' '}
                  <span className="whitespace-nowrap">ventana hasta las {provider.cutoff} h</span>
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="group press grid size-8 shrink-0 place-items-center rounded-full bg-ivory-sunken text-ink-2 hover:text-ink"
              >
                <X className="size-4 transition-transform duration-300 ease-apple group-hover:rotate-90" strokeWidth={2} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6" data-reveal={open ? 'in' : 'pending'}>
              {incident && (
                <div
                  className={clsx(
                    'stagger-item mb-4 rounded-[16px] px-4 py-3',
                    incident.kind === 'pending' ? 'bg-ivory' : incident.kind === 'rejected' ? 'bg-caution/10' : 'bg-negative/[0.07]',
                  )}
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <StatusDot status={incident.kind === 'mixed' ? 'missing' : incident.kind} className="size-2.5!" />
                    {describe(incident, asOf).title}
                  </div>
                  <p className="mt-0.5 pl-[18px] text-[12.5px] text-ink-2">{describe(incident, asOf).detail}</p>
                </div>
              )}

              <div className="stagger-item flex items-center gap-5 rounded-[18px] bg-ivory p-4" style={{ ['--i' as string]: 1 }}>
                <div className="relative shrink-0">
                  <svg viewBox="0 0 92 92" className="size-[92px] -rotate-90" aria-hidden>
                    <circle cx="46" cy="46" r={r} fill="none" stroke="#E2E3DE" strokeWidth="6" />
                    <circle
                      key={`${provider.id}-${days.length}`}
                      cx="46"
                      cy="46"
                      r={r}
                      fill="none"
                      stroke={rateColor(t.rate)}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${c * t.rate} ${c}`}
                      className="ring-progress"
                    />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <span className={clsx('num text-[20px] font-semibold', t.expected ? rateTone(t.rate) : 'text-ink-3')}>
                      {t.expected ? fmtPct(t.rate, 0) : '—'}
                    </span>
                  </div>
                </div>
                <dl className="grid flex-1 grid-cols-1 gap-1.5 text-[12.5px]">
                  <Stat label="Lotes esperados" value={t.expected} />
                  <Stat label={STATUS.ok.short} value={t.ok} color={STATUS.ok.color} />
                  <Stat label={STATUS.rejected.short} value={t.rejected} color={STATUS.rejected.color} />
                  <Stat label={STATUS.missing.short} value={t.missing} color={STATUS.missing.color} />
                </dl>
              </div>

              <p className="stagger-item mt-3 px-1 text-[12px] text-ink-3" style={{ ['--i' as string]: 2 }}>
                {last
                  ? `Último lote válido: ${dayLabel(last.date)} a las ${last.receivedAt} h, ${fmtInt(last.rows ?? 0)} gestiones.`
                  : 'Todavía no hay lotes válidos.'}
              </p>

              <h3 className="eyebrow mt-6 mb-2 px-1">Historial · últimos {days.length} días hábiles</h3>
              <ol>
                {[...batches].reverse().map((b, i) => (
                  <li
                    key={b.date}
                    className="stagger-item flex items-start gap-3 rounded-[12px] px-2 py-2 transition-colors duration-200 hover:bg-ivory"
                    style={{ ['--i' as string]: Math.min(i + 3, 14) }}
                  >
                    <StatusDot status={b.status} className="mt-[3px] size-2.5!" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3 text-[13px]">
                        <span className="font-medium text-ink">{b.date === asOf ? 'Hoy' : dayLabel(b.date)}</span>
                        <span className="num text-[12px] text-ink-3">
                          {b.receivedAt ? `${b.receivedAt} h` : b.status === 'pending' ? `hasta ${provider.cutoff} h` : 'sin recepción'}
                        </span>
                      </div>
                      <div className="text-[12px] text-ink-2">
                        {STATUS[b.status].short}
                        {b.rows !== undefined && ` · ${fmtInt(b.rows)} gestiones`}
                      </div>
                      {b.error && <div className="mt-0.5 text-[12px] text-caution">{b.error}</div>}
                    </div>
                  </li>
                ))}
                {batches.length === 0 && <li className="px-2 py-3 text-[13px] text-ink-3">Sin lotes esperados en este período.</li>}
              </ol>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-ink-2">
        {color && <span className="size-1.5 rounded-full" style={{ background: color }} />}
        {label}
      </dt>
      <dd className="num font-medium text-ink">{fmtInt(value)}</dd>
    </div>
  )
}
