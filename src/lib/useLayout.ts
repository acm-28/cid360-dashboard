import { useEffect, useState } from 'react'

export const MODULES = [
  { id: 'funnel', label: 'Embudo de conversión' },
  { id: 'hourly', label: 'Ventana horaria' },
  { id: 'duration', label: 'Duración y resultado' },
  { id: 'dynamics', label: 'Dinámica conversacional' },
  { id: 'compliance', label: 'Cumplimiento y auditoría IA' },
  { id: 'plans', label: 'Planes alternativos' },
  { id: 'sentiment', label: 'Sentimiento del cliente' },
  { id: 'insights', label: 'Motivos, objeciones y prácticas' },
  { id: 'simulator', label: 'Simulador de escenarios' },
] as const

export type ModuleId = (typeof MODULES)[number]['id']
interface LayoutState {
  order: ModuleId[]
  hidden: ModuleId[]
}

const KEY = 'cid360.layout.v1'
const DEFAULT: LayoutState = { order: MODULES.map((m) => m.id), hidden: [] }

function load(): LayoutState {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as LayoutState | null
    if (!saved) return DEFAULT
    const known = new Set<ModuleId>(DEFAULT.order)
    const order = saved.order.filter((id) => known.has(id))
    DEFAULT.order.forEach((id) => !order.includes(id) && order.push(id))
    return { order, hidden: saved.hidden.filter((id) => known.has(id)) }
  } catch {
    return DEFAULT
  }
}

export function useLayout() {
  const [state, setState] = useState<LayoutState>(load)
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(state)), [state])

  return {
    order: state.order,
    hidden: state.hidden,
    toggle: (id: ModuleId) =>
      setState((s) => ({ ...s, hidden: s.hidden.includes(id) ? s.hidden.filter((h) => h !== id) : [...s.hidden, id] })),
    move: (id: ModuleId, dir: -1 | 1) =>
      setState((s) => {
        const i = s.order.indexOf(id)
        const j = i + dir
        if (j < 0 || j >= s.order.length) return s
        const order = [...s.order]
        ;[order[i], order[j]] = [order[j], order[i]]
        return { ...s, order }
      }),
    reset: () => setState(DEFAULT),
  }
}
