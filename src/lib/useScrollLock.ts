import { useEffect } from 'react'

/** Freezes page scroll while a modal panel is open, so touch gestures only scroll the panel. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [locked])
}
