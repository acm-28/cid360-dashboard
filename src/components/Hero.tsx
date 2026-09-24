import { Fragment, type Dispatch, type SetStateAction } from 'react'
import { RotateCcw } from 'lucide-react'
import { Segmented } from './ui'
import { AnimatedNumber } from '../lib/motion'
import { DEFAULT_FILTERS, type Filters, type Kpis } from '../lib/metrics'
import { fmtDate, fmtInt, fmtPct } from '../lib/format'

export function Hero({
  date,
  kpis,
  filtered,
  total,
  filters,
  onFilters,
}: {
  date: string
  kpis: Kpis
  filtered: boolean
  total: number
  filters: Filters
  onFilters: Dispatch<SetStateAction<Filters>>
}) {
  const set = <K extends keyof Filters>(k: K) => (v: Filters[K]) => onFilters((prev) => ({ ...prev, [k]: v }))

  return (
    <section className="pt-10 pb-8 md:pt-14">
      <div className="fade-in mb-3 text-[13px] font-medium text-ink-2">{fmtDate(date)}</div>
      {kpis.total ? (
        <>
          <h1 className="max-w-[24ch] text-[34px] leading-[1.08] font-semibold tracking-[-0.035em] text-ink md:text-[48px]">
            <span className="word text-cid-deep" style={{ ['--i' as string]: 0 }}>
              <AnimatedNumber value={kpis.favorableRate} format={(v) => fmtPct(v, 0)} className="num" />
            </span>{' '}
            <Words text="de la cartera gestionada muestra probabilidad de pago favorable." offset={1} />
          </h1>
          <p className="fade-in mt-4 max-w-[64ch] text-[15px] text-ink-2" style={{ ['--delay' as string]: '520ms' }}>
            {fmtInt(kpis.total)} gestiones {filtered ? `de ${fmtInt(total)} ` : ''}analizadas por los modelos de calidad de
            CID360. {fmtPct(kpis.contactRate, 0)} logró contacto efectivo y {fmtPct(kpis.goodRate, 0)} alcanzó una
            probabilidad de pago buena.
          </p>
        </>
      ) : (
        <>
          <h1 className="max-w-[24ch] text-[34px] leading-[1.08] font-semibold tracking-[-0.035em] text-ink md:text-[48px]">
            <Words text="Ninguna gestión coincide con esta combinación." />
          </h1>
          <p className="mt-4 max-w-[64ch] text-[15px] text-ink-2">
            Ampliá la franja, la duración o la probabilidad para volver a ver el panorama de las {fmtInt(total)} gestiones.
          </p>
        </>
      )}

      <div
        className="fade-in no-print mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
        style={{ ['--delay' as string]: '680ms' }}
      >
        <FilterGroup label="Franja">
          <Segmented
            label="Franja horaria"
            value={filters.band}
            onChange={set('band')}
            options={[
              { value: 'all', label: 'Todo el día' },
              { value: 'morning', label: 'Mañana' },
              { value: 'afternoon', label: 'Tarde' },
            ]}
          />
        </FilterGroup>
        <FilterGroup label="Duración">
          <Segmented
            label="Duración de la gestión"
            value={filters.duration}
            onChange={set('duration')}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'null', label: '< 45 s' },
              { value: 'short', label: '< 2 min' },
              { value: 'mid', label: '2–5 min' },
              { value: 'deep', label: '> 5 min' },
            ]}
          />
        </FilterGroup>
        <FilterGroup label="Probabilidad">
          <Segmented
            label="Probabilidad de pago"
            value={filters.probability}
            onChange={set('probability')}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'good', label: 'Buena' },
              { value: 'regular', label: 'Regular' },
              { value: 'bad', label: 'Mala' },
            ]}
          />
        </FilterGroup>
        {filtered && (
          <button
            onClick={() => onFilters(DEFAULT_FILTERS)}
            className="group pop-in press inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] font-medium text-cid-deep hover:bg-cid-soft/60"
          >
            <RotateCcw className="size-3.5 transition-transform duration-500 ease-apple group-hover:-rotate-180" strokeWidth={2} />
            Restablecer
          </button>
        )}
      </div>
    </section>
  )
}

function Words({ text, offset = 0 }: { text: string; offset?: number }) {
  return text.split(' ').map((w, i) => (
    <Fragment key={`${w}-${i}`}>
      <span className="word" style={{ ['--i' as string]: i + offset }}>
        {w}
      </span>{' '}
    </Fragment>
  ))
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex max-w-full min-w-0 items-center gap-2.5">
      <span className="shrink-0 text-[12px] font-medium text-ink-3">{label}</span>
      <div className="no-scrollbar min-w-0 overflow-x-auto">{children}</div>
    </div>
  )
}
