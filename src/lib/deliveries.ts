export type BatchStatus = 'ok' | 'rejected' | 'missing' | 'pending'

/** One expected daily batch from a provider. `pending` only applies to today, before the provider's cutoff. */
export interface Batch {
  date: string
  status: BatchStatus
  receivedAt?: string
  rows?: number
  error?: string
}

export interface Provider {
  id: string
  name: string
  since: string
  cutoff: string
  /** One entry per business day from `since` through the feed's `asOf`. */
  batches: Batch[]
}

export interface DeliveryFeed {
  asOf: string
  updatedAt: string
  days: string[]
  providers: Provider[]
}

export const STATUS: Record<BatchStatus, { label: string; short: string; color: string }> = {
  ok: { label: 'Lote enviado con éxito', short: 'Enviado', color: '#2F7D5B' },
  rejected: { label: 'Lote enviado y rechazado por error técnico', short: 'Rechazado', color: '#D98A1C' },
  missing: { label: 'Lote no enviado', short: 'No enviado', color: '#B8412E' },
  pending: { label: 'Dentro de la ventana de envío', short: 'Pendiente', color: '#8B908C' },
}

const WEEKDAY = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá']

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const weekday = (iso: string) => WEEKDAY[parse(iso).getDay()]
export const dayNum = (iso: string) => String(parse(iso).getDate())
export const isMonday = (iso: string) => parse(iso).getDay() === 1
/** "mi 23/09" */
export const dayLabel = (iso: string) => `${weekday(iso)} ${iso.slice(8, 10)}/${iso.slice(5, 7)}`

function businessDays(from: string, to: string) {
  const out: string[] = []
  for (const d = parse(from); d <= parse(to); d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(toISO(d))
  }
  return out
}

// ——— Metrics ———

export const isResolved = (b: Batch) => b.status !== 'pending'

export function inRange(p: Provider, days: string[]) {
  const [from, to] = [days[0], days[days.length - 1]]
  return p.batches.filter((b) => b.date >= from && b.date <= to)
}

export interface Tally {
  expected: number
  ok: number
  rejected: number
  missing: number
  rate: number
}

export function tally(batches: Batch[]): Tally {
  const t = { expected: 0, ok: 0, rejected: 0, missing: 0, rate: 0 }
  for (const b of batches) {
    if (!isResolved(b)) continue
    t.expected++
    if (b.status === 'ok') t.ok++
    else if (b.status === 'rejected') t.rejected++
    else t.missing++
  }
  t.rate = t.expected ? t.ok / t.expected : 0
  return t
}

export function daily(feed: DeliveryFeed, days: string[]) {
  return days.map((date) => ({
    date,
    ...tally(feed.providers.flatMap((p) => p.batches.filter((b) => b.date === date))),
  }))
}

export const batchOn = (p: Provider, date: string) => p.batches.find((b) => b.date === date)
export const lastOk = (p: Provider) => [...p.batches].reverse().find((b) => b.status === 'ok')
export const lastResolved = (p: Provider) => [...p.batches].reverse().find(isResolved)

export type IncidentKind = 'missing' | 'mixed' | 'rejected' | 'pending'

export interface Incident {
  provider: Provider
  kind: IncidentKind
  /** Consecutive business days without a valid batch (0 for pending). */
  count: number
  from: string
  latest: Batch
}

const SEVERITY: Record<IncidentKind, number> = { missing: 0, mixed: 1, rejected: 2, pending: 3 }

/** Open problems: the unbroken run of non-valid batches that ends at each provider's latest resolved day. */
export function incidents(feed: DeliveryFeed): Incident[] {
  const out: Incident[] = []
  for (const p of feed.providers) {
    const done = p.batches.filter(isResolved)
    const run: Batch[] = []
    for (let i = done.length - 1; i >= 0 && done[i].status !== 'ok'; i--) run.unshift(done[i])
    if (run.length) {
      const kinds = new Set(run.map((b) => b.status))
      out.push({
        provider: p,
        kind: kinds.size > 1 ? 'mixed' : (run[0].status as 'missing' | 'rejected'),
        count: run.length,
        from: run[0].date,
        latest: run[run.length - 1],
      })
    }
    const today = batchOn(p, feed.asOf)
    if (today?.status === 'pending') out.push({ provider: p, kind: 'pending', count: 0, from: today.date, latest: today })
  }
  return out.sort((a, b) => SEVERITY[a.kind] - SEVERITY[b.kind] || b.count - a.count)
}

