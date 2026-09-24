import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseFeed } from '../src/lib/normalize.ts'

const input = process.argv[2]
if (!input) {
  console.error('Uso: npm run sample -- <ruta-al-feed.jsonl>')
  process.exit(1)
}

const dataset = parseFeed(readFileSync(input, 'utf8'), 'sample')
const outDir = resolve('public/data')
mkdirSync(outDir, { recursive: true })
writeFileSync(resolve(outDir, 'sample.json'), JSON.stringify(dataset.records))

const tagged = (k: 'reasons' | 'objections' | 'practices') =>
  dataset.records.filter((r) => r[k].length).length
console.log(
  `${dataset.records.length} gestiones del ${dataset.date} (descartadas: ${dataset.skipped}). ` +
    `Con motivo: ${tagged('reasons')}, objeción: ${tagged('objections')}, práctica: ${tagged('practices')}`,
)
