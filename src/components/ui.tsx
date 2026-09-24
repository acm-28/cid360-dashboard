import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'

export const CHART = {
  ink: '#1D1D1F',
  axis: '#A19D96',
  grid: '#E4E0D7',
  muted: '#D9D4CA',
  mutedDeep: '#B9B3A8',
  cid: '#FF6B1A',
  cidMid: '#FF9A5C',
  cidLight: '#FFC49E',
  cidSoft: '#FFE7D6',
  font: 12,
}

export const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: CHART.axis, fontSize: CHART.font },
} as const

export function Card({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  eyebrow?: string
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={clsx('card rise flex min-w-0 flex-col p-5 md:p-7', className)}>
      {(title || actions) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
            {title && <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>}
            {subtitle && <p className="mt-1 max-w-[62ch] text-[13px] text-ink-2">{subtitle}</p>}
          </div>
          {actions && <div className="no-print no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

/** iOS-style segmented control with a sliding pill. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  label,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  label: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const [pill, setPill] = useState({ left: 0, width: 0 })
  const index = options.findIndex((o) => o.value === value)

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[index]
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [index, options.length])

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx(
        'relative inline-flex rounded-full bg-ivory-sunken p-[3px]',
        size === 'sm' ? 'text-[12px]' : 'text-[13px]',
      )}
    >
      <span
        aria-hidden
        className="absolute top-[3px] bottom-[3px] rounded-full bg-white shadow-pill transition-all duration-300 ease-apple"
        style={{ left: pill.left, width: pill.width }}
      />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'relative z-10 whitespace-nowrap rounded-full font-medium transition-colors duration-200',
            size === 'sm' ? 'px-3 py-1' : 'px-3.5 py-1.5',
            o.value === value ? 'text-ink' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Legend({ items }: { items: { color: string; label: string; shape?: 'dot' | 'line' }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span
            className={i.shape === 'line' ? 'h-[2px] w-3 rounded-full' : 'size-2 rounded-full'}
            style={{ background: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  )
}

export function TooltipShell({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="bubble min-w-[160px] bg-white/95 px-3.5 py-2.5 shadow-lift backdrop-blur">
      <div className="mb-1.5 text-[12px] font-semibold text-ink">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 text-[12px] leading-5">
          <span className="inline-flex items-center gap-1.5 text-ink-2">
            {r.color && <span className="size-1.5 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="num font-medium text-ink">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Delta({ value, suffix = 'pp', inverse = false }: { value: number; suffix?: string; inverse?: boolean }) {
  const good = inverse ? value < 0 : value > 0
  if (Math.abs(value) < 0.05) return <span className="text-[12px] text-ink-3">sin cambios</span>
  return (
    <span className={clsx('num text-[12px] font-medium', good ? 'text-positive' : 'text-negative')}>
      {value > 0 ? '▲' : '▼'} {Math.abs(value).toLocaleString('es-AR', { maximumFractionDigits: 1 })} {suffix}
    </span>
  )
}
