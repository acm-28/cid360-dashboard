import { useState } from 'react'
import { Card, Segmented } from './ui'
import { topics } from '../lib/metrics'
import { OBJECTION_TOPICS, PRACTICE_TOPICS, REASON_TOPICS } from '../lib/taxonomy'
import type { MacroRecord } from '../lib/types'
import { fmtInt, fmtPct } from '../lib/format'

const VIEWS = {
  reasons: { label: 'Motivos de no pago', catalog: REASON_TOPICS, note: 'gestiones donde el cliente expresó un motivo' },
  objections: { label: 'Objeciones', catalog: OBJECTION_TOPICS, note: 'gestiones con objeciones identificadas' },
  practices: { label: 'Buenas prácticas', catalog: PRACTICE_TOPICS, note: 'gestiones con buenas prácticas detectadas' },
} as const
type View = keyof typeof VIEWS

export function InsightsCard({ records }: { records: MacroRecord[] }) {
  const [view, setView] = useState<View>('reasons')
  const v = VIEWS[view]
  const data = topics(records, view, v.catalog)
  const max = Math.max(...data.rows.map((r) => r.value), 0.01)

  return (
    <Card
      eyebrow="Insights IA"
      title="Qué dicen las conversaciones"
      subtitle="Temas agregados a partir de los análisis de IA de cada gestión. No se muestran citas ni casos individuales."
      actions={
        <Segmented
          size="sm"
          label="Tipo de insight"
          value={view}
          onChange={setView}
          options={[
            { value: 'reasons', label: 'Motivos' },
            { value: 'objections', label: 'Objeciones' },
            { value: 'practices', label: 'Prácticas' },
          ]}
        />
      }
    >
      <div key={view} className="flex-1 space-y-3">
        {data.rows.length === 0 && <p className="text-[13px] text-ink-3">Sin temas identificados en esta selección.</p>}
        {data.rows.map((r, i) => (
          <div key={r.id} className="stagger-item focus-row group" style={{ ['--i' as string]: i }}>
            <div className="mb-1 flex items-baseline justify-between text-[13px]">
              <span className={i === 0 ? 'font-semibold text-ink' : 'text-ink'}>{r.label}</span>
              <span className="num font-medium text-ink-2">{fmtPct(r.value, 0)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ivory-sunken">
              <div
                className={`grow-x h-full rounded-full transition-[width,background-color] duration-700 ease-apple ${
                  i === 0 ? 'bg-cid' : 'bg-cid-light group-hover:bg-cid-mid'
                }`}
                style={{ ['--i' as string]: i, width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-hairline pt-4 text-[12px] text-ink-3">
        Base: {fmtInt(data.base)} {v.note} ({fmtPct(data.coverage, 0)} del total). Una gestión puede aportar a más de un tema.
      </p>
    </Card>
  )
}
