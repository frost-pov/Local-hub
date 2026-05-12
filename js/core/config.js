/**
 * Frontend config for static HTML (no Vite).
 *
 * Set real values in ONE place before other modules load:
 *   window.__LOCALHUB = { supabaseUrl, supabaseAnonKey }
 * Optional backwards-compatible alias: window.__SOKO = window.__LOCALHUB (same object; prefer __LOCALHUB in new code).
 *
 * Never put the service-role key here — only the anon (public) key.
 */

/** True only when anon client values look production-ready */
export function isSupabaseConfigured() {
  const c = appConfig()
  const url = String(c.supabaseUrl || '').trim()
  const key = String(c.supabaseAnonKey || '').trim()
  if (!url || !key) return false
  if (url.includes('YOUR_PROJECT')) return false
  if (key.includes('YOUR_SUPABASE')) return false
  const jwtParts = key.split('.')
  const looksJwt =
    jwtParts.length === 3 &&
    jwtParts[0].startsWith('eyJ') &&
    jwtParts.every((p) => p.length >= 20)
  const host = url.replace(/^https?:\/\//i, '').split('/')[0] || ''
  const looksSupabaseHost = /\.supabase\.co$/i.test(host)
  return looksJwt && looksSupabaseHost
}

function appConfig() {
  const a = window.__LOCALHUB
  const b = window.__SOKO
  if (a && b && a !== b) Object.assign(a, b)
  return a || b || {}
}

export function getSupabaseConfig() {
  const c = appConfig()
  return {
    url: c.supabaseUrl || 'https://YOUR_PROJECT.supabase.co',
    anonKey: c.supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY',
  }
}

/**
 * When true, loads `js/data/placeholders.js` (~26 demo shops, ~106 products).
 * Automatically false once `isSupabaseConfigured()` passes.
 * Opt back into demo visuals with data by setting `forceDemo: true`.
 */
export function shouldUsePlaceholders() {
  const c = appConfig()
  if (c.forceDemo === true) return true
  if (isSupabaseConfigured()) return false
  return true
}
