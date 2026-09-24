import type { AuditValue, Dataset, MacroRecord, PlanId, Probability } from './types'
import { OBJECTION_TOPICS, PRACTICE_TOPICS, REASON_TOPICS, tagAnswer } from './taxonomy'

type Raw = Record<string, any>

const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

/** Looks up a key by accent/case-insensitive prefix, since source keys vary in accents and punctuation. */
function pick(obj: Raw | undefined, prefix: string): any {
  if (!obj) return undefined
  const target = fold(prefix)
  const key = Object.keys(obj).find((k) => fold(k).startsWith(target))
  return key === undefined ? undefined : obj[key]
}

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}

function audit(v: unknown): AuditValue {
  const s = fold(String(v ?? ''))
  if (s === 'yes' || s === 'si') return 'yes'
  if (s === 'no') return 'no'
  return 'na'
}

function probability(v: unknown): Probability | null {
  const s = fold(String(v ?? ''))
  if (s === 'bueno') return 'good'
  if (s === 'regular') return 'regular'
  if (s === 'malo') return 'bad'
  return null
}

function plans(v: unknown): PlanId[] {
  const list = (Array.isArray(v) ? v : [v]).map((x) => fold(String(x ?? '')))
  const out = new Set<PlanId>()
  for (const p of list) {
    if (p.includes('refinanc')) out.add('refinancing')
    if (p.includes('plan v')) out.add('planV')
    if (p.includes('mastercard')) out.add('mastercard')
    if (p.includes('credit card')) out.add('cards')
  }
  return [...out]
}

function insight(insights: Raw[] | undefined, prefix: string): string | undefined {
  const target = fold(prefix)
  return insights?.find((i) => fold(String(i?.question ?? '')).replace(/^¿/, '').includes(target))?.answer
}

/**
 * Maps one raw feed row to a MacroRecord. Identifiers, names, recordings,
 * transcripts and free text never leave this function.
 */
export function normalizeRow(raw: Raw): MacroRecord | null {
  const meta = raw?.call_metadata
  const start = String(meta?.call_start_time ?? '')
  const match = start.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2})/)
  if (!match) return null

  const entities = raw.custom_entities ?? {}
  const aiAudit = raw.ai_audit_parameters ?? {}
  const negotiate = fold(String(pick(entities, 'Nivel de disposicion') ?? ''))
  const intent = fold(String(pick(entities, 'Nivel de urgencia') ?? ''))
  const sentiment = fold(String(raw.customer_sentiment ?? 'neutral'))
  const collection = fold(String(raw.collection_analysis ?? 'poor'))

  return {
    date: match[1],
    hour: Number(match[2]),
    duration: num(meta.call_duration),
    score: num(raw.call_score),
    talkRatio: num(raw.talk_ratio),
    talkSpeed: num(raw.talk_speed),
    interactivity: num(raw.interactivity),
    deadAir: num(raw.dead_air_duration),
    questions: num(raw.agent_question_count),
    sentiment: sentiment === 'positive' || sentiment === 'negative' ? sentiment : 'neutral',
    collection: collection === 'good' || collection === 'average' ? collection : 'poor',
    probability: probability(pick(entities, 'Probabilidad de pago')),
    willingToNegotiate: negotiate ? !negotiate.startsWith('not') : null,
    intendsToPay: intent ? !intent.startsWith('no') : null,
    plans: plans(pick(entities, 'Agente que ofrece planes')),
    audit: {
      strategy: audit(pick(aiAudit, 'Estrategia')),
      information: audit(pick(aiAudit, 'Informacion')),
      guidelines: audit(pick(aiAudit, 'Pautas')),
    },
    reasons: tagAnswer(insight(raw.ai_insights, 'motivo de no pago'), REASON_TOPICS),
    objections: tagAnswer(insight(raw.ai_insights, 'objeciones'), OBJECTION_TOPICS),
    practices: tagAnswer(insight(raw.ai_insights, 'buenas practicas'), PRACTICE_TOPICS),
  }
}

function isMacroRecord(v: any): v is MacroRecord {
  return v && typeof v.date === 'string' && typeof v.hour === 'number' && 'probability' in v
}

/** Accepts a raw daily .jsonl feed or an already-anonymized .json export. */
export function parseFeed(text: string, source: string): Dataset {
  const trimmed = text.trim()
  let rows: Raw[] = []
  let skipped = 0

  if (trimmed.startsWith('[')) {
    rows = JSON.parse(trimmed)
  } else {
    for (const line of trimmed.split(/\r?\n/)) {
      if (!line.trim()) continue
      try {
        rows.push(JSON.parse(line))
      } catch {
        skipped++
      }
    }
  }

  const records: MacroRecord[] = []
  for (const row of rows) {
    const rec = isMacroRecord(row) ? row : normalizeRow(row)
    if (rec) records.push(rec)
    else skipped++
  }
  if (!records.length) throw new Error('El archivo no contiene gestiones con el formato esperado.')

  const counts = new Map<string, number>()
  records.forEach((r) => counts.set(r.date, (counts.get(r.date) ?? 0) + 1))
  const date = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]

  return { date, source, records, skipped }
}
