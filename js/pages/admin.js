/**
 * Super-admin dashboards — works in preview (placeholders) and production (Supabase).
 */
import { requireAdminAccess, signOut } from '../core/auth.js'
import { supabase } from '../core/supabase.js'
import {
  shouldUsePlaceholders,
  getSupabaseConfig,
  isSupabaseConfigured,
} from '../core/config.js'
import {
  placeholderVendors,
  placeholderProducts,
} from '../data/placeholders.js'
import { showToast } from '../core/utils.js'
import { createEphemeralSupabaseClient } from '../core/ephemeral-supabase.js'
import { fetchDefaultCommissionRate } from './vendor-apply-shared.js'

function injectDemoBanner() {
  if (!shouldUsePlaceholders()) return
  if (document.querySelector('.admin-demo-banner')) return
  const el = document.createElement('div')
  el.className = 'admin-demo-banner'
  el.innerHTML =
    '<p><strong>Preview mode</strong> — Supabase URL/key still use placeholders. Deploy <code class="mono">supabase/schema.sql</code>, <code class="mono">supabase/migrations/004_vendor_applications_profiles_rls.sql</code> (+ base RLS) and set real keys in HTML for live admin data.</p>'
  const header = document.querySelector('.site-header')
  if (header?.parentNode) {
    header.insertAdjacentElement('afterend', el)
  } else {
    document.body.insertBefore(el, document.body.firstChild)
  }
}

export async function hydrateAdminChrome() {
  if (shouldUsePlaceholders()) return
  const btn = document.getElementById('admin-sign-out')
  const label = document.getElementById('admin-user-label')
  if (!btn || btn.dataset.bound === '1') return
  btn.dataset.bound = '1'
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (label) {
    const t = user?.email || user?.phone || ''
    label.textContent = t
    label.title = t
  }
  btn.addEventListener('click', () => {
    signOut().catch(console.error)
  })
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function vendorRowsDemoHtml(rows) {
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

function vendorMgmtTable(rows) {
  if (!rows?.length)
    return '<p class="text-secondary mt-2">No vendors yet.</p>'
  const body = rows
    .map(
      (v) => `
    <tr data-vendor-row="${escapeHtml(v.id)}">
      <td style="white-space:nowrap;display:flex;flex-wrap:wrap;gap:0.35rem">
        <button type="button" class="btn btn-ghost btn-sm" data-act="${
          v.is_approved ? 'unapprove' : 'approve'
        }" data-target="${escapeHtml(v.id)}">${v.is_approved ? 'Unpublish' : 'Publish'}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="${
          v.is_suspended ? 'unsusp' : 'susp'
        }" data-target="${escapeHtml(v.id)}">${v.is_suspended ? 'Unsuspend' : 'Suspend'}</button>
      </td>
      <td>${escapeHtml(v.name)}</td>
      <td class="mono">${escapeHtml(v.slug)}</td>
      <td>${escapeHtml(v.category)}</td>
      <td>${escapeHtml(v.area || '—')}</td>
      <td>${v.is_approved ? 'live' : 'hidden'}</td>
      <td>${v.is_suspended ? 'yes' : 'no'}</td>
    </tr>`
    )
    .join('')
  return `
    <div class="table-wrap mt-3">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Actions</th><th>Name</th><th>Slug</th><th>Category</th><th>Area</th><th>Hub</th><th>Suspended</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <p class="text-secondary text-sm mt-2 mb-0">Publish controls marketplace visibility. Use <a href="applications.html">Applications</a> to promote queued sellers.</p>`
}

function coerceApplicationCommission(row) {
  const raw = row?.commission_rate
  const v =
    typeof raw === 'string' ? parseFloat(raw) : typeof raw === 'number' ? raw : NaN
  if (!Number.isNaN(v)) return v
  return null
}

async function approveVendorFromApplication(applicationId, adminUserId) {
  const { data: appRow, error: fetchErr } = await supabase
    .from('vendor_applications')
    .select('*')
    .eq('id', applicationId)
    .single()
  if (fetchErr || !appRow)
    throw new Error(fetchErr?.message || 'Application not found')
  if (appRow.status !== 'pending')
    throw new Error('Not a pending application')

  const fallback = await fetchDefaultCommissionRate()
  const rate = coerceApplicationCommission(appRow) ?? fallback

  const { data: existing } = await supabase
    .from('vendors')
    .select('id')
    .eq('owner_id', appRow.applicant_id)
    .maybeSingle()

  const vendorFields = {
    owner_id: appRow.applicant_id,
    slug: appRow.slug.trim(),
    name: appRow.name,
    tagline: appRow.tagline,
    description: appRow.description,
    story: appRow.story,
    category: appRow.category,
    area: appRow.area,
    address: appRow.address,
    whatsapp: appRow.whatsapp,
    hours: appRow.hours || {},
    logo_url: appRow.logo_url,
    banner_url: appRow.banner_url,
    website_url: appRow.website_url,
    lat: appRow.lat,
    lng: appRow.lng,
    is_online: false,
    is_approved: true,
    is_suspended: false,
    commission_rate: rate,
    contract_signed: true,
    contract_signed_at: appRow.contract_signed_at,
    contract_name: appRow.contract_name,
    payout_phone: appRow.payout_phone,
  }

  let vendorRow
  if (existing?.id) {
    const { owner_id: _omit, ...updatePayload } = vendorFields
    void _omit
    const up = await supabase
      .from('vendors')
      .update(updatePayload)
      .eq('id', existing.id)
      .select('id')
      .single()
    if (up.error) throw new Error(up.error.message || String(up.error.code))
    vendorRow = up.data
  } else {
    const ins = await supabase
      .from('vendors')
      .insert(vendorFields)
      .select('id')
      .single()
    if (ins.error)
      throw new Error(ins.error.message || String(ins.error.code))
    vendorRow = ins.data
  }

  const pu = await supabase
    .from('profiles')
    .update({ role: 'vendor' })
    .eq('id', appRow.applicant_id)
  if (pu.error)
    throw new Error(pu.error.message || String(pu.error.code))

  const au = await supabase
    .from('vendor_applications')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUserId,
      created_vendor_id: vendorRow.id,
      rejection_reason: null,
    })
    .eq('id', applicationId)
  if (au.error)
    throw new Error(au.error.message || String(au.error.code))
}

