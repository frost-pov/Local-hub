/**
 * order-confirm.html — read-only order summary after checkout.
 * Demo orders: sessionStorage + ?demo=1 (no Supabase).
 */
import { supabase } from '../core/supabase.js'
import { formatPrice } from '../core/utils.js'
import { loadInto } from '../ui/components.js'
import { resolveAppPath } from '../core/paths.js'

const DEMO_ORDER_STORAGE = 'lh_demo_order'

function renderDemoOrder(root) {
  let raw
  try {
    raw = sessionStorage.getItem(DEMO_ORDER_STORAGE)
  } catch {
    raw = null
  }
  if (!raw) {
    root.innerHTML = `<div class="empty-state">No demo order in this tab. <a href="${resolveAppPath('index.html')}">Browse</a> and checkout again.</div>`
    return
  }
  let order
  try {
    order = JSON.parse(raw)
  } catch {
    root.innerHTML = `<div class="empty-state">Demo order data could not be read.</div>`
    return
  }

  root.innerHTML = `
    <div class="reveal">
      <p class="eyebrow">Demo order (preview)</p>
      <h1 class="section-title">${order.order_ref}</h1>
      <p class="text-secondary">Status: <strong>${order.status}</strong> — not persisted; connect Supabase for real orders.</p>
      <div class="card card-body mt-2">
        <p>${order.buyer_name} · ${order.buyer_phone}</p>
        <p class="text-secondary mt-1">${order.delivery_address}</p>
      </div>
      <h2 class="section-title mt-3">Items</h2>
      ${(order.items || []).map((i) => `
        <div class="card card-body" style="margin-bottom:0.5rem">
          <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap">
            <span>${i.product_title} <span class="text-muted">(${i.vendor_name})</span> × ${i.quantity}</span>
            <span class="mono">${formatPrice(i.subtotal)}</span>
          </div>
        </div>
      `).join('')}
      <p class="mt-2 mono">Total: ${formatPrice(order.total_amount)}</p>
      <p class="text-muted mt-1" style="font-size:0.85rem">This reference is for the preview only.</p>
    </div>
  `
}

export async function bootOrderConfirm() {
  await loadInto('#nav-slot', '/partials/nav.html')
  await loadInto('#footer-slot', '/partials/footer.html')

  const root = document.getElementById('order-root')
  if (!root) return

  const params = new URLSearchParams(location.search)
  if (params.get('demo') === '1') {
    renderDemoOrder(root)
    return
  }

  const id = params.get('order')
  if (!id) {
    root.innerHTML = `<div class="empty-state">Missing order reference.</div>`
    return
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !order) {
    root.innerHTML = `<div class="empty-state">Order not found or you don’t have access.</div>`
    return
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)

  root.innerHTML = `
    <div class="reveal">
      <p class="eyebrow">Order</p>
      <h1 class="section-title">${order.order_ref}</h1>
      <p class="text-secondary">Status: <strong>${order.status}</strong></p>
      <div class="card card-body mt-2">
        <p>${order.buyer_name} · ${order.buyer_phone}</p>
        <p class="text-secondary mt-1">${order.delivery_address}</p>
      </div>
      <h2 class="section-title mt-3">Items</h2>
      ${(items || []).map((i) => `
        <div class="card card-body" style="margin-bottom:0.5rem">
          <div style="display:flex;justify-content:space-between;gap:1rem">
            <span>${i.product_title} × ${i.quantity}</span>
            <span class="mono">${formatPrice(i.subtotal)}</span>
          </div>
        </div>
      `).join('')}
      <p class="mt-2 mono">Total: ${formatPrice(order.total_amount)}</p>
      <p class="text-muted mt-1" style="font-size:0.85rem">Save this reference for support.</p>
    </div>
  `
}
