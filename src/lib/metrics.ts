import type { MacroRecord, PlanId, Probability, Sentiment, Collection } from './types'
import type { Topic } from './taxonomy'

export type Band = 'all' | 'morning' | 'afternoon'
export type DurationBucket = 'null' | 'short' | 'mid' | 'deep'
export interface Filters {
  band: Band
  duration: 'all' | DurationBucket
  probability: 'all' | Probability
}

export const DEFAULT_FILTERS: Filters = { band: 'all', duration: 'all', probability: 'all' }

export const EFFECTIVE_CONTACT_SECONDS = 45
export const DEAD_AIR_TARGET_SECONDS = 5

export const DURATION_BUCKETS: { id: DurationBucket; label: string; hint: string }[] = [
  { id: 'null', label: '< 45 s', hint: 'Contacto nulo o buzón' },
  { id: 'short', label: '45 s – 2 min', hint: 'Contacto breve' },
  { id: 'mid', label: '2 – 5 min', hint: 'Negociación' },
  { id: 'deep', label: '> 5 min', hint: 'Negociación extendida' },
]

export function durationBucket(seconds: number): DurationBucket {
  if (seconds < 45) return 'null'
  if (seconds <= 120) return 'short'
  if (seconds <= 300) return 'mid'
  return 'deep'
}

const isMorning = (h: number) => h <= 13

export function applyFilters(records: MacroRecord[], f: Filters) {
  return records.filter(
    (r) =>
      (f.band === 'all' || (f.band === 'morning') === isMorning(r.hour)) &&
      (f.duration === 'all' || durationBucket(r.duration) === f.duration) &&
      (f.probability === 'all' || r.probability === f.probability),
  )
}

export const isFavorable = (r: MacroRecord) => r.probability === 'good' || r.probability === 'regular'
const isEffective = (r: MacroRecord) => r.duration > EFFECTIVE_CONTACT_SECONDS

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const rate = (rs: MacroRecord[], pred: (r: MacroRecord) => boolean) =>
  rs.length ? rs.filter(pred).length / rs.length : 0