function applicationCard(app) {
  const lines = [
    ['Slug', app.slug],
    ['Category', app.category],
    ['Area', app.area],
    ['WhatsApp', app.whatsapp],
    ['Payout phone', app.payout_phone],
    ['Notes', app.applicant_notes],
    ['Applied', app.created_at],
  ]
    .filter(([, val]) => val != null && String(val).trim() !== '')
    .map(
      ([k, val]) =>
        `<div><span class="text-secondary">${escapeHtml(k)}:</span> <span>${escapeHtml(String(val))}</span></div>`
    )
    .join('')

  return `
    <article class="card card-body mt-2" id="app-${escapeHtml(app.id)}">
      <header style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.75rem;align-items:flex-start">
        <div>
          <p class="eyebrow mb-0">${escapeHtml(app.status)}</p>
          <h2 class="section-title" style="font-size:1.25rem;margin:0">${escapeHtml(app.name)}</h2>
          ${app.tagline ? `<p class="text-secondary mt-1 mb-0">${escapeHtml(app.tagline)}</p>` : ''}
        </div>
        ${
          app.status === 'pending'
            ? `<div style="display:flex;gap:0.5rem;flex-wrap:wrap">
             <button type="button" class="btn btn-primary btn-sm" data-approve-application="${escapeHtml(app.id)}">Approve &amp; create shop</button>
             <button type="button" class="btn btn-ghost btn-sm" data-reject-application="${escapeHtml(app.id)}">Reject</button>
           </div>`
            : ''
        }
      </header>
      ${app.description ? `<p class="mt-2 mb-0">${escapeHtml(app.description)}</p>` : ''}
      <div class="grid mt-2" style="gap:0.35rem">${lines}</div>
      ${
        app.status !== 'pending' && app.rejection_reason
          ? `<p class="text-secondary mt-2 mb-0"><strong>Decision:</strong> ${escapeHtml(app.rejection_reason)}</p>`
          : ''
      }
    </article>`
}

