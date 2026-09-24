const intFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
const decFmt = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const fmtInt = (n: number) => intFmt.format(n)
export const fmtDec = (n: number) => decFmt.format(n)
export const fmtPct = (ratio: number, digits = 1) =>
  `${new Intl.NumberFormat('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(ratio * 100)}%`
export const fmtPts = (delta: number) => `${delta >= 0 ? '+' : '−'}${decFmt.format(Math.abs(delta * 100))} pp`

export function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m ? `${m} min ${s.toString().padStart(2, '0')} s` : `${s} s`
}

export function fmtDate(iso: string, style: 'long' | 'short' = 'long') {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const text = new Intl.DateTimeFormat('es-AR', style === 'long'
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short' }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const hourLabel = (h: number) => `${h.toString().padStart(2, '0')} h`
