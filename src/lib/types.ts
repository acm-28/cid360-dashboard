export type Sentiment = 'positive' | 'neutral' | 'negative'
export type Collection = 'good' | 'average' | 'poor'
export type Probability = 'good' | 'regular' | 'bad'
export type AuditValue = 'yes' | 'no' | 'na'
export type PlanId = 'refinancing' | 'planV' | 'mastercard' | 'cards'

/** Anonymized, aggregate-ready representation of one managed contact. */
export interface MacroRecord {
  date: string
  hour: number
  duration: number
  score: number
  talkRatio: number
  talkSpeed: number
  interactivity: number
  deadAir: number
  questions: number
  sentiment: Sentiment
  collection: Collection
  probability: Probability | null
  willingToNegotiate: boolean | null
  intendsToPay: boolean | null
  plans: PlanId[]
  audit: { strategy: AuditValue; information: AuditValue; guidelines: AuditValue }
  reasons: string[]
  objections: string[]
  practices: string[]
}

export interface Dataset {
  date: string
  source: string
  records: MacroRecord[]
  skipped: number
}