export async function bootAdminHome() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  await hydrateAdminChrome()
  const el = document.getElementById('pending-count')
  const elApps = document.getElementById('pending-apps-count')
  if (ctx.demo) {
    if (el) {
      el.textContent = '—'
      el.setAttribute('title', 'Preview: counts need live Supabase')
    }
    if (elApps) {
      elApps.textContent = '—'
      elApps.setAttribute('title', 'Preview')
    }
    return
  }
  const { count: pendingUnpub } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', false)
  if (el) el.textContent = String(pendingUnpub ?? 0)

  const pendAppsResp = await supabase
    .from('vendor_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (elApps)
    elApps.title = ''

  if (pendAppsResp.error) {
    if (elApps) {
      elApps.textContent = '—'
      elApps.title = pendAppsResp.error.message
    }
  } else if (elApps)
    elApps.textContent = String(pendAppsResp.count ?? 0)
}

function bindVendorTableActions(main) {
  main.addEventListener('click', async (ev) => {
    const tgt = ev.target.closest('[data-act][data-target]')
    if (!tgt) return
    const id = tgt.getAttribute('data-target')
    const act = tgt.getAttribute('data-act')
    if (!id) return
    if (!['approve', 'unapprove', 'susp', 'unsusp'].includes(act)) return
    let patch = {}
    if (act === 'approve') patch = { is_approved: true }
    else if (act === 'unapprove') patch = { is_approved: false }
    else if (act === 'susp') patch = { is_suspended: true }
    else if (act === 'unsusp') patch = { is_suspended: false }

    tgt.disabled = true
    const { error } = await supabase.from('vendors').update(patch).eq('id', id)
    tgt.disabled = false
    if (error) {
      showToast(error.message || String(error.code))
      return
    }
    showToast('Updated')
    location.reload()
  })
}

export async function bootAdminVendors() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  await hydrateAdminChrome()
  const main = document.querySelector('main.page-main')
  if (!main) return

  if (ctx.demo) {
    main.insertAdjacentHTML(
      'beforeend',
      `<div class="card card-body mt-3">
        <p class="eyebrow">Sample catalog (bundled)</p>
        <p class="text-secondary mb-0">${placeholderVendors.length} demo vendors · ${placeholderProducts.length} demo products — same list as the public preview.</p>
      </div>
      ${vendorRowsDemoHtml(placeholderVendors)}`
    )
    return
  }

  const { data, error } = await supabase
    .from('vendors')
    .select(
      'id, name, slug, category, area, is_approved, is_suspended, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(120)

  if (error) {
    main.insertAdjacentHTML(
      'beforeend',
      `<p class="text-secondary mt-2">Could not load vendors: ${escapeHtml(error.message)}</p>`
    )
    return
  }
  main.insertAdjacentHTML('beforeend', vendorMgmtTable(data || []))
  bindVendorTableActions(main)
}

async function reloadApplications(main, ctx) {
  const hold = document.getElementById('applications-list-slot')
  if (!hold || ctx.demo) return
  hold.innerHTML = '<p class="text-secondary mt-2">Loading…</p>'
  const { data, error } = await supabase
    .from('vendor_applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) {
    hold.innerHTML = `<p class="text-secondary mt-2">${escapeHtml(error.message)}</p><p class="text-secondary text-sm">If the table does not exist, run <code class="mono">supabase/migrations/004_vendor_applications_profiles_rls.sql</code> in Supabase.</p>`
    return
  }
  if (!data?.length) {
    hold.innerHTML =
      '<p class="text-secondary mt-2">No pending seller applications.</p>'
    return
  }
  hold.innerHTML = data.map(applicationCard).join('')
}