export function describe(inc: Incident, asOf: string) {
  const when = inc.latest.date === asOf ? 'de hoy' : `del ${dayLabel(inc.latest.date)}`
  const cutoff = `a las ${inc.provider.cutoff}`
  switch (inc.kind) {
    case 'pending':
      return { title: 'Lote de hoy pendiente', detail: `La ventana de envío sigue abierta hasta las ${inc.provider.cutoff}.` }
    case 'missing':
      return inc.count > 1
        ? { title: `${inc.count} días hábiles sin enviar lotes`, detail: `Sin envíos desde el ${dayLabel(inc.from)}.` }
        : { title: `No envió el lote ${when}`, detail: `La ventana cerró ${cutoff}.` }
    case 'rejected':
      return inc.count > 1
        ? { title: `${inc.count} días hábiles con lotes rechazados`, detail: `Último error: ${inc.latest.error}.` }
        : { title: `Lote ${when} rechazado`, detail: `${inc.latest.error}.` }
    case 'mixed':
      return {
        title: `${inc.count} días hábiles sin un lote válido`,
        detail: `Alterna rechazos y faltantes desde el ${dayLabel(inc.from)}.`,
      }
  }
}

/** Short clause for the page headline, e.g. "Próximo acumula 4 días hábiles con lotes rechazados". */
export function clause(inc: Incident, asOf: string) {
  const name = inc.provider.name
  const today = inc.latest.date === asOf
  switch (inc.kind) {
    case 'pending':
      return `${name} tiene tiempo hasta las ${inc.provider.cutoff}`
    case 'missing':
      return inc.count > 1
        ? `${name} lleva ${inc.count} días hábiles sin enviar`
        : `${name} no envió el lote ${today ? 'de hoy' : `del ${dayLabel(inc.latest.date)}`}`
    case 'rejected':
      return inc.count > 1
        ? `${name} acumula ${inc.count} días hábiles con lotes rechazados`
        : `${name} tuvo un lote rechazado ${today ? 'hoy' : `el ${dayLabel(inc.latest.date)}`}`
    case 'mixed':
      return `${name} lleva ${inc.count} días hábiles sin un lote válido`
  }
}

export function joinEs(parts: string[]) {
  if (parts.length < 2) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`
}

// ——— Sample feed ———
// September mirrors the provider control sheet; earlier weeks are generated deterministically.

const RECENT_DAYS = ['02', '03', '04', '07', '08', '09', '10', '11', '14', '15', '16', '17', '18', '21', '22', '23', '24'].map(
  (d) => `2026-09-${d}`,
)
const CODES: Record<string, BatchStatus> = { o: 'ok', r: 'rejected', x: 'missing', p: 'pending' }
const ERRORS = [
  'Esquema inválido: falta el campo duration',
  'Archivo vacío, sin registros',
  'Codificación distinta de UTF-8',
  'La fecha del lote no coincide con el día informado',
  'Registros duplicados dentro del lote',
]

const SAMPLE = [
  { id: 'vn', name: 'VN', since: '2026-06-01', cutoff: '09:00', scale: 14200, recent: 'ooooooooooooooooo' },
  { id: 'proximo', name: 'Próximo', since: '2026-07-13', cutoff: '10:00', scale: 9800, recent: 'ooooxooxooooorrrr' },
  { id: 'suivant', name: 'Suivant', since: '2026-08-03', cutoff: '10:00', scale: 7600, recent: 'oooooooooxooooooo' },
  { id: 'activos', name: '+Activos', since: '2026-06-15', cutoff: '11:00', scale: 11400, recent: 'oooooxxxxxxooxroo' },
  { id: 'multiconex', name: 'Multiconex', since: '2026-09-17', cutoff: '12:00', scale: 5300, recent: '...........oorrox' },
  { id: 'pena', name: 'Pena', since: '2026-09-22', cutoff: '18:00', scale: 3100, recent: '..............rop' },
]

function seeded(key: string) {
  let a = [...key].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildSample(): DeliveryFeed {
  const asOf = '2026-09-24'
  const days = businessDays('2026-06-01', asOf)
  const providers = SAMPLE.map(({ recent, scale, ...p }) => {
    const rand = seeded(p.id)
    const [ch, cm] = p.cutoff.split(':').map(Number)
    const latest = ch * 60 + cm - 15
    const time = () => {
      const m = 390 + Math.floor(rand() * (latest - 390))
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    }
    const batches = days
      .filter((d) => d >= p.since)
      .map((date): Batch => {
        const i = RECENT_DAYS.indexOf(date)
        const r = rand()
        const status = i >= 0 ? CODES[recent[i]] : r < 0.93 ? 'ok' : r < 0.965 ? 'rejected' : 'missing'
        const rows = Math.round(scale * (0.82 + rand() * 0.36))
        if (status === 'ok') return { date, status, receivedAt: time(), rows }
        if (status === 'rejected') {
          const error = ERRORS[Math.floor(rand() * ERRORS.length)]
          return { date, status, receivedAt: time(), rows: error.startsWith('Archivo vacío') ? 0 : rows, error }
        }
        return { date, status }
      })
    return { ...p, batches }
  })
  return { asOf, updatedAt: '16:30', days, providers }
}

export const DELIVERIES = buildSample()
