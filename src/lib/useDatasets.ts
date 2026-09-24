import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dataset, MacroRecord } from './types'
import { parseFeed } from './normalize'

export type Status = { kind: 'loading' } | { kind: 'ready' } | { kind: 'error'; message: string }

export function useDatasets() {
  const [datasets, setDatasets] = useState<Record<string, Dataset>>({})
  const [active, setActive] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'loading' })
  const [notice, setNotice] = useState<string | null>(null)

  const add = useCallback((ds: Dataset) => {
    setDatasets((prev) => ({ ...prev, [ds.date]: ds }))
    setActive(ds.date)
  }, [])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/sample.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar el dataset de ejemplo (${r.status}).`)
        return r.json() as Promise<MacroRecord[]>
      })
      .then((records) => {
        add({ date: records[0]?.date ?? '', source: 'Dataset de ejemplo', records, skipped: 0 })
        setStatus({ kind: 'ready' })
      })
      .catch((e: Error) => setStatus({ kind: 'error', message: e.message }))
  }, [add])

  const loadFiles = useCallback(
    async (files: FileList | File[]) => {
      setStatus({ kind: 'loading' })
      const messages: string[] = []
      for (const file of Array.from(files)) {
        try {
          const ds = parseFeed(await file.text(), file.name)
          add(ds)
          messages.push(
            `${file.name}: ${ds.records.length.toLocaleString('es-AR')} gestiones anonimizadas` +
              (ds.skipped ? ` (${ds.skipped} filas descartadas)` : ''),
          )
        } catch (e) {
          messages.push(`${file.name}: ${(e as Error).message}`)
        }
      }
      setNotice(messages.join(' · '))
      setStatus({ kind: 'ready' })
    },
    [add],
  )

  const dates = useMemo(() => Object.keys(datasets).sort(), [datasets])
  const current = active ? datasets[active] : undefined
  const previous = active ? datasets[dates[dates.indexOf(active) - 1]] : undefined

  return { dates, current, previous, setActive, loadFiles, status, notice, clearNotice: () => setNotice(null) }
}
