/**
 * Resolve asset URLs for both `file://` opens and real HTTP deployments.
 * Each HTML page should set: <meta name="localhub-root" content="."> or ".." etc.
 */

export function getSiteRootUrl() {
  const meta = document.querySelector('meta[name="localhub-root"]')
  const seg = (meta?.getAttribute('content') ?? '.').trim() || '.'
  const withSlash = seg.replace(/\/?$/, '/') 
  return new URL(withSlash, window.location.href)
}

/** Path from project root, e.g. "partials/nav.html" or "/css/x" */
export function resolveAppPath(pathFromRoot) {
  const clean = String(pathFromRoot).replace(/^\/+/, '')
  return new URL(clean, getSiteRootUrl()).href
}

/** Post-login redirect target from ?next= (supports file:// and hosted). */
export function normalizeNextUrl(raw) {
  if (!raw) return resolveAppPath('index.html')
  if (/^(https?:|file:)/i.test(String(raw))) return String(raw)
  const s = String(raw)
  if (s.startsWith('/')) return resolveAppPath(s.slice(1))
  return resolveAppPath(s)
}

/** Vendor shop link — works without /shop rewrite (static + file://). */
export function vendorPageHref(slug) {
  const enc = encodeURIComponent(slug)
  return resolveAppPath(`vendor.html?slug=${enc}`)
}

/**
 * Turn legacy root-absolute hrefs (/foo) into URLs under the site root.
 * Safe to call on injected partials.
 */
export function rewriteRootedHrefs(root = document) {
  root.querySelectorAll('a[href^="/"]').forEach((a) => {
    const raw = a.getAttribute('href')
    if (!raw || raw.startsWith('//')) return
    const tail = raw.slice(1)
    const base = getSiteRootUrl()
    try {
      a.setAttribute('href', new URL(tail || 'index.html', base).href)
    } catch {
      /* ignore */
    }
  })
}
