import { useEffect } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import clsx from 'clsx'
import { MODULES, type ModuleId } from '../lib/useLayout'

export function CustomizePanel({
  open,
  onClose,
  order,
  hidden,
  onToggle,
  onMove,
  onReset,
}: {
  open: boolean
  onClose: () => void
  order: ModuleId[]
  hidden: ModuleId[]
  onToggle: (id: ModuleId) => void
  onMove: (id: ModuleId, dir: -1 | 1) => void
  onReset: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
        aria-label="Personalizar módulos"
        className={clsx(
          'absolute top-3 right-3 bottom-3 flex w-[360px] max-w-[calc(100vw-24px)] flex-col rounded-[24px] bg-ivory-raised shadow-lift transition-transform duration-300 ease-apple',
          open ? 'translate-x-0' : 'translate-x-[110%]',
        )}
      >
        <header className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Personalizar</h2>
            <p className="text-[12.5px] text-ink-2">Elegí qué módulos ver y en qué orden.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid size-8 place-items-center rounded-full bg-ivory-sunken text-ink-2 hover:text-ink">
            <X className="size-4" strokeWidth={2} />
          </button>
        </header>
        <ul className="flex-1 overflow-y-auto px-3">
          {order.map((id, i) => {
            const meta = MODULES.find((m) => m.id === id)!
            const visible = !hidden.includes(id)
            return (
              <li key={id} className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 hover:bg-ivory">
                <Switch checked={visible} onChange={() => onToggle(id)} label={meta.label} />
                <span className={clsx('flex-1 text-[13.5px]', visible ? 'text-ink' : 'text-ink-3')}>{meta.label}</span>
                <div className="flex">
                  <MoveButton label="Subir" disabled={i === 0} onClick={() => onMove(id, -1)}>
                    <ChevronUp className="size-4" />
                  </MoveButton>
                  <MoveButton label="Bajar" disabled={i === order.length - 1} onClick={() => onMove(id, 1)}>
                    <ChevronDown className="size-4" />
                  </MoveButton>
                </div>
              </li>
            )
          })}
        </ul>
        <footer className="border-t border-hairline px-6 py-4">
          <button onClick={onReset} className="text-[13px] font-medium text-cid-deep hover:underline">
            Restablecer diseño predeterminado
          </button>
        </footer>
      </aside>
    </div>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={clsx('relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-cid' : 'bg-ivory-sunken')}
    >
      <span
        className={clsx(
          'absolute top-[2px] left-[2px] size-[18px] rounded-full bg-white shadow-pill transition-transform duration-200 ease-apple',
          checked && 'translate-x-4',
        )}
      />
    </button>
  )
}

function MoveButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-full text-ink-2 hover:bg-ivory-sunken hover:text-ink disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
