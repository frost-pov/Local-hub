/**
 * auth/login.html
 */
import { supabase } from '../core/supabase.js'
import { normalizeNextUrl } from '../core/paths.js'
import { loadInto } from '../ui/components.js'

export async function bootLogin() {
  await loadInto('#nav-slot', '/partials/nav.html')
  await loadInto('#footer-slot', '/partials/footer.html')

  const next = normalizeNextUrl(new URLSearchParams(location.search).get('next') || '')

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email')?.value?.trim()
    const password = document.getElementById('password')?.value || ''
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      document.getElementById('login-err').textContent = error.message
      return
    }
    window.location.href = next
  })
}
