/**
 * Auth guards for admin and vendor pages.
 * RLS + GRANTs decide what works; guards steer UX before RLS denies rows.
 */
import { supabase } from './supabase.js'
import { resolveAppPath, loginPageHref } from './paths.js'
import { shouldUsePlaceholders } from './config.js'

/**
 * One fast read of profiles; optional single retry after getSession refresh (post-login races).
 *
 * IMPORTANT: `{ data: null, error: null }` means “no row / RLS hides it” forever for that JWT —
 * retrying backoff like a transient glitch burned ~5s and felt like “the app hangs then kicks home”.
 *
 * @returns {{ role: string } | { apiError: { code?: string; message?: string } } | null}
 */
async function fetchProfileRole(userId) {
  const runOnce = async () =>
    supabase.from('profiles').select('role').eq('id', userId).maybeSingle()

  await supabase.auth.getSession()
  let { data, error } = await runOnce()

  if (!error) {
    if (data?.role) return { role: data.role }
    return null
  }

  console.warn('[Local Hub] profiles select:', error.code, error.message)

  await new Promise((r) => setTimeout(r, 120))
  await supabase.auth.getSession()
  ;({ data, error } = await runOnce())

  if (!error) {
    if (data?.role) return { role: data.role }
    return null
  }

  console.warn('[Local Hub] profiles select retry:', error.code, error.message)
  return {
    apiError: { code: error.code, message: error.message },
  }
}

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

  const result = await fetchProfileRole(user.id)

  if (result && 'apiError' in result) {
    try {
      sessionStorage.setItem(
        'lh_gate_reject',
        JSON.stringify({
          kind: 'profiles_api_error',
          detail: `${result.apiError.code || 'error'} · ${result.apiError.message}`,
        })
      )
    } catch {
      /* noop */
    }
    window.location.href = redirectTo
    return null
  }

  const profile = result
  const ok =
    profile?.role &&
    typeof profile.role === 'string' &&
    allowedRoles.includes(profile.role)

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
          user_hint: `${String(user.id).slice(0, 8)}…`,
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
