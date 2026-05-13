/**
 * Vendor dashboard — owner shop tools (Phase 3, client-side).
 */
import { requireRole } from '../core/auth.js'
import { supabase } from '../core/supabase.js'
import { shouldUsePlaceholders } from '../core/config.js'
import { showToast } from '../core/utils.js'
import { vendorPageHref } from '../core/paths.js'

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatCents(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  const k = Math.round(Number(n)) / 100
  return `${k.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} KES`
}

async function getOwnedVendor(userId) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function bootVendorHome() {
  const session = await requireRole(['vendor', 'super_admin'])
  if (!session) return

  const el = document.getElementById('vendor-summary')
  if (!el) return

  if (shouldUsePlaceholders()) {
    el.innerHTML =
      '<span class="text-secondary">Configure Supabase in <code class="mono">window.__LOCALHUB</code> (or vendor pages <code class="mono">window.__SOKO</code>) — preview catalog does not expose your storefront row.</span>'
    return
  }

  const row = await getOwnedVendor(session.user.id)
  if (!row) {
    el.innerHTML =
      session.role === 'super_admin'
        ? 'Super admin: this login has no vendor <code class="mono">owner_id</code>. Use your seller account.'
        : 'No vendor profile yet. Finish onboarding or wait for admin approval after applying.'
    return
  }

  const shopHref = vendorPageHref(row.slug)
  el.innerHTML = `
    <p class="mb-2"><strong>${escapeHtml(row.name)}</strong> · ${row.is_online ? '<span style="color:var(--accent)">Published as online</span>' : '<span class="text-secondary">Shop offline badge</span>'} · slug <code class="mono">${escapeHtml(row.slug)}</code></p>
    <p class="text-secondary mb-0"><a href="${escapeHtml(shopHref)}">View public shop →</a> · <a href="vendor-admin/products.html">Products</a> · <a href="vendor-admin/settings.html">Store settings</a></p>`
}