export async function bootAdminApplications() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  await hydrateAdminChrome()
  const main = document.querySelector('main.page-main')
  if (!main) return

  if (ctx.demo) {
    main.insertAdjacentHTML(
      'beforeend',
      `<div class="card card-body mt-3"><p class="eyebrow">Preview</p>
      <p class="text-secondary mb-0">Connect Supabase to review real applications.</p></div>`
    )
    return
  }

  const slot = document.getElementById('applications-list-slot')
  if (slot)
    slot.innerHTML =
      '<p class="text-muted text-sm mb-0">Pending applications queue here.</p>'

  await reloadApplications(main, ctx)

  main.addEventListener('click', async (ev) => {
    const ap = ev.target.closest('[data-approve-application]')
    const rj = ev.target.closest('[data-reject-application]')
    const id =
      ap?.getAttribute('data-approve-application') ||
      rj?.getAttribute('data-reject-application')
    if (!id) return

    try {
      if (ap && ctx?.user?.id) {
        ap.disabled = true
        await approveVendorFromApplication(id, ctx.user.id)
        showToast('Application approved · shop published')
      } else if (rj && ctx?.user?.id) {
        const why = window.prompt('Reason shown internally (optional):') ?? ''
        rj.disabled = true
        const { error } = await supabase
          .from('vendor_applications')
          .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            reviewed_by: ctx.user.id,
            rejection_reason: why || 'Rejected',
          })
          .eq('id', id)
        if (error) throw error
        showToast('Application rejected')
      }
    } catch (err) {
      console.error(err)
      showToast(err?.message || String(err))
    } finally {
      if (ap) ap.disabled = false
      if (rj) rj.disabled = false
      await reloadApplications(main, ctx)
    }
  })
}

export async function bootAdminOrders() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  await hydrateAdminChrome()
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
  await hydrateAdminChrome()
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
  await hydrateAdminChrome()
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

/** Shared password documented on admin/tools.html (throwaway testers). */
const DEMO_SHOPPER_PASSWORD = 'LocalHub-Demo1!'

function demoProductSeedRows(vendorId) {
  const tag =
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 14)
      : String(Date.now())
  const img = (seed) => [
    {
      url: `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`,
      alt: 'Demo listing image',
    },
  ]

  return [
    {
      vendor_id: vendorId,
      title: 'Seed · Canvas tote bag',
      slug: `${tag}-lh-tote`,
      description: 'Admin seed listing — delete anytime.',
      price: 249900,
      compare_price: 289900,
      category: 'household',
      tags: ['demo', 'seed'],
      images: img(`${tag}-tote`),
      inventory: 8,
      is_available: true,
      is_featured: true,
    },
    {
      vendor_id: vendorId,
      title: 'Seed · Cold-press soap bar',
      slug: `${tag}-lh-soap`,
      description: 'Admin seed listing — delete anytime.',
      price: 14900,
      category: 'household',
      tags: ['demo', 'seed'],
      images: img(`${tag}-soap`),
      inventory: 40,
      is_available: true,
      is_featured: false,
    },
    {
      vendor_id: vendorId,
      title: 'Seed · Handmade earrings',
      slug: `${tag}-lh-ear`,
      description: 'Admin seed listing — delete anytime.',
      price: 89900,
      category: 'fashion',
      tags: ['demo', 'seed'],
      images: img(`${tag}-ear`),
      inventory: 15,
      is_available: true,
      is_featured: false,
    },
    {
      vendor_id: vendorId,
      title: 'Seed · Herbal tea trio',
      slug: `${tag}-lh-tea`,
      description: 'Admin seed listing — delete anytime.',
      price: 35900,
      category: 'groceries',
      tags: ['demo', 'seed'],
      images: img(`${tag}-tea`),
      inventory: 25,
      is_available: true,
      is_featured: false,
    },
    {
      vendor_id: vendorId,
      title: 'Seed · Vinyl sticker pack',
      slug: `${tag}-lh-sticker`,
      description: 'Admin seed listing — delete anytime.',
      price: 12000,
      category: 'household',
      tags: ['demo', 'seed'],
      images: img(`${tag}-stk`),
      inventory: 100,
      is_available: true,
      is_featured: false,
    },
  ]
}

