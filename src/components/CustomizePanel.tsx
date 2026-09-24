import { useEffect, useLayoutEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import clsx from 'clsx'
import { MODULES, type ModuleId } from '../lib/useLayout'
import { prefersReducedMotion } from '../lib/motion'

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
  const items = useRef(new Map<string, HTMLLIElement>())
  const tops = useRef(new Map<string, number>())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // FLIP: reordered rows glide from their previous slot instead of jumping.
  useLayoutEffect(() => {
    items.current.forEach((el, id) => {
      const prev = tops.current.get(id)
      const top = el.offsetTop
      if (prev !== undefined && prev !== top && !prefersReducedMotion()) {
        el.animate([{ transform: `translateY(${prev - top}px)` }, { transform: 'none' }], {
          duration: 460,
          easing: 'cubic-bezier(0.34, 1.28, 0.64, 1)',
        })
      }
      tops.current.set(id, top)
    })
  }, [order])

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
          'absolute top-3 right-3 bottom-3 flex w-[360px] max-w-[calc(100vw-24px)] flex-col rounded-[24px] bg-ivory-raised shadow-lift transition-transform',
          open ? 'translate-x-0 duration-[560ms] ease-spring' : 'translate-x-[110%] duration-300 ease-apple',
        )}
      >
        <header className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Personalizar</h2>
            <p className="text-[12.5px] text-ink-2">Elegí qué módulos ver y en qué orden.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="group press grid size-8 place-items-center rounded-full bg-ivory-sunken text-ink-2 hover:text-ink"
          >
            <X className="size-4 transition-transform duration-300 ease-apple group-hover:rotate-90" strokeWidth={2} />
          </button>
        </header>
        <ul className="flex-1 overflow-y-auto px-3" data-reveal={open ? 'in' : 'pending'}>
          {order.map((id, i) => {
            const meta = MODULES.find((m) => m.id === id)!
            const visible = !hidden.includes(id)
            return (
              <li
                key={id}
                ref={(el) => {
                  if (el) items.current.set(id, el)
                  else items.current.delete(id)
                }}
                className="stagger-item flex items-center gap-3 rounded-[14px] px-3 py-2.5 transition-colors duration-200 hover:bg-ivory"
                style={{ ['--i' as string]: i }}
              >
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
      className={clsx(
        'group relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-300 ease-apple',
        checked ? 'bg-cid' : 'bg-ivory-sunken',
      )}
    >
      <span
        className={clsx(
          'absolute top-[2px] left-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-pill transition-[translate,width] duration-[380ms] ease-spring group-active:w-[22px]',
          checked && 'translate-x-4 group-active:translate-x-3',
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
      className="press grid size-7 place-items-center rounded-full text-ink-2 hover:bg-ivory-sunken hover:text-ink disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
