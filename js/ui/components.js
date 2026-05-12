/**
 * Tiny HTML partial loader: keeps nav/footer in one place.
 */
import { resolveAppPath, rewriteRootedHrefs } from '../core/paths.js'

export async function loadInto(selector, pathFromRoot) {
  const host = document.querySelector(selector)
  if (!host) return
  const clean = String(pathFromRoot).replace(/^\/+/, '')
  const res = await fetch(resolveAppPath(clean))
  if (!res.ok) {
    host.innerHTML = '<!-- component failed: ' + clean + ' -->'
    return
  }
  host.innerHTML = await res.text()
  rewriteRootedHrefs(host)
}
