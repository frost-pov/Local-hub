/**
 * auth/login.html
 */
import { supabase } from '../core/supabase.js'
import { normalizeNextUrl } from '../core/paths.js'
import { loadInto } from '../ui/components.js'

export async function bootLogin() {
  const params = new URLSearchParams(location.search)
  const nextHref = normalizeNextUrl(params.get('next') || '')

  const errEl = document.getElementById('login-err')

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (errEl) errEl.textContent = ''
    const email = document.getElementById('email')?.value?.trim()
    const password = document.getElementById('password')?.value || ''

    const { data: signData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      if (errEl) errEl.textContent = error.message
      return
    }

    // Do not call getUser() here: it re-validates over the network and can throw
    // / fail on transient errors even when sign-in already returned a session.
    if (signData?.session) {
      window.location.replace(nextHref)
      return
    }

    const { data: sess } = await supabase.auth.getSession()
    if (sess?.session) {
      window.location.replace(nextHref)
      return
    }

    if (errEl) {
      errEl.textContent =
        'Signed in but no session was stored. Allow cookies / site data for this site and try again.'
    }
  })

  await loadInto('#nav-slot', '/partials/nav.html')
  await loadInto('#footer-slot', '/partials/footer.html')
}
