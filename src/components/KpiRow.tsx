import { useState } from 'react'
import { Delta } from './ui'
import { DEAD_AIR_TARGET_SECONDS, type Kpis } from '../lib/metrics'
import { fmtDec, fmtInt, fmtPct, hourLabel } from '../lib/format'
import { AnimatedNumber, RevealContext, spotlight, useReveal } from '../lib/motion'

const W = 120
const H = 32

function Sparkline({
  values,
  hours,
  format,
  accent = false,
}: {
  values: number[]
  hours: number[]
  format: (v: number) => string
  accent?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  if (values.length < 2) return <div className="h-8" />

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const coords = values.map((v, i) => [(i / (values.length - 1)) * W, H - 3 - ((v - min) / span) * (H - 6)])
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const color = accent ? '#FF6B1A' : '#AEB3AE'
  const last = coords[coords.length - 1]
  const point = hover === null ? null : coords[hover]

  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        const i = Math.round(((e.clientX - r.left) / r.width) * (values.length - 1))
        setHover(Math.max(0, Math.min(values.length - 1, i)))
      }}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
        {accent && <path className="spark-area" d={`${line} L${W} ${H} L0 ${H} Z`} fill="#FFE7D6" />}
        <path
          key={line}
          className="spark-line"
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {point && (
          <line x1={point[0]} x2={point[0]} y1={0} y2={H} stroke="#171817" strokeOpacity="0.14" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {/* Dots live in HTML so they stay round despite the stretched SVG. */}
      {!point && (
        <span
          className="spark-dot absolute size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%`, background: color }}
        />
      )}
      {point && hover !== null && (
        <>
          <span
            className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-white transition-[left,top] duration-150 ease-apple"
            style={{ left: `${(point[0] / W) * 100}%`, top: `${(point[1] / H) * 100}%`, borderColor: color }}
          />
          <span
            className="pop-in num pointer-events-none absolute -top-6 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[10.5px] whitespace-nowrap text-ivory transition-[left] duration-150 ease-apple"
            style={{ left: `${Math.min(88, Math.max(12, (point[0] / W) * 100))}%` }}
          >
            {hourLabel(hours[hover])} · {format(values[hover])}
          </span>
        </>
      )}
    </div>
  )
}

interface TileData {
  label: string
  value: number
  format: (v: number) => string
  unit?: string
  caption: string
  spark: number[]
  sparkFormat: (v: number) => string
  delta?: number
  deltaSuffix?: string
  inverse?: boolean
  accent?: boolean
}

function Tile({ t, hours }: { t: TileData; hours: number[] }) {
  const [ref, visible] = useReveal<HTMLElement>()
  return (
    <RevealContext.Provider value={visible}>
      <article
        ref={ref}
        data-reveal={visible ? 'in' : 'pending'}
        onPointerMove={spotlight}
        className="card flex flex-col p-5 last:col-span-2 md:last:col-span-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-medium text-ink-2">{t.label}</span>
          {t.delta !== undefined && <Delta value={t.delta} suffix={t.deltaSuffix} inverse={t.inverse} />}
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <AnimatedNumber
            value={t.value}
            format={t.format}
            className={`num text-[40px] leading-none font-medium ${t.accent ? 'text-cid-deep' : 'text-ink'}`}
          />
          {t.unit && <span className="text-[15px] font-medium text-ink-3">{t.unit}</span>}
        </div>
        <div className="mt-4">
          <Sparkline values={t.spark} hours={hours} format={t.sparkFormat} accent={t.accent} />
        </div>
        <div className="mt-2 text-[12px] text-ink-2">{t.caption}</div>
      </article>
    </RevealContext.Provider>
  )
}

export function KpiRow({ kpis, previous }: { kpis: Kpis; previous?: Kpis }) {
  const d = (a: number, b?: number, scale = 100) => (b === undefined ? undefined : (a - b) * scale)
  const pct = (v: number) => fmtPct(v, 0)
  const tiles: TileData[] = [
    {
      label: 'Gestiones',
      value: kpis.total,
      format: fmtInt,
      caption: `${fmtPct(kpis.contactRate)} con contacto efectivo`,
      spark: kpis.spark.total,
      sparkFormat: (v) => `${fmtInt(v)} gestiones`,
      delta: previous ? ((kpis.total - previous.total) / (previous.total || 1)) * 100 : undefined,
      deltaSuffix: '%',
    },
    {
      label: 'Probabilidad favorable',
      value: kpis.favorableRate * 100,
      format: fmtDec,
      unit: '%',
      caption: `Buena ${fmtPct(kpis.goodRate)} · Regular ${fmtPct(kpis.favorableRate - kpis.goodRate)}`,
      spark: kpis.spark.favorable,
      sparkFormat: pct,
      delta: d(kpis.favorableRate, previous?.favorableRate),
      accent: true,
    },
    {
      label: 'Score de calidad IA',
      value: kpis.avgScore,
      format: fmtDec,
      unit: '/100',
      caption: `Desvío ± ${fmtDec(kpis.stdScore)} puntos`,
      spark: kpis.spark.score,
      sparkFormat: fmtDec,
      delta: d(kpis.avgScore, previous?.avgScore, 1),
      deltaSuffix: 'pts',
    },
    {
      label: 'Participación del gestor',
      value: kpis.talkRatio,
      format: fmtDec,
      unit: '%',
      caption: 'Del tiempo total de conversación',
      spark: kpis.spark.talk,
      sparkFormat: (v) => `${fmtDec(v)}%`,
      delta: d(kpis.talkRatio, previous?.talkRatio, 1),
      inverse: true,
    },
    {
      label: 'Silencio por gestión',
      value: kpis.deadAir,
      format: fmtDec,
      unit: 's',
      caption:
        kpis.deadAir <= DEAD_AIR_TARGET_SECONDS
          ? `Dentro del umbral de ${DEAD_AIR_TARGET_SECONDS} s`
          : `Supera el umbral de ${DEAD_AIR_TARGET_SECONDS} s`,
      spark: kpis.spark.dead,
      sparkFormat: (v) => `${fmtDec(v)} s`,
      delta: d(kpis.deadAir, previous?.deadAir, 1),
      deltaSuffix: 's',
      inverse: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {tiles.map((t) => (
        <Tile key={t.label} t={t} hours={kpis.sparkHours} />
      ))}
    </div>
  )
}
