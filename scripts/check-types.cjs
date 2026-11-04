const { execSync } = require('child_process')
const path = require('path')
const root = path.resolve(__dirname, '..')
try {
  const out = execSync('node --max-old-space-size=4096 node_modules/typescript/bin/tsc --noEmit 2>&1', { cwd: root, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  console.log('No errors!')
  console.log(out.substring(0, 500))
} catch (e) {
  const output = (e.stdout || '') + (e.stderr || '')
  const lines = output.split('\n').filter(l => l.includes('error TS'))
  console.log(`Total errors: ${lines.length}`)
  if (lines.length === 0) {
    console.log('Raw output (first 1000 chars):')
    console.log(output.substring(0, 1000))
    return
  }
  // Group by file
  const files = new Map()
  lines.forEach(l => {
    const match = l.match(/^(.+?)\(\d+,\d+\)/)
    if (match) files.set(match[1], (files.get(match[1]) || 0) + 1)
  })
  console.log(`\nFiles with errors: ${files.size}`)
  const sorted = [...files.entries()].sort((a,b) => b[1] - a[1])
  sorted.slice(0, 20).forEach(([f, c]) => console.log(`  ${c} errors: ${f}`))
  console.log('\nFirst 10 errors:')
  lines.slice(0, 10).forEach(l => console.log('  ' + l.substring(0, 200)))
}
