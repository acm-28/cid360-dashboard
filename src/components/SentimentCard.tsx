import { CHART, Card, Legend } from './ui'
import type { sentiment } from '../lib/metrics'
import { fmtInt, fmtPct } from '../lib/format'
import { AnimatedNumber } from '../lib/motion'

const SHARE_COLORS = { positive: CHART.cid, neutral: CHART.muted, negative: '#5C615E' }

/** Blends ivory → CID orange; keeps the matrix monochrome instead of a rainbow heatmap. */
function heat(v: number) {
  const a = [246, 247, 246]
  const b = [255, 107, 26]
  const t = Math.min(1, v * 1.25)
  return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * t)).join(',')})`
}

export function SentimentCard({ data }: { data: ReturnType<typeof sentiment> }) {
  return (
    <Card
      eyebrow="Experiencia"
      title="Sentimiento del cliente"
      subtitle="Tono predominante del cliente frente a la gestión y su cruce con la calidad del resultado de cobranza."
    >
      <div className="grow-x flex h-3 gap-[2px] overflow-hidden rounded-full">
        {data.share.map((s) => (
          <div key={s.id} className="transition-[flex-basis] duration-700 ease-apple" style={{ flexBasis: `${s.value * 100}%`, background: SHARE_COLORS[s.id] }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {data.share.map((s, i) => (
          <div key={s.id} className="stagger-item" style={{ ['--i' as string]: i }}>
            <AnimatedNumber value={s.value} format={(v) => fmtPct(v, 0)} className="num block text-[24px] font-semibold text-ink" />
            <div className="text-[12px] text-ink-2">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-hairline pt-5">
        <div className="mb-3 text-[12.5px] font-medium text-ink-2">Resultado de gestión según sentimiento</div>
        <table className="w-full border-separate border-spacing-[3px] text-[12px]">
          <thead>
            <tr>
              <th />
              {data.matrix[0].cells.map((c) => (
                <th key={c.id} className="pb-1 text-center font-medium text-ink-3">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row, ri) => (
              <tr key={row.id}>
                <td className="pr-2 text-left whitespace-nowrap text-ink">
                  {row.label} <span className="num text-ink-3">· {fmtInt(row.n)}</span>
                </td>
                {row.cells.map((c, ci) => (
                  <td
                    key={c.id}
                    className="stagger-item num h-10 rounded-[8px] text-center font-semibold transition-[transform,box-shadow,background-color] duration-300 ease-apple hover:scale-[1.04] hover:shadow-pill"
                    style={{
                      ['--i' as string]: 3 + ri + ci,
                      background: heat(c.value),
                      color: c.value > 0.45 ? '#fff' : '#171817',
                    }}
                  >
                    {row.n ? fmtPct(c.value, 0) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3">
          <Legend
            items={[
              { color: heat(0.1), label: 'Menor proporción' },
              { color: heat(0.8), label: 'Mayor proporción' },
            ]}
          />
        </div>
      </div>
    </Card>
  )
}
