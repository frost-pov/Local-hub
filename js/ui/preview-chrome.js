/**
 * Preview catalog strip — shown when Supabase is not configured (see config.js).
 */
import { shouldUsePlaceholders } from '../core/config.js'

export function injectPreviewChrome() {
  if (!shouldUsePlaceholders()) return
  if (document.querySelector('.demo-bar')) return
  document.body.classList.add('local-hub--preview')
  const bar = document.createElement('div')
  bar.className = 'demo-bar'
  bar.innerHTML = `
    <strong>Demo mode</strong><span aria-hidden="true">·</span>
    <span>26 sample vendors — scroll to <em>Shops on Local Hub</em>. Paste your Supabase <span class="mono">Project URL</span> +
    <span class="mono">anon</span> key into each page’s <code class="mono">window.__LOCALHUB</code> block to load your catalog.
    See <span class="mono">SUPABASE_VERCEL_SETUP.md</span>.</span>`
  document.body.insertBefore(bar, document.body.firstChild)
}