function std(xs: number[]) {
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

export function hoursOf(records: MacroRecord[]) {
  const hs = [...new Set(records.map((r) => r.hour))].sort((a, b) => a - b)
  if (!hs.length) return []
  const out: number[] = []
  for (let h = hs[0]; h <= hs[hs.length - 1]; h++) out.push(h)
  return out
}

function byHour(records: MacroRecord[]) {
  const map = new Map<number, MacroRecord[]>()
  hoursOf(records).forEach((h) => map.set(h, []))
  records.forEach((r) => map.get(r.hour)?.push(r))
  return map
}

export interface Kpis {
  total: number
  contactRate: number
  favorableRate: number
  goodRate: number
  avgScore: number
  stdScore: number
  talkRatio: number
  deadAir: number
  avgDuration: number
  spark: { total: number[]; contact: number[]; favorable: number[]; score: number[]; talk: number[]; dead: number[] }
}

export function kpis(records: MacroRecord[]): Kpis {
  const hours = [...byHour(records).values()]
  return {
    total: records.length,
    contactRate: rate(records, isEffective),
    favorableRate: rate(records, isFavorable),
    goodRate: rate(records, (r) => r.probability === 'good'),
    avgScore: mean(records.map((r) => r.score)),
    stdScore: std(records.map((r) => r.score)),
    talkRatio: mean(records.map((r) => r.talkRatio)),
    deadAir: mean(records.map((r) => r.deadAir)),
    avgDuration: mean(records.map((r) => r.duration)),
    spark: {
      total: hours.map((h) => h.length),
      contact: hours.map((h) => rate(h, isEffective)),
      favorable: hours.map((h) => rate(h, isFavorable)),
      score: hours.map((h) => mean(h.map((r) => r.score))),
      talk: hours.map((h) => mean(h.map((r) => r.talkRatio))),
      dead: hours.map((h) => mean(h.map((r) => r.deadAir))),
    },
  }
}

export function funnel(records: MacroRecord[]) {
  const effective = records.filter(isEffective)
  const negotiating = effective.filter((r) => r.willingToNegotiate)
  const favorable = negotiating.filter(isFavorable)
  const good = favorable.filter((r) => r.probability === 'good')
  return [
    { id: 'total', label: 'Gestiones realizadas', value: records.length },
    { id: 'effective', label: 'Contacto efectivo', hint: '> 45 s de conversación', value: effective.length },
    { id: 'negotiate', label: 'Disposición a negociar', value: negotiating.length },
    { id: 'favorable', label: 'Probabilidad de pago favorable', hint: 'Buena o regular', value: favorable.length },
    { id: 'good', label: 'Probabilidad de pago buena', value: good.length },
  ]
}

export type HourlyMetric = 'favorable' | 'score' | 'duration'
export function hourly(records: MacroRecord[]) {
  return [...byHour(records).entries()].map(([hour, rs]) => ({
    hour,
    volume: rs.length,
    favorable: rs.length ? rate(rs, isFavorable) : null,
    score: rs.length ? mean(rs.map((r) => r.score)) : null,
    duration: rs.length ? mean(rs.map((r) => r.duration)) : null,
  }))
}

export function bestAndWorstHours(rows: ReturnType<typeof hourly>, minVolume = 30) {
  const eligible = rows.filter((r) => r.volume >= minVolume && r.favorable !== null)
  if (eligible.length < 2) return null
  const sorted = [...eligible].sort((a, b) => b.favorable! - a.favorable!)
  return { best: sorted[0], worst: sorted[sorted.length - 1] }
}

export function durationMix(records: MacroRecord[]) {
  return DURATION_BUCKETS.map((b) => {
    const rs = records.filter((r) => durationBucket(r.duration) === b.id)
    const n = rs.filter((r) => r.probability).length || 1
    return {
      ...b,
      count: rs.length,
      good: rs.filter((r) => r.probability === 'good').length / n,
      regular: rs.filter((r) => r.probability === 'regular').length / n,
      bad: rs.filter((r) => r.probability === 'bad').length / n,
    }
  })
}

export interface BoxStats {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
  n: number
}

function quantile(sorted: number[], q: number) {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/** Tukey box with whiskers at the last point within 1.5·IQR. */
export function boxStats(values: number[]): BoxStats | null {
  if (values.length < 3) return null
  const s = [...values].sort((a, b) => a - b)
  const q1 = quantile(s, 0.25)
  const q3 = quantile(s, 0.75)
  const iqr = q3 - q1
  const lo = s.find((v) => v >= q1 - 1.5 * iqr) ?? s[0]
  const hi = [...s].reverse().find((v) => v <= q3 + 1.5 * iqr) ?? s[s.length - 1]
  return { min: lo, q1, median: quantile(s, 0.5), q3, max: hi, mean: mean(s), n: s.length }
}

export type DynamicsMetric = 'talkSpeed' | 'interactivity' | 'deadAir' | 'questions' | 'talkRatio'
export const DYNAMICS_METRICS: { id: DynamicsMetric; label: string; unit: string; short: string }[] = [
  { id: 'talkSpeed', label: 'Velocidad de habla', unit: 'palabras/min', short: 'Velocidad' },
  { id: 'interactivity', label: 'Interactividad', unit: 'índice', short: 'Interactividad' },
  { id: 'talkRatio', label: 'Participación del gestor', unit: '%', short: 'Participación' },
  { id: 'deadAir', label: 'Silencio por gestión', unit: 's', short: 'Silencio' },
  { id: 'questions', label: 'Preguntas del gestor', unit: 'preguntas', short: 'Preguntas' },
]

export const PROBABILITY_LABEL: Record<Probability, string> = { good: 'Buena', regular: 'Regular', bad: 'Mala' }

export function dynamics(records: MacroRecord[], metric: DynamicsMetric) {
  const effective = records.filter(isEffective)
  return (['good', 'regular', 'bad'] as Probability[]).map((p) => ({
    probability: p,
    label: PROBABILITY_LABEL[p],
    stats: boxStats(effective.filter((r) => r.probability === p).map((r) => r[metric])),
  }))
}

export const AUDIT_ITEMS = [
  { id: 'strategy', label: 'Estrategia de recuperación', hint: 'Se aplica una estrategia orientada al pago' },
  { id: 'information', label: 'Información al cliente', hint: 'Datos de deuda comunicados con precisión' },
  { id: 'guidelines', label: 'Pautas de protocolo', hint: 'Saludo, identificación y cierre según guion' },
] as const

export function compliance(records: MacroRecord[]) {
  return AUDIT_ITEMS.map((item) => {
    const yes = records.filter((r) => r.audit[item.id] === 'yes').length
    const no = records.filter((r) => r.audit[item.id] === 'no').length
    const na = records.length - yes - no
    return { ...item, yes, no, na, rate: yes + no ? yes / (yes + no) : 0, evaluated: yes + no }
  })
}

export const PLAN_LABEL: Record<PlanId, string> = {
  refinancing: 'Refinanciación',
  planV: 'Plan V',
  mastercard: 'Plan Mastercard',
  cards: 'Tarjetas de crédito',
}

export function plans(records: MacroRecord[]) {
  const effective = records.filter(isEffective)
  const withPlan = effective.filter((r) => r.plans.length)
  const withoutPlan = effective.filter((r) => !r.plans.length)
  const rows = (Object.keys(PLAN_LABEL) as PlanId[])
    .map((id) => {
      const rs = effective.filter((r) => r.plans.includes(id))
      return { id, label: PLAN_LABEL[id], count: rs.length, favorable: rate(rs, isFavorable) }
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
  return {
    rows,
    offerRate: effective.length ? withPlan.length / effective.length : 0,
    withPlan: rate(withPlan, isFavorable),
    withoutPlan: rate(withoutPlan, isFavorable),
    withPlanCount: withPlan.length,
    effectiveCount: effective.length,
  }
}

export const SENTIMENT_LABEL: Record<Sentiment, string> = { positive: 'Positivo', neutral: 'Neutral', negative: 'Negativo' }
export const COLLECTION_LABEL: Record<Collection, string> = { good: 'Buena', average: 'Media', poor: 'Débil' }

export function sentiment(records: MacroRecord[]) {
  const order: Sentiment[] = ['positive', 'neutral', 'negative']
  const cols: Collection[] = ['good', 'average', 'poor']
  const total = records.length || 1
  return {
    share: order.map((s) => ({ id: s, label: SENTIMENT_LABEL[s], value: records.filter((r) => r.sentiment === s).length / total })),
    matrix: order.map((s) => {
      const rs = records.filter((r) => r.sentiment === s)
      return {
        id: s,
        label: SENTIMENT_LABEL[s],
        n: rs.length,
        cells: cols.map((c) => ({ id: c, label: COLLECTION_LABEL[c], value: rs.length ? rs.filter((r) => r.collection === c).length / rs.length : 0 })),
      }
    }),
  }
}

export function topics(records: MacroRecord[], key: 'reasons' | 'objections' | 'practices', catalog: Topic[]) {
  const tagged = records.filter((r) => r[key].length)
  return {
    base: tagged.length,
    coverage: records.length ? tagged.length / records.length : 0,
    rows: catalog
      .map((t) => ({ id: t.id, label: t.label, value: tagged.length ? tagged.filter((r) => r[key].includes(t.id)).length / tagged.length : 0 }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value),
  }
}

export interface Scenario {
  nullReduction: number
  planIncrease: number
  shiftToMorning: number
}

/** First-order what-if: each lever moves volume between segments at the rates observed that day. */
export function simulate(records: MacroRecord[], s: Scenario) {
  const favorable = records.filter(isFavorable).length
  const nulls = records.filter((r) => !isEffective(r))
  const effective = records.filter(isEffective)
  const effWithPlan = effective.filter((r) => r.plans.length)
  const effNoPlan = effective.filter((r) => !r.plans.length)
  const morning = records.filter((r) => isMorning(r.hour))
  const afternoon = records.filter((r) => !isMorning(r.hour))

  const levers = [
    {
      id: 'nullReduction' as const,
      gain: nulls.length * s.nullReduction * (rate(effective, isFavorable) - rate(nulls, isFavorable)),
    },
    {
      id: 'planIncrease' as const,
      gain: Math.min(effNoPlan.length, effective.length * s.planIncrease) * (rate(effWithPlan, isFavorable) - rate(effNoPlan, isFavorable)),
    },
    {
      id: 'shiftToMorning' as const,
      gain: afternoon.length * s.shiftToMorning * (rate(morning, isFavorable) - rate(afternoon, isFavorable)),
    },
  ]
  const extra = levers.reduce((a, l) => a + l.gain, 0)
  const total = records.length || 1
  return {
    baseRate: favorable / total,
    projectedRate: Math.min(1, (favorable + extra) / total),
    extra,
    levers,
    refs: {
      nulls: nulls.length,
      effectiveRate: rate(effective, isFavorable),
      nullRate: rate(nulls, isFavorable),
      planRate: rate(effWithPlan, isFavorable),
      noPlanRate: rate(effNoPlan, isFavorable),
      morningRate: rate(morning, isFavorable),
      afternoonRate: rate(afternoon, isFavorable),
      afternoon: afternoon.length,
    },
  }
}
