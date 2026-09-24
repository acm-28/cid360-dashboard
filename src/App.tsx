import { useMemo, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { TopBar } from './components/TopBar'
import { DropOverlay } from './components/DropOverlay'
import { Hero } from './components/Hero'
import { KpiRow } from './components/KpiRow'
import { FunnelCard } from './components/FunnelCard'
import { HourlyCard } from './components/HourlyCard'
import { DurationCard } from './components/DurationCard'
import { DynamicsCard } from './components/DynamicsCard'
import { ComplianceCard } from './components/ComplianceCard'
import { PlansCard } from './components/PlansCard'
import { SentimentCard } from './components/SentimentCard'
import { InsightsCard } from './components/InsightsCard'
import { SimulatorCard } from './components/SimulatorCard'
import { CustomizePanel } from './components/CustomizePanel'
import { DeliveriesPage } from './components/DeliveriesPage'
import { DELIVERIES, incidents } from './lib/deliveries'
import { useRoute } from './lib/useRoute'
import { Isotype, Logo } from './components/Logo'
import { useDatasets } from './lib/useDatasets'
import { useLayout, type ModuleId } from './lib/useLayout'
import {
  DEFAULT_FILTERS,
  applyFilters,
  compliance,
  durationMix,
  funnel,
  hourly,
  kpis,
  plans,
  sentiment,
  type Filters,
} from './lib/metrics'
import { fmtDate } from './lib/format'

const SPAN: Record<ModuleId, string> = {
  funnel: 'lg:col-span-5',
  hourly: 'lg:col-span-7',
  duration: 'lg:col-span-6',
  dynamics: 'lg:col-span-6',
  compliance: 'lg:col-span-7',
  plans: 'lg:col-span-5',
  sentiment: 'lg:col-span-5',
  insights: 'lg:col-span-7',
  simulator: 'lg:col-span-12',
}

const alerts = incidents(DELIVERIES).filter((i) => i.kind !== 'pending').length

export default function App() {
  const route = useRoute()
  const data = useDatasets()
  const layout = useLayout()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [customizing, setCustomizing] = useState(false)

  const all = data.current?.records ?? []
  const records = useMemo(() => applyFilters(all, filters), [all, filters])
  const filtered = records.length !== all.length

  const view = useMemo(() => {
    if (!records.length) return null
    return {
      kpis: kpis(records),
      funnel: funnel(records),
      hourly: hourly(records),
      duration: durationMix(records),
      compliance: compliance(records),
      plans: plans(records),
      sentiment: sentiment(records),
    }
  }, [records])

  const previousKpis = useMemo(() => {
    const prev = data.previous?.records
    if (!prev) return undefined
    const rs = applyFilters(prev, filters)
    return rs.length ? kpis(rs) : undefined
  }, [data.previous, filters])

  const modules: Record<ModuleId, () => ReactNode> = view
    ? {
        funnel: () => <FunnelCard stages={view.funnel} />,
        hourly: () => <HourlyCard rows={view.hourly} />,
        duration: () => <DurationCard rows={view.duration} />,
        dynamics: () => <DynamicsCard records={records} />,
        compliance: () => <ComplianceCard items={view.compliance} />,
        plans: () => <PlansCard data={view.plans} />,
        sentiment: () => <SentimentCard data={view.sentiment} />,
        insights: () => <InsightsCard records={records} />,
        simulator: () => <SimulatorCard records={records} />,
      }
    : ({} as Record<ModuleId, () => ReactNode>)

  return (
    <div className="min-h-screen">
      <TopBar
        route={route}
        alerts={alerts}
        dates={data.dates}
        active={data.current?.date}
        onSelect={data.setActive}
        onFiles={data.loadFiles}
        onCustomize={() => setCustomizing(true)}
      />
      {route === 'panorama' && <DropOverlay onFiles={data.loadFiles} />}

      {data.notice && (
        <div className="toast-in no-print fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-5 py-2.5 text-[13px] text-ivory shadow-lift">
          <span className="truncate">{data.notice}</span>
          <button onClick={data.clearNotice} aria-label="Cerrar aviso" className="text-ivory/60 hover:text-ivory">
            <X className="size-4" />
          </button>
        </div>
      )}

      {route === 'envios' ? (
        <DeliveriesPage />
      ) : (
        <main className="page pb-16 md:pb-20">
          {data.status.kind === 'error' && !data.current && <EmptyState title="No pudimos cargar los datos" body={data.status.message} />}
          {!data.current && data.status.kind === 'loading' && <Loading />}

          {data.current && (
            <>
              <div className="hidden print:block print:pt-2">
                <Logo />
              </div>
              <Hero
                date={data.current.date}
                kpis={view?.kpis ?? kpis([])}
                filtered={filtered}
                total={all.length}
                filters={filters}
                onFilters={setFilters}
              />

              {view && (
                <>
                  <KpiRow kpis={view.kpis} previous={previousKpis} />
                  <div className="mt-3 grid grid-flow-dense grid-cols-1 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-12">
                    {layout.order
                      .filter((id) => !layout.hidden.includes(id))
                      .map((id) => (
                        <div key={id} className={`flex min-w-0 [&>section]:flex-1 ${SPAN[id]}`}>
                          {modules[id]()}
                        </div>
                      ))}
                  </div>
                </>
              )}

              <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6 text-[12px] text-ink-3">
                <Logo compact />
                <p className="max-w-[80ch]">
                  Feed del {fmtDate(data.current.date).toLowerCase()} · {data.current.source}. Métricas agregadas: no incluyen identificadores
                  de clientes, gestores ni grabaciones. Contacto efectivo: más de 45 s de conversación. Probabilidad favorable: buena o
                  regular según el modelo de CID360.
                </p>
              </footer>
            </>
          )}
        </main>
      )}

      <CustomizePanel
        open={customizing && route === 'panorama'}
        onClose={() => setCustomizing(false)}
        order={layout.order}
        hidden={layout.hidden}
        onToggle={layout.toggle}
        onMove={layout.move}
        onReset={layout.reset}
      />
    </div>
  )
}

function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="fade-in flex flex-col items-center gap-4">
        <Isotype gradient live className="h-12 w-auto" />
        <span className="text-[13px] text-ink-2">Preparando el panorama del día…</span>
      </div>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card mx-auto mt-10 max-w-md p-10 text-center">
      <Isotype className="mx-auto mb-4 h-10 w-auto text-ink-3" />
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="mt-1.5 text-[13px] text-ink-2">{body}</p>
    </div>
  )
}
