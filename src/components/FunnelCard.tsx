import { Card } from './ui'
import type { funnel } from '../lib/metrics'
import { fmtInt, fmtPct } from '../lib/format'
import { AnimatedNumber } from '../lib/motion'

export function FunnelCard({ stages }: { stages: ReturnType<typeof funnel> }) {
  const top = stages[0].value || 1
  const last = stages.length - 1

  return (
    <Card
      eyebrow="Conversión"
      title="Embudo de gestión"
      subtitle="Cuántas gestiones avanzan en cada etapa, desde el intento de contacto hasta una probabilidad de pago buena."
    >
      <ol className="flex flex-1 flex-col justify-center gap-3.5">
        {stages.map((s, i) => {
          const share = s.value / top
          const step = i ? s.value / (stages[i - 1].value || 1) : 1
          const focal = i === last - 1
          return (
            <li
              key={s.id}
              className="stagger-item focus-row grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 gap-y-1.5"
              style={{ ['--i' as string]: i }}
            >
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[13px] font-medium text-ink">{s.label}</span>
                {s.hint && <span className="hidden truncate text-[12px] text-ink-3 @lg:inline">{s.hint}</span>}
              </div>
              <div className="flex items-baseline gap-2 @md:gap-3">
                {i > 0 && (
                  <span className="num text-[12px] whitespace-nowrap text-ink-3">
                    {fmtPct(step, 0)}
                    <span className="hidden @md:inline"> de la etapa previa</span>
                  </span>
                )}
                <span className="num w-12 text-right text-[15px] font-semibold text-ink @md:w-14">{fmtInt(s.value)}</span>
              </div>
              <div className="col-span-2 h-2.5 overflow-hidden rounded-full bg-ivory-sunken">
                <div
                  className="grow-x h-full rounded-full transition-[width] duration-700 ease-apple"
                  style={{
                    ['--i' as string]: i,
                    width: `${Math.max(share * 100, 0.8)}%`,
                    background: focal ? '#FF6B1A' : i === last ? '#FF9A5C' : '#AEB3AE',
                  }}
                />
              </div>
            </li>
          )
        })}
      </ol>
      <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-hairline pt-4">
        <span className="text-[12.5px] text-ink-2">Recorren el embudo completo hasta probabilidad favorable</span>
        <AnimatedNumber value={stages[last - 1].value / top} format={fmtPct} className="num text-[22px] font-semibold text-cid-deep" />
      </div>
    </Card>
  )
}
