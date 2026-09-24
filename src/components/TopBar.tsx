import { useRef } from 'react'
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

  return (
    <header className="sticky top-0 z-30 border-b border-hairline/70 bg-ivory/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-5 md:px-8">
        <Logo className="shrink-0" />

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
            className="no-print ml-1 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-ivory transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="size-4" strokeWidth={1.75} />
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
      className="no-print grid size-9 place-items-center rounded-full text-ink-2 transition-colors duration-200 hover:bg-ivory-sunken hover:text-ink"
    >
      {children}
    </button>
  )
}
