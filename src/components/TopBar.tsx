import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowUpFromLine, LockKeyhole, Printer, SlidersHorizontal } from 'lucide-react'
import { Logo } from './Logo'
import { fmtDate } from '../lib/format'
import { ROUTES, type Route } from '../lib/useRoute'

export function TopBar({
  route,
  alerts,
  dates,
  active,
  onSelect,
  onFiles,
  onCustomize,
}: {
  route: Route
  alerts: number
  dates: string[]
  active?: string
  onSelect: (d: string) => void
  onFiles: (f: FileList) => void
  onCustomize: () => void
}) {
  const panorama = route === 'panorama'
  const input = useRef<HTMLInputElement>(null)
  const progress = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
        if (progress.current) progress.current.style.transform = `scaleX(${p})`
        setScrolled(window.scrollY > 4)
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-500 ease-apple',
        scrolled
          ? 'border-hairline/70 bg-ivory/75 shadow-[0_1px_12px_rgb(23_24_23/0.03)]'
          : 'border-transparent bg-ivory/0',
      )}
    >
      <div
        ref={progress}
        aria-hidden
        className={clsx(
          'no-print absolute bottom-[-1px] left-0 h-px w-full origin-left bg-cid/70 transition-opacity duration-500',
          scrolled ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transform: 'scaleX(0)' }}
      />
      <div className="page">
        <div className="flex h-14 items-center gap-3 md:h-16 md:gap-4">
          <Logo live className="shrink-0" />

          <div className="mx-1 hidden h-6 w-px bg-hairline md:block" />

          <div className="hidden md:block">
            <NavTabs route={route} alerts={alerts} />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-ink-2 xl:inline-flex">
              <LockKeyhole className="size-3.5" strokeWidth={1.75} />
              Datos anonimizados
            </span>

            {panorama && active && (
              <FeedSelect dates={dates} active={active} onSelect={onSelect} className="hidden md:block" />
            )}

            <input
              ref={input}
              type="file"
              accept=".jsonl,.json,application/json"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) onFiles(e.target.files)
                e.target.value = ''
              }}
            />
            {panorama && (
              <>
                <IconButton label="Cargar feed diario (.jsonl)" onClick={() => input.current?.click()}>
                  <ArrowUpFromLine className="size-4" strokeWidth={1.75} />
                </IconButton>
                <IconButton label="Personalizar módulos" onClick={onCustomize}>
                  <SlidersHorizontal className="size-4" strokeWidth={1.75} />
                </IconButton>
              </>
            )}
            <button
              onClick={() => window.print()}
              aria-label="Exportar reporte"
              className="group press no-print relative ml-1 inline-flex size-9 items-center justify-center gap-2 overflow-hidden rounded-full bg-ink text-[13px] font-medium text-ivory shadow-[0_1px_2px_rgb(23_24_23/0.2)] lg:size-auto lg:px-4 lg:py-2"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-[left,opacity] duration-700 ease-apple group-hover:left-[120%] group-hover:opacity-100"
              />
              <Printer className="size-4 transition-transform duration-300 ease-apple group-hover:-translate-y-px" strokeWidth={1.75} />
              <span className="hidden lg:inline">Exportar reporte</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pb-2.5 md:hidden">
          <NavTabs route={route} alerts={alerts} />
          {panorama && active && <FeedSelect dates={dates} active={active} onSelect={onSelect} />}
        </div>
      </div>
    </header>
  )
}

function FeedSelect({
  dates,
  active,
  onSelect,
  className,
}: {
  dates: string[]
  active: string
  onSelect: (d: string) => void
  className?: string
}) {
  return (
    <label className={clsx('relative shrink-0', className)}>
      <span className="sr-only">Fecha del feed</span>
      <select
        value={active}
        onChange={(e) => onSelect(e.target.value)}
        disabled={dates.length < 2}
        className="no-print appearance-none rounded-full bg-ivory-sunken py-1.5 pr-4 pl-3.5 text-[13px] font-medium text-ink disabled:cursor-default enabled:cursor-pointer enabled:pr-8"
      >
        {dates.map((d) => (
          <option key={d} value={d}>
            {fmtDate(d, 'short')}
          </option>
        ))}
      </select>
      {dates.length > 1 && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-ink-3">▾</span>
      )}
    </label>
  )
}

function NavTabs({ route, alerts }: { route: Route; alerts: number }) {
  const refs = useRef<Partial<Record<Route, HTMLAnchorElement | null>>>({})
  const [pill, setPill] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[route]
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [route])

  return (
    <nav aria-label="Secciones" className="no-print relative inline-flex shrink-0 rounded-full bg-ivory-sunken/80 p-[3px] text-[13px]">
      <span
        aria-hidden
        className={clsx(
          'absolute top-[3px] bottom-[3px] rounded-full bg-white shadow-pill',
          pill.width > 0 && 'transition-[left,width] duration-[460ms] ease-spring',
        )}
        style={{ left: pill.left, width: pill.width }}
      />
      {(Object.keys(ROUTES) as Route[]).map((id) => (
        <a
          key={id}
          ref={(el) => {
            refs.current[id] = el
          }}
          href={ROUTES[id].href}
          aria-current={id === route ? 'page' : undefined}
          title={id === 'envios' && alerts ? `${alerts} ${alerts === 1 ? 'incidencia abierta' : 'incidencias abiertas'}` : undefined}
          className={clsx(
            'press relative z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium whitespace-nowrap',
            id === route ? 'text-ink' : 'text-ink-2 hover:text-ink',
          )}
        >
          {ROUTES[id].label}
          {id === 'envios' && alerts > 0 && (
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-negative/50 [animation-duration:2.4s]" />
              <span className="relative size-1.5 rounded-full bg-negative" />
            </span>
          )}
        </a>
      ))}
    </nav>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="press no-print grid size-9 place-items-center rounded-full text-ink-2 hover:bg-ivory-sunken hover:text-ink [&>svg]:transition-transform [&>svg]:duration-300 [&>svg]:ease-apple hover:[&>svg]:-translate-y-px"
    >
      {children}
    </button>
  )
}