export async function bootVendorProducts() {
  const session = await requireRole(['vendor', 'super_admin'])
  if (!session) return

  const slot = document.getElementById('vendor-products-slot')
  if (!slot) return

  if (shouldUsePlaceholders()) {
    slot.innerHTML =
      '<p class="text-secondary mb-0">Wire production keys to edit real listings. Demo listings live in the bundled marketplace preview only.</p>'
    return
  }

  const vendor = await getOwnedVendor(session.user.id)
  if (!vendor) {
    slot.innerHTML =
      '<p class="text-secondary mb-0">No vendor row linked to your account yet.</p>'
    return
  }

  async function reload() {
    slot.innerHTML = '<p class="text-secondary mb-0">Loading…</p>'
    const { data, error } = await supabase
      .from('products')
      .select(
        'id, title, slug, price, inventory, is_available, is_featured, updated_at'
      )
      .eq('vendor_id', vendor.id)
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) {
      slot.innerHTML = `<p class="text-secondary">${escapeHtml(error.message)}</p>`
      return
    }

    const rows =
      data?.length ?
        data
          .map(
            (p) => `
          <tr data-product-id="${escapeHtml(p.id)}">
            <td>${escapeHtml(p.title)}</td>
            <td class="mono text-sm">${escapeHtml(p.slug)}</td>
            <td>${formatCents(p.price)}</td>
            <td>${escapeHtml(String(p.inventory ?? '—'))}</td>
            <td>
              <button type="button" class="btn btn-ghost btn-sm" data-toggle-avail="${
                p.id
              }">${p.is_available ? 'Listed' : 'Hidden'}</button>
            </td>
          </tr>`
          )
          .join('')
      : ''

    slot.innerHTML = `
      <div class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>Title</th><th>Slug</th><th>Price</th><th>Stock</th><th>Listed</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5" class="text-secondary">No listings yet — add below.</td></tr>`}</tbody>
        </table>
      </div>

      <div class="card card-body mt-3">
        <p class="eyebrow">Add listing</p>
        <p class="text-secondary text-sm">Prices are stored in cents (example: Ksh&nbsp;250 = <code class="mono">25000</code>).</p>
        <div class="grid" style="gap:0.75rem;margin-top:0.75rem">
          <div>
            <label class="text-sm text-secondary mb-1" for="vp_title">Title</label>
            <input class="input" id="vp_title" autocomplete="off" />
          </div>
          <div>
            <label class="text-sm text-secondary mb-1" for="vp_slug">Slug (unique for your shop)</label>
            <input class="input mono" id="vp_slug" autocomplete="off" />
          </div>
          <div>
            <label class="text-sm text-secondary mb-1" for="vp_price">Price (cents)</label>
            <input class="input mono" id="vp_price" type="number" min="1" step="1" />
          </div>
          <div style="grid-column:1/-1">
            <label class="text-sm text-secondary mb-1" for="vp_desc">Description</label>
            <textarea class="input" id="vp_desc" rows="2"></textarea>
          </div>
          <div>
            <button type="button" class="btn btn-primary btn-sm" id="vp_add_btn">Insert product</button>
          </div>
        </div>
      </div>`

    slot.querySelectorAll('[data-toggle-avail]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-toggle-avail')
        if (!id) return
        const row = data?.find((r) => r.id === id)
        if (!row) return
        const next = !row.is_available
        btn.disabled = true
        const { error: upErr } = await supabase
          .from('products')
          .update({
            is_available: next,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('vendor_id', vendor.id)
        btn.disabled = false
        if (upErr) {
          showToast(upErr.message)
          return
        }
        showToast(next ? 'Now listed' : 'Hidden')
        reload()
      })
    })

    document.getElementById('vp_add_btn')?.addEventListener(
      'click',
      async () => {
        const title = document.getElementById('vp_title')?.value?.trim()
        const slug = document.getElementById('vp_slug')?.value?.trim()
        const priceRaw = document.getElementById('vp_price')?.value
        const description =
          document.getElementById('vp_desc')?.value?.trim() || null
        const price = Number(priceRaw)

        if (!title || !slug || !priceRaw || Number.isNaN(price) || price < 1) {
          showToast('Title, slug, and positive price required')
          return
        }

        const ins = await supabase
          .from('products')
          .insert({
            vendor_id: vendor.id,
            title,
            slug,
            price,
            description,
            category: vendor.category || null,
            inventory: 0,
            images: [],
            is_available: true,
            is_featured: false,
          })
          .select('id')
          .single()

        if (ins.error) {
          showToast(ins.error.message || String(ins.error.code))
          return
        }
        showToast('Listing created')
        document.getElementById('vp_title').value = ''
        document.getElementById('vp_slug').value = ''
        document.getElementById('vp_price').value = ''
        document.getElementById('vp_desc').value = ''
        reload()
      }
    )
  }

  await reload()
}

export async function bootVendorSettings() {
  const session = await requireRole(['vendor', 'super_admin'])
  if (!session) return

  const slot = document.getElementById('vendor-settings-slot')
  if (!slot) return

  if (shouldUsePlaceholders()) {
    slot.innerHTML =
      '<p class="text-secondary mb-0">Production keys needed to persist store settings.</p>'
    return
  }

  const vendor = await getOwnedVendor(session.user.id)
  if (!vendor) {
    slot.innerHTML =
      '<p class="text-secondary mb-0">No vendor linked to your account.</p>'
    return
  }

  const hoursStr =
    vendor.hours && typeof vendor.hours === 'object'
      ? JSON.stringify(vendor.hours, null, 2)
      : '{}'

  slot.innerHTML = `
    <div class="card card-body">
      <p class="eyebrow">${escapeHtml(vendor.name)}</p>
      <div class="grid" style="gap:0.85rem;margin-top:0.75rem">
        <div>
          <label class="text-sm text-secondary mb-1" for="vs_name">Shop name</label>
          <input class="input" id="vs_name" value="${escapeHtml(vendor.name || '')}" />
        </div>
        <div>
          <label class="text-sm text-secondary mb-1" for="vs_tagline">Tagline</label>
          <input class="input" id="vs_tagline" value="${escapeHtml(vendor.tagline || '')}" />
        </div>
        <div style="grid-column:1/-1">
          <label class="text-sm text-secondary mb-1" for="vs_desc">Description</label>
          <textarea class="input" id="vs_desc" rows="3">${escapeHtml(vendor.description || '')}</textarea>
        </div>
        <div style="grid-column:1/-1">
          <label class="text-sm text-secondary mb-1" for="vs_story">Story</label>
          <textarea class="input" id="vs_story" rows="2">${escapeHtml(vendor.story || '')}</textarea>
        </div>
        <div>
          <label class="text-sm text-secondary mb-1" for="vs_whatsapp">WhatsApp</label>
          <input class="input" id="vs_whatsapp" value="${escapeHtml(vendor.whatsapp || '')}" />
        </div>
        <div>
          <label class="text-sm text-secondary mb-1" for="vs_payout">Payout phone</label>
          <input class="input" id="vs_payout" value="${escapeHtml(vendor.payout_phone || '')}" />
        </div>
        <div>
          <label class="text-sm text-secondary mb-1" for="vs_area">Area</label>
          <input class="input" id="vs_area" value="${escapeHtml(vendor.area || '')}" />
        </div>
        <div>
          <label class="text-sm text-secondary mb-1" for="vs_website">Website URL</label>
          <input class="input" id="vs_website" type="url" value="${escapeHtml(vendor.website_url || '')}" />
        </div>
        <div style="grid-column:1/-1">
          <label class="text-sm text-secondary mb-1" for="vs_hours">Hours (JSON object)</label>
          <textarea class="input mono text-sm" id="vs_hours" rows="4">${escapeHtml(hoursStr)}</textarea>
        </div>
        <div>
          <label class="text-sm text-secondary mb-1" for="vs_online">Show as online</label>
          <select class="input" id="vs_online" style="width:auto">
            <option value="true" ${vendor.is_online ? 'selected' : ''}>Yes</option>
            <option value="false" ${!vendor.is_online ? 'selected' : ''}>No</option>
          </select>
        </div>
        <div style="grid-column:1/-1">
          <button type="button" class="btn btn-primary btn-sm" id="vs_save">Save settings</button>
          <p id="vs_status" class="text-secondary text-sm mt-2 mb-0" role="status"></p>
        </div>
      </div>
    </div>`

  document.getElementById('vs_save')?.addEventListener('click', async () => {
    const status = document.getElementById('vs_status')
    let hours
    try {
      hours = JSON.parse(
        document.getElementById('vs_hours')?.value || '{}'
      )
    } catch {
      if (status) status.textContent = 'Hours must be valid JSON.'
      showToast('Invalid hours JSON')
      return
    }

    const payload = {
      name: document.getElementById('vs_name')?.value?.trim() || vendor.name,
      tagline:
        document.getElementById('vs_tagline')?.value?.trim() || null,
      description:
        document.getElementById('vs_desc')?.value?.trim() || null,
      story: document.getElementById('vs_story')?.value?.trim() || null,
      whatsapp:
        document.getElementById('vs_whatsapp')?.value?.trim() || null,
      payout_phone:
        document.getElementById('vs_payout')?.value?.trim() || null,
      area: document.getElementById('vs_area')?.value?.trim() || null,
      website_url:
        document.getElementById('vs_website')?.value?.trim() || null,
      hours: typeof hours === 'object' && hours !== null ? hours : {},
      is_online: document.getElementById('vs_online')?.value === 'true',
      updated_at: new Date().toISOString(),
    }

    if (status) status.textContent = 'Saving…'
    const { error } = await supabase
      .from('vendors')
      .update(payload)
      .eq('id', vendor.id)
      .eq('owner_id', session.user.id)

    if (error) {
      if (status) status.textContent = error.message
      showToast(error.message)
      return
    }
    if (status) status.textContent = 'Saved.'
    showToast('Store settings saved')
    await bootVendorSettings()
  })
}
