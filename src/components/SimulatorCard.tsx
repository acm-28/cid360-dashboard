import { useState } from 'react'
import { Card } from './ui'
import { simulate, type Scenario } from '../lib/metrics'
import type { MacroRecord } from '../lib/types'
import { fmtInt, fmtPct, fmtPts } from '../lib/format'
import { AnimatedNumber } from '../lib/motion'

const LEVERS: { id: keyof Scenario; label: string; max: number; step: number; describe: (r: ReturnType<typeof simulate>['refs']) => string }[] = [
  {
    id: 'nullReduction',
    label: 'Convertir contactos nulos en contacto efectivo',
    max: 0.5,
    step: 0.05,
    describe: (r) => `${fmtInt(r.nulls)} gestiones < 45 s · ${fmtPct(r.nullRate, 0)} vs ${fmtPct(r.effectiveRate, 0)} favorable`,
  },
  {
    id: 'planIncrease',
    label: 'Ampliar la oferta de planes alternativos',
    max: 0.3,
    step: 0.05,
    describe: (r) => `${fmtPct(r.planRate, 0)} favorable con plan vs ${fmtPct(r.noPlanRate, 0)} sin plan`,
  },
  {
    id: 'shiftToMorning',
    label: 'Reasignar volumen de la tarde a la mañana',
    max: 0.5,
    step: 0.05,
    describe: (r) => `${fmtInt(r.afternoon)} gestiones por la tarde · ${fmtPct(r.afternoonRate, 0)} vs ${fmtPct(r.morningRate, 0)} mañana`,
  },
]

export function SimulatorCard({ records }: { records: MacroRecord[] }) {
  const [scenario, setScenario] = useState<Scenario>({ nullReduction: 0.2, planIncrease: 0.1, shiftToMorning: 0.15 })
  const sim = simulate(records, scenario)
  const delta = sim.projectedRate - sim.baseRate

  return (
    <Card
      eyebrow="Escenarios"
      title="Simulador de impacto"
      subtitle="Estimación de primer orden: cada palanca traslada volumen entre segmentos a las tasas observadas en el día. Los efectos se suman."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-7">
          {LEVERS.map((l) => {
            const value = scenario[l.id]
            const gain = sim.levers.find((x) => x.id === l.id)!.gain
            return (
              <div key={l.id} className="stagger-item" style={{ ['--i' as string]: LEVERS.indexOf(l) }}>
                <div className="mb-2.5 flex items-baseline justify-between gap-4">
                  <label htmlFor={l.id} className="text-[13.5px] font-medium text-ink">
                    {l.label}
                  </label>
                  <span className="num text-[15px] font-semibold text-ink">{fmtPct(value, 0)}</span>
                </div>
                <input
                  id={l.id}
                  type="range"
                  className="slider"
                  min={0}
                  max={l.max}
                  step={l.step}
                  value={value}
                  style={{ ['--fill' as string]: `${(value / l.max) * 100}%` }}
                  onChange={(e) => setScenario((s) => ({ ...s, [l.id]: Number(e.target.value) }))}
                />
                <div className="mt-2 flex justify-between gap-4 text-[12px]">
                  <span className="num text-ink-3">{l.describe(sim.refs)}</span>
                  <span className={`num whitespace-nowrap font-medium ${gain >= 0 ? 'text-ink-2' : 'text-negative'}`}>
                    {gain >= 0 ? '+' : '−'}
                    {fmtInt(Math.abs(gain))} gestiones
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col justify-between rounded-[20px] bg-ivory p-6">
          <div>
            <div className="text-[12.5px] font-medium text-ink-2">Probabilidad favorable proyectada</div>
            <div className="mt-2 flex items-baseline gap-3">
              <AnimatedNumber
                value={sim.projectedRate}
                format={(v) => fmtPct(v, 1)}
                duration={600}
                className="num text-[52px] leading-none font-medium tracking-[-0.03em] text-ink"
              />
              <AnimatedNumber
                value={delta}
                format={fmtPts}
                duration={600}
                className={`num text-[14px] font-semibold transition-colors duration-300 ${delta >= 0 ? 'text-cid-deep' : 'text-negative'}`}
              />
            </div>
            <div className="relative mt-6 h-2 rounded-full bg-ivory-sunken">
              <div className="grow-x absolute inset-y-0 left-0 rounded-full" style={{ width: `${sim.baseRate * 100}%`, background: '#AEB3AE' }} />
              <div
                className="absolute inset-y-0 rounded-r-full bg-cid transition-[width] duration-500 ease-apple"
                style={{ left: `${sim.baseRate * 100}%`, width: `${Math.max(0, delta) * 100}%` }}
              />
            </div>
            <div className="num mt-2 flex justify-between text-[11.5px] text-ink-3">
              <span>Actual {fmtPct(sim.baseRate, 1)}</span>
              <span>100%</span>
            </div>
          </div>
          <div className="mt-6 border-t border-hairline pt-4">
            <AnimatedNumber
              value={sim.extra}
              format={(v) => `${v >= 0 ? '+' : '−'}${fmtInt(Math.abs(v))}`}
              duration={600}
              className="num block text-[28px] font-semibold text-ink"
            />
            <div className="text-[12.5px] text-ink-2">gestiones adicionales con probabilidad de pago favorable</div>
          </div>
        </div>
      </div>
    </Card>
  )
}
