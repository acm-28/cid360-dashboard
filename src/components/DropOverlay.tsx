import { useEffect, useState } from 'react'
import { Isotype } from './Logo'

/** Full-window drop target that appears only while a file is dragged over the page. */
export function DropOverlay({ onFiles }: { onFiles: (f: FileList) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let depth = 0
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files')
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth++
      setVisible(true)
    }
    const leave = () => {
      depth = Math.max(0, depth - 1)
      if (!depth) setVisible(false)
    }
    const over = (e: DragEvent) => hasFiles(e) && e.preventDefault()
    const drop = (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setVisible(false)
      if (e.dataTransfer?.files.length) onFiles(e.dataTransfer.files)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
    }
  }, [onFiles])

  if (!visible) return null
  return (
    <div className="veil-in fixed inset-0 z-50 grid place-items-center bg-ivory/85 backdrop-blur-md">
      <div className="toast-in flex flex-col items-center mx-4 rounded-[28px] border-[1.5px] border-dashed border-cid/60 bg-ivory-raised px-8 py-10 text-center shadow-lift sm:px-16 sm:py-12">
        <Isotype gradient live className="mb-5 h-14 w-auto" />
        <div className="text-[20px] font-semibold tracking-[-0.015em]">Soltá el feed diario</div>
        <p className="mt-1.5 max-w-[34ch] text-[13px] text-ink-2">
          Archivos .jsonl crudos o .json anonimizados. Los identificadores, nombres y transcripciones se descartan en tu
          navegador antes de procesar.
        </p>
      </div>
    </div>
  )
}
