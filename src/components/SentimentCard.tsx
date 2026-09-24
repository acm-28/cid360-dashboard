import { CHART, Card, Legend } from './ui'
import type { sentiment } from '../lib/metrics'
import { fmtInt, fmtPct } from '../lib/format'

const SHARE_COLORS = { positive: CHART.cid, neutral: CHART.muted, negative: '#6E6B66' }

/** Blends ivory → CID orange; keeps the matrix monochrome instead of a rainbow heatmap. */
function heat(v: number) {
  const a = [245, 243, 238]
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
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {data.share.map((s) => (
          <div key={s.id} className="transition-[flex-basis] duration-700 ease-apple" style={{ flexBasis: `${s.value * 100}%`, background: SHARE_COLORS[s.id] }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {data.share.map((s) => (
          <div key={s.id}>
            <div className="num text-[24px] font-semibold text-ink">{fmtPct(s.value, 0)}</div>
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
            {data.matrix.map((row) => (
              <tr key={row.id}>
                <td className="pr-2 text-left whitespace-nowrap text-ink">
                  {row.label} <span className="num text-ink-3">· {fmtInt(row.n)}</span>
                </td>
                {row.cells.map((c) => (
                  <td
                    key={c.id}
                    className="num h-10 rounded-[8px] text-center font-semibold"
                    style={{ background: heat(c.value), color: c.value > 0.45 ? '#fff' : '#1D1D1F' }}
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
