import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowUpFromLine, LockKeyhole, Printer, SlidersHorizontal } from 'lucide-react'
import { Logo } from './Logo'
import { fmtDate } from '../lib/format'

export function TopBar({
  dates,
  active,
  onSelect,
  onFiles,
  onCustomize,
}: {
  dates: string[]
  active?: string
  onSelect: (d: string) => void
  onFiles: (f: FileList) => void
  onCustomize: () => void
}) {
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
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-5 md:px-8">
        <Logo live className="shrink-0" />

        <div className="mx-2 hidden h-6 w-px bg-hairline md:block" />

        <nav className="hidden text-[13px] text-ink-2 md:block">
          <span className="font-medium text-ink">Panorama de gestión</span>
          <span className="mx-2 text-ink-3">/</span>
          Cobranzas
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-ink-2 lg:inline-flex">
            <LockKeyhole className="size-3.5" strokeWidth={1.75} />
            Datos anonimizados
          </span>

          {active && (
            <label className="relative">
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
          <IconButton label="Cargar feed diario (.jsonl)" onClick={() => input.current?.click()}>
            <ArrowUpFromLine className="size-4" strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Personalizar módulos" onClick={onCustomize}>
            <SlidersHorizontal className="size-4" strokeWidth={1.75} />
          </IconButton>
          <button
            onClick={() => window.print()}
            className="group press no-print relative ml-1 inline-flex items-center gap-2 overflow-hidden rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-ivory shadow-[0_1px_2px_rgb(23_24_23/0.2)]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-[left,opacity] duration-700 ease-apple group-hover:left-[120%] group-hover:opacity-100"
            />
            <Printer className="size-4 transition-transform duration-300 ease-apple group-hover:-translate-y-px" strokeWidth={1.75} />
            <span className="hidden sm:inline">Exportar reporte</span>
          </button>
        </div>
      </div>
    </header>
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
