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

/** Post-login / callback redirect — same-origin only for absolute URLs. */
export function normalizeNextUrl(raw) {
  const fallback = resolveAppPath('index.html')
  if (raw == null || String(raw).trim() === '') return fallback

  let s = String(raw).trim()
  try {
    s = decodeURIComponent(s)
  } catch {
    /* keep */
  }
  if (!s) return fallback

  const proto = typeof window !== 'undefined' ? window.location.protocol : ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  if (/^(https?:|file:)/i.test(s)) {
    try {
      const u = new URL(s)
      if (u.protocol === 'file:') return s
      if (!origin || (proto !== 'http:' && proto !== 'https:')) return s
      if (u.origin !== origin) return `${origin}/`
      return `${origin}${u.pathname}${u.search}${u.hash}`
    } catch {
      return fallback
    }
  }

  const pathOnly = s.startsWith('/') ? s : `/${s}`
  if (proto === 'http:' || proto === 'https:') {
    try {
      return new URL(pathOnly, origin).href
    } catch {
      /* fallthrough */
    }
  }
  return resolveAppPath(pathOnly.replace(/^\/+/, '') || 'index.html')
}

/** Browser login URL (`/login` on Vercel; `auth/login.html` under file://). */
export function loginPageHref() {
  try {
    const { protocol, origin } = window.location
    if (protocol === 'http:' || protocol === 'https:')
      return new URL('/login', origin).href
  } catch {
    /* noop */
  }
  return resolveAppPath('auth/login.html')
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
