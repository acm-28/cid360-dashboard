import { Delta } from './ui'
import { DEAD_AIR_TARGET_SECONDS, type Kpis } from '../lib/metrics'
import { fmtDec, fmtInt, fmtPct } from '../lib/format'

function Sparkline({ values, accent = false }: { values: number[]; accent?: boolean }) {
  const pts = values.filter((v) => Number.isFinite(v))
  if (pts.length < 2) return <div className="h-8" />
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const w = 120
  const h = 32
  const coords = pts.map((v, i) => [(i / (pts.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)])
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const color = accent ? '#FF6B1A' : '#B9B3A8'
  const last = coords[coords.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      {accent && <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="#FFE7D6" opacity="0.7" />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />
    </svg>
  )
}

interface Tile {
  label: string
  value: string
  unit?: string
  caption: string
  spark: number[]
  delta?: number
  deltaSuffix?: string
  inverse?: boolean
  accent?: boolean
}

export function KpiRow({ kpis, previous }: { kpis: Kpis; previous?: Kpis }) {
  const d = (a: number, b?: number, scale = 100) => (b === undefined ? undefined : (a - b) * scale)
  const tiles: Tile[] = [
    {
      label: 'Gestiones',
      value: fmtInt(kpis.total),
      caption: `${fmtPct(kpis.contactRate)} con contacto efectivo`,
      spark: kpis.spark.total,
      delta: previous ? ((kpis.total - previous.total) / (previous.total || 1)) * 100 : undefined,
      deltaSuffix: '%',
    },
    {
      label: 'Probabilidad favorable',
      value: fmtDec(kpis.favorableRate * 100),
      unit: '%',
      caption: `Buena ${fmtPct(kpis.goodRate)} · Regular ${fmtPct(kpis.favorableRate - kpis.goodRate)}`,
      spark: kpis.spark.favorable,
      delta: d(kpis.favorableRate, previous?.favorableRate),
      accent: true,
    },
    {
      label: 'Score de calidad IA',
      value: fmtDec(kpis.avgScore),
      unit: '/100',
      caption: `Desvío ± ${fmtDec(kpis.stdScore)} puntos`,
      spark: kpis.spark.score,
      delta: d(kpis.avgScore, previous?.avgScore, 1),
      deltaSuffix: 'pts',
    },
    {
      label: 'Participación del gestor',
      value: fmtDec(kpis.talkRatio),
      unit: '%',
      caption: 'Del tiempo total de conversación',
      spark: kpis.spark.talk,
      delta: d(kpis.talkRatio, previous?.talkRatio, 1),
      inverse: true,
    },
    {
      label: 'Silencio por gestión',
      value: fmtDec(kpis.deadAir),
      unit: 's',
      caption:
        kpis.deadAir <= DEAD_AIR_TARGET_SECONDS
          ? `Dentro del umbral de ${DEAD_AIR_TARGET_SECONDS} s`
          : `Supera el umbral de ${DEAD_AIR_TARGET_SECONDS} s`,
      spark: kpis.spark.dead,
      delta: d(kpis.deadAir, previous?.deadAir, 1),
      deltaSuffix: 's',
      inverse: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {tiles.map((t, i) => (
        <article
          key={t.label}
          className="card rise flex flex-col p-5 last:col-span-2 md:last:col-span-1"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-ink-2">{t.label}</span>
            {t.delta !== undefined && <Delta value={t.delta} suffix={t.deltaSuffix} inverse={t.inverse} />}
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className={`num text-[40px] leading-none font-medium ${t.accent ? 'text-cid-deep' : 'text-ink'}`}>
              {t.value}
            </span>
            {t.unit && <span className="text-[15px] font-medium text-ink-3">{t.unit}</span>}
          </div>
          <div className="mt-4">
            <Sparkline values={t.spark} accent={t.accent} />
          </div>
          <div className="mt-2 text-[12px] text-ink-2">{t.caption}</div>
        </article>
      ))}
    </div>
  )
}
