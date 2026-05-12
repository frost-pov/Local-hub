/** Patch supabaseUrl placeholder in HTML + js/core/config.js. Run: node scripts/patch-supabase-url.mjs */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || '.')

const extra = [path.join(root, 'js', 'core', 'config.js')]

function walkHtml(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'blueprints') continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkHtml(p, acc)
    else if (p.endsWith('.html')) acc.push(p)
  }
  return acc
}

const from = 'https://YOUR_PROJECT.supabase.co'
const to = 'https://rbqidaiyxooxdaresxjj.supabase.co'

const files = [...walkHtml(root), ...extra.filter((f) => fs.existsSync(f))]

let count = 0
for (const file of files) {
  const s = fs.readFileSync(file, 'utf8')
  if (!s.includes(from)) continue
  fs.writeFileSync(file, s.split(from).join(to), 'utf8')
  count++
  console.log(file)
}
console.log('Updated', count, 'files')
