import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True once the surrounding surface has scrolled into view. Defaults to true outside a surface. */
export const RevealContext = createContext(true)
export const useRevealed = () => useContext(RevealContext)

/** Defers mounting (and therefore the entry animation) of heavy children until revealed. */
export function WhenRevealed({ children }: { children: ReactNode }) {
  return useRevealed() ? <>{children}</> : null
}

/**
 * Reveals an element the first time it enters the viewport. Surfaces further right get a
 * slightly later start so a row of cards cascades left to right.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window) || prefersReducedMotion()) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const left = Math.max(0, entry.boundingClientRect.left)
        el.style.setProperty('--reveal-delay', `${Math.round((left / window.innerWidth) * 180)}ms`)
        setVisible(true)
        io.disconnect()
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    const reveal = () => setVisible(true)
    window.addEventListener('beforeprint', reveal)
    return () => {
      io.disconnect()
      window.removeEventListener('beforeprint', reveal)
    }
  }, [])

  return [ref, visible] as const
}

/** Feeds the cursor position to the surface's CSS so its spotlight and edge glow can follow it. */
export function spotlight(e: ReactPointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - r.left}px`)
  el.style.setProperty('--my', `${e.clientY - r.top}px`)
}

/** Eases from the last shown value to the new target (ease-out cubic). */
export function useTweened(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const current = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      current.current = target
      setValue(target)
      return
    }
    const from = current.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const v = from + (target - from) * (1 - (1 - p) ** 3)
      current.current = v
      setValue(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

export function AnimatedNumber({
  value,
  format,
  className,
  duration,
}: {
  value: number
  format: (v: number) => string
  className?: string
  duration?: number
}) {
  const revealed = useRevealed()
  const shown = useTweened(revealed ? value : 0, duration)
  return (
    <span className={className}>
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