async function refreshProfilesPreviewTable(container) {
  if (!container) return
  if (shouldUsePlaceholders()) {
    container.innerHTML =
      '<p class="text-secondary mb-0">Preview mode — profiles load with live credentials.</p>'
    return
  }
  container.innerHTML = '<p class="text-secondary mb-0">Loading…</p>'
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, created_at')
    .order('created_at', { ascending: false })
    .limit(25)

  if (error) {
    container.innerHTML = `<p class="text-secondary mb-0">${escapeHtml(error.message)}</p>`
    return
  }
  if (!data?.length) {
    container.innerHTML =
      '<p class="text-secondary mb-0">No profiles yet.</p>'
    return
  }
  const rows = data
    .map(
      (r) =>
        `<tr>
      <td class="mono" style="max-width:8rem;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.id)}</td>
      <td>${escapeHtml(r.full_name || '—')}</td>
      <td>${escapeHtml(r.phone || '—')}</td>
      <td>${escapeHtml(r.role)}</td>
      <td class="mono text-sm">${escapeHtml(r.created_at || '')}</td>
    </tr>`
    )
    .join('')
  container.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr><th>Id</th><th>Name</th><th>Phone</th><th>Role</th><th>Created</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
}

async function fillVendorSeedSelect(sel) {
  if (!sel) return
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, slug, is_approved')
    .order('name')

  sel.innerHTML = '<option value="">Choose vendor…</option>'
  if (error || !data?.length) return
  for (const v of data) {
    const o = document.createElement('option')
    o.value = v.id
    o.textContent = `${v.name} (${v.slug})${v.is_approved ? '' : ' · hidden'}`
    sel.appendChild(o)
  }
}

export async function bootAdminTools() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  await hydrateAdminChrome()
  const buyersOut = document.getElementById('seed-buyers-output')
  const productsOut = document.getElementById('seed-products-output')
  const vendorSel = document.getElementById('seed-vendor-select')
  const profilesSlot = document.getElementById('profiles-preview-slot')

  if (ctx.demo) {
    buyersOut?.append('Preview mode · create seeds after deploying keys.\n')
    productsOut?.append('Preview mode.\n')
    await refreshProfilesPreviewTable(profilesSlot)
    return
  }

  await fillVendorSeedSelect(vendorSel)
  await refreshProfilesPreviewTable(profilesSlot)

  document.getElementById('seed-buyers-btn')?.addEventListener('click', async () => {
    if (!buyersOut) return
    const ephemeral = createEphemeralSupabaseClient()
    const tag =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
        : String(Date.now())

    buyersOut.textContent = 'Signing up shoppers…'

    const lines = []
    for (let i = 1; i <= 3; i++) {
      const email = `lh_demo_${tag}_${i}@example.com`
      const { data: signData, error } = await ephemeral.auth.signUp({
        email,
        password: DEMO_SHOPPER_PASSWORD,
        options: {
          data: { full_name: `LH demo shopper ${i}` },
        },
      })
      if (error) lines.push(`${email}: ${error.message}`)
      else if (signData?.user?.id)
        lines.push(`${email}: ok (${signData.user.id})`)
      else
        lines.push(
          `${email}: check Auth settings or rate limits`
        )
      if (i < 3) await new Promise((r) => setTimeout(r, 1200))
    }
    lines.push('', `Shared password shown above (${DEMO_SHOPPER_PASSWORD}).`)
    buyersOut.textContent = lines.join('\n')
    showToast('Demo shoppers signup finished · see log')
    await refreshProfilesPreviewTable(profilesSlot)
  })

  document.getElementById('seed-products-btn')?.addEventListener('click', async () => {
    if (!productsOut || !vendorSel) return
    const vid = vendorSel.value
    if (!vid) {
      showToast('Choose a vendor first')
      return
    }
    productsOut.textContent = 'Inserting…'
    const rows = demoProductSeedRows(vid)
    const { data, error } = await supabase
      .from('products')
      .insert(rows)
      .select('id, slug, title')
    if (error) {
      productsOut.textContent = error.message || String(error.code)
      showToast('Product seed failed · see log')
      return
    }
    const lines =
      data?.map(
        (p) => `- ${p.title} · ${p.slug} · ${p.id}`
      ) ?? []
    productsOut.textContent = ['Inserted:', ...lines].join('\n')
    showToast(`${data?.length || 0} demo products created`)
  })
}

export async function bootAdminMonitoring() {
  const ctx = await requireAdminAccess()
  if (!ctx) return
  injectDemoBanner()
  await hydrateAdminChrome()

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
