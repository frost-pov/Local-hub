/**
 * Auth guards for admin and vendor pages.
 * RLS is the real security; this only steers logged-out users to login.
 */
import { supabase } from './supabase.js'
import { resolveAppPath, loginPageHref } from './paths.js'
import { shouldUsePlaceholders } from './config.js'

const PROFILE_FETCH_DELAYS_MS = [0, 80, 160, 320, 500, 700]

async function fetchProfileRole(userId) {
  for (const ms of PROFILE_FETCH_DELAYS_MS) {
    if (ms) await new Promise((r) => setTimeout(r, ms))
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error) continue
    if (data?.role) return data
  }
  return null
}

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
  const redirectTo =
    opts.redirectTo !== undefined ? opts.redirectTo : resolveAppPath('index.html')
  const loginPath =
    opts.loginPath !== undefined ? opts.loginPath : loginPageHref()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    const nextRaw = `${location.pathname}${location.search}`
    const sep = loginPath.includes('?') ? '&' : '?'
    window.location.href = `${loginPath}${sep}next=${encodeURIComponent(nextRaw)}`
    return null
  }

  const profile = await fetchProfileRole(user.id)
  const ok =
    profile && profile.role && allowedRoles.includes(profile.role)

  if (!ok) {
    try {
      const kind =
        profile?.role && !allowedRoles.includes(profile.role)
          ? 'wrong_role'
          : 'no_profile'
      sessionStorage.setItem(
        'lh_gate_reject',
        JSON.stringify({
          kind,
          allowed: [...allowedRoles],
          got_role: profile?.role ?? null,
        })
      )
    } catch {
      /* noop */
    }
    window.location.href = redirectTo
    return null
  }

  return { user, role: profile.role, profile }
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = resolveAppPath('index.html')
}
