/**
 * Vendor dashboard entrypoints (Phase 3 — keep thin for now).
 */
import { requireRole } from '../core/auth.js'
import { supabase } from '../core/supabase.js'

export async function bootVendorHome() {
  const session = await requireRole(['vendor', 'super_admin'])
  if (!session) return

  const { data: row } = await supabase
    .from('vendors')
    .select('id,name,is_online')
    .eq('owner_id', session.user.id)
    .maybeSingle()

  const el = document.getElementById('vendor-summary')
  if (!el) return
  if (!row) {
    el.textContent =
      session.role === 'super_admin'
        ? 'Super admin: open a vendor account to see vendor stats here.'
        : 'No vendor profile yet. Finish onboarding or wait for approval.'
    return
  }
  el.textContent = `${row.name} — ${row.is_online ? 'Online' : 'Offline'}`
}

export async function bootVendorProducts() {
  await requireRole(['vendor', 'super_admin'])
}

export async function bootVendorSettings() {
  await requireRole(['vendor', 'super_admin'])
}
