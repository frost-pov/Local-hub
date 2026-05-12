/**
 * Super-admin dashboards — works in preview (placeholders) and production (Supabase).
 */
import { requireAdminAccess } from '../core/auth.js'
import { supabase } from '../core/supabase.js'
import { shouldUsePlaceholders, getSupabaseConfig, isSupabaseConfigured } from '../core/config.js'
import {
  placeholderVendors,
  placeholderProducts,
} from '../data/placeholders.js'

function injectDemoBanner() {
  if (!shouldUsePlaceholders()) return
  if (document.querySelector('.admin-demo-banner')) return
  const el = document.createElement('div')
  el.className = 'admin-demo-banner'
  el.innerHTML =
    '<p><strong>Preview mode</strong> — Supabase URL/key still use placeholders. Deploy <code class="mono">supabase/schema.sql</code> (+ RLS) and set real keys in HTML for live admin data.</p>'
  const header = document.querySelector('.site-header')
  if (header?.parentNode) {
    header.insertAdjacentElement('afterend', el)
  } else {
    document.body.insertBefore(el, document.body.firstChild)
  }
}

function vendorRowsHtml(rows) {
  if (!rows?.length)
    return '<p class="text-secondary mt-2">No rows returned.</p>'
  return `
    <div class="table-wrap mt-2">
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Slug</th><th>Category</th><th>Area</th><th>Approved</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (v) => `
            <tr>
              <td>${escapeHtml(v.name)}</td>
              <td class="mono">${escapeHtml(v.slug)}</td>
              <td>${escapeHtml(v.category)}</td>
              <td>${escapeHtml(v.area || '—')}</td>
              <td>${v.is_approved ? 'yes' : 'no'}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>`
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function bootAdminHome() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  const el = document.getElementById('pending-count')
  if (!el) return
  if (ctx.demo) {
    el.textContent = '—'
    el.setAttribute('title', 'Preview: pending count needs live Supabase')
    return
  }
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id')
    .eq('is_approved', false)
  el.textContent = String(vendors?.length || 0)
}

export async function bootAdminVendors() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  const main = document.querySelector('main.page-main')
  if (!main) return

  if (ctx.demo) {
    main.insertAdjacentHTML(
      'beforeend',
      `<div class="card card-body mt-3">
        <p class="eyebrow">Sample catalog (bundled)</p>
        <p class="text-secondary mb-0">${placeholderVendors.length} demo vendors · ${placeholderProducts.length} demo products — same list as the public preview.</p>
      </div>
      ${vendorRowsHtml(placeholderVendors)}`
    )
    return
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('name, slug, category, area, is_approved')
    .order('created_at', { ascending: false })
    .limit(80)
  if (error) {
    main.insertAdjacentHTML(
      'beforeend',
      `<p class="text-secondary mt-2">Could not load vendors: ${escapeHtml(error.message)}</p>`
    )
    return
  }
  main.insertAdjacentHTML('beforeend', vendorRowsHtml(data || []))
}

export async function bootAdminOrders() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  const main = document.querySelector('main.page-main')
  if (!main) return

  if (ctx.demo) {
    main.insertAdjacentHTML(
      'beforeend',
      `<div class="card card-body mt-3">
        <p class="eyebrow">Orders</p>
        <p class="text-secondary mb-0">No database in preview. Complete a <a href="../checkout.html">demo checkout</a> to exercise the UI; real orders appear here after Supabase + RLS.</p>
      </div>`
    )
    return
  }

  const { data, error } = await supabase
    .from('orders')
    .select('order_ref, status, total_amount, buyer_name, created_at')
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) {
    main.insertAdjacentHTML(
      'beforeend',
      `<p class="text-secondary mt-2">Could not load orders: ${escapeHtml(error.message)}</p>`
    )
    return
  }
  if (!data?.length) {
    main.insertAdjacentHTML(
      'beforeend',
      '<p class="text-secondary mt-2">No orders yet.</p>'
    )
    return
  }
  const rows = data
    .map(
      (o) => `
    <tr>
      <td class="mono">${escapeHtml(o.order_ref)}</td>
      <td>${escapeHtml(o.status)}</td>
      <td>${escapeHtml(o.buyer_name || '—')}</td>
      <td class="mono">${o.total_amount != null ? o.total_amount : '—'}</td>
      <td>${escapeHtml(o.created_at || '')}</td>
    </tr>`
    )
    .join('')
  main.insertAdjacentHTML(
    'beforeend',
    `<div class="table-wrap mt-3"><table class="admin-table"><thead><tr><th>Ref</th><th>Status</th><th>Buyer</th><th>Total (cents)</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table></div>`
  )
}

export async function bootAdminPayouts() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  const main = document.querySelector('main.page-main')
  if (main && ctx.demo) {
    main.insertAdjacentHTML(
      'beforeend',
      `<div class="card card-body mt-3">
        <p class="eyebrow">Payouts</p>
        <p class="text-secondary mb-0">Wire <code class="mono">supabase/functions/payout</code> and schedule triggers for production. No payout data in preview.</p>
      </div>`
    )
  }
}

export async function bootAdminSettings() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  const main = document.querySelector('main.page-main')
  if (main && ctx.demo) {
    main.insertAdjacentHTML(
      'beforeend',
      `<div class="card card-body mt-3">
        <p class="eyebrow">Platform settings</p>
        <p class="text-secondary mb-0">Edit <code class="mono">platform_settings</code> in Supabase (delivery fee, branding). Preview has no remote settings row.</p>
      </div>`
    )
  }
}

function catalogStats() {
  const vidToCat = Object.fromEntries(
    placeholderVendors.map((v) => [v.id, v.category])
  )
  const productsByCat = { fashion: 0, groceries: 0, services: 0, household: 0 }
  for (const p of placeholderProducts) {
    const c = vidToCat[p.vendor_id]
    if (c && productsByCat[c] !== undefined) productsByCat[c] += 1
  }
  const vendorsByCat = placeholderVendors.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1
    return acc
  }, {})
  return { productsByCat, vendorsByCat }
}

export async function bootAdminMonitoring() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()

  const cfg = getSupabaseConfig()
  const configured = isSupabaseConfigured()

  const elConfig = document.getElementById('mon-config')
  if (elConfig) {
    elConfig.innerHTML = `
      <p class="eyebrow">Client configuration</p>
      <p class="mb-0"><strong>Supabase URL:</strong> <span class="mono">${escapeHtml(cfg.url)}</span></p>
      <p class="text-secondary mt-1 mb-0">${configured ? 'URL + anon key look valid — ping below to confirm REST access.' : 'Demo catalog loads until production URL (.supabase.co) + JWT anon key are pasted in each page’s <code class="mono">window.__LOCALHUB</code> block.'}</p>`
  }

  const stats = catalogStats()
  const elStats = document.getElementById('mon-stats')
  if (elStats) {
    elStats.innerHTML = `
      <div class="card card-body"><p class="eyebrow">Demo vendors</p><p class="section-title" style="font-size:1.75rem;margin:0">${placeholderVendors.length}</p><p class="text-secondary text-sm mt-1 mb-0">fashion ${stats.vendorsByCat.fashion || 0} · groceries ${stats.vendorsByCat.groceries || 0} · services ${stats.vendorsByCat.services || 0} · household ${stats.vendorsByCat.household || 0}</p></div>
      <div class="card card-body"><p class="eyebrow">Demo products</p><p class="section-title" style="font-size:1.75rem;margin:0">${placeholderProducts.length}</p><p class="text-secondary text-sm mt-1 mb-0">mixed goods &amp; services listings</p></div>
      <div class="card card-body"><p class="eyebrow">By category (products)</p><p class="mb-0 text-secondary">fashion ${stats.productsByCat.fashion}, groceries ${stats.productsByCat.groceries}, services ${stats.productsByCat.services}, household ${stats.productsByCat.household}</p></div>`
  }

  const elPing = document.getElementById('mon-ping-status')
  document.getElementById('mon-ping-btn')?.addEventListener('click', async () => {
    if (!elPing) return
    elPing.textContent = 'Pinging…'
    try {
      const r = await fetch(`${cfg.url}/auth/v1/health`, {
        headers: { apikey: cfg.anonKey },
      })
      elPing.textContent = `Auth health: HTTP ${r.status} ${r.ok ? 'OK' : ''}`
    } catch (e) {
      elPing.textContent = `Request failed: ${e?.message || e}`
    }
  })
}
