/**
 * Auth guards for admin and vendor pages.
 * RLS is the real security; this only steers logged-out users to login.
 */
import { supabase } from './supabase.js'
import { resolveAppPath } from './paths.js'
import { shouldUsePlaceholders } from './config.js'

/**
 * Super-admin pages: in demo/placeholder mode (no real Supabase) skip login
 * so dashboards and monitoring are viewable on static deploy previews.
 */
export async function requireAdminAccess(opts = {}) {
  if (shouldUsePlaceholders()) {
    return { user: null, role: 'super_admin', demo: true }
  }
  return requireRole(['super_admin'], opts)
}

export async function requireRole(allowedRoles, opts = {}) {
  const redirectTo = opts.redirectTo !== undefined ? opts.redirectTo : resolveAppPath('index.html')
  const loginPath = opts.loginPath !== undefined ? opts.loginPath : resolveAppPath('auth/login.html')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    window.location.href = `${loginPath}?next=${next}`
    return null
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile || !allowedRoles.includes(profile.role)) {
    window.location.href = redirectTo
    return null
  }

  return { user, role: profile.role, profile }
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = resolveAppPath('index.html')
}
