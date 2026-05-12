/**
 * checkout.html — reads cart, creates order + order_items in Supabase.
 * Live: buyer must be logged in (RLS: buyer_id = auth.uid()).
 * Demo (placeholders / unconfigured Supabase): local-only order + confirmation.
 */
import { supabase } from '../core/supabase.js'
import { formatPrice, generateOrderRef, trackEvent, calcCommission } from '../core/utils.js'
import { getCart, clearCart, updateCartBadge } from '../ui/cart.js'
import { resolveAppPath } from '../core/paths.js'
import { loadInto } from '../ui/components.js'
import { initiateStkPush, pollOrderUntilPaid } from './mpesa.js'
import { shouldUsePlaceholders } from '../core/config.js'

const DEMO_ORDER_STORAGE = 'lh_demo_order'

async function getDeliveryFeeCents() {
  if (shouldUsePlaceholders()) {
    const c = window.__LOCALHUB || window.__SOKO || {}
    const n = parseInt(String(c.deliveryFeeCents ?? '0'), 10)
    return Number.isFinite(n) ? n : 0
  }
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'delivery_fee_base')
    .maybeSingle()
  return parseInt(data?.value || '0', 10) || 0
}

function renderCart() {
  const host = document.getElementById('checkout-lines')
  const cart = getCart()
  if (!cart.length) {
    host.innerHTML = `<div class="empty-state">Your cart is empty. <a href="${resolveAppPath('index.html')}">Browse vendors</a>.</div>`
    document.getElementById('pay-section')?.setAttribute('hidden', 'true')
    return
  }

  host.innerHTML = cart
    .map(
      (i) => `
    <div class="card card-body" style="margin-bottom:0.75rem;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap">
      <div>
        <strong>${i.title}</strong>
        <div class="text-muted" style="font-size:0.85rem">${i.vendorName}</div>
      </div>
      <div class="text-right">
        <div class="mono">${formatPrice(i.price * i.quantity)}</div>
        <div class="text-muted" style="font-size:0.8rem">× ${i.quantity}</div>
      </div>
    </div>
  `
    )
    .join('')

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  document.getElementById('sum-subtotal') && (document.getElementById('sum-subtotal').textContent = formatPrice(subtotal))
}

async function renderTotals() {
  const cart = getCart()
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const delivery = await getDeliveryFeeCents()
  const total = subtotal + delivery
  const elS = document.getElementById('sum-subtotal')
  const elD = document.getElementById('sum-delivery')
  const elT = document.getElementById('sum-total')
  if (elS) elS.textContent = formatPrice(subtotal)
  if (elD) elD.textContent = formatPrice(delivery)
  if (elT) elT.textContent = formatPrice(total)
}

async function ensureLoggedIn() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const next = encodeURIComponent(location.href)
    window.location.href = `${resolveAppPath('auth/login.html')}?next=${next}`
    return null
  }
  return user
}

async function placeDemoOrder() {
  const cart = getCart()
  if (!cart.length) return

  const buyer_name = document.getElementById('buyer_name')?.value?.trim()
  const buyer_phone = document.getElementById('buyer_phone')?.value?.trim()
  const buyer_email = document.getElementById('buyer_email')?.value?.trim()
  const delivery_address = document.getElementById('delivery_address')?.value?.trim()
  const delivery_notes = document.getElementById('delivery_notes')?.value?.trim()
  if (!buyer_name || !buyer_phone || !delivery_address) {
    alert('Please fill name, phone, and delivery address.')
    return
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const delivery_fee_final = await getDeliveryFeeCents()
  const total_amount = subtotal + delivery_fee_final
  const order_ref = generateOrderRef()

  const payload = {
    order_ref,
    buyer_name,
    buyer_phone,
    buyer_email: buyer_email || null,
    delivery_address,
    delivery_notes: delivery_notes || null,
    subtotal,
    delivery_fee: delivery_fee_final,
    total_amount,
    status: 'demo',
    created_at: new Date().toISOString(),
    items: cart.map((i) => ({
      product_title: i.title,
      vendor_name: i.vendorName,
      quantity: i.quantity,
      unit_price: i.price,
      subtotal: i.price * i.quantity,
    })),
  }

  try {
    sessionStorage.setItem(DEMO_ORDER_STORAGE, JSON.stringify(payload))
  } catch {
    /* ignore */
  }

  clearCart()
  updateCartBadge()
  trackEvent('checkout_start', { payload: { demo: true, total_amount } })
  window.location.href = `${resolveAppPath('order-confirm.html')}?demo=1`
}

async function placeOrder(e) {
  e.preventDefault()

  if (shouldUsePlaceholders()) {
    await placeDemoOrder()
    return
  }

  const user = await ensureLoggedIn()
  if (!user) return

  const cart = getCart()
  if (!cart.length) return

  const buyer_name = document.getElementById('buyer_name')?.value?.trim()
  const buyer_phone = document.getElementById('buyer_phone')?.value?.trim()
  const buyer_email = document.getElementById('buyer_email')?.value?.trim()
  const delivery_address = document.getElementById('delivery_address')?.value?.trim()
  const delivery_notes = document.getElementById('delivery_notes')?.value?.trim()
  if (!buyer_name || !buyer_phone || !delivery_address) {
    alert('Please fill name, phone, and delivery address.')
    return
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const delivery_fee = await getDeliveryFeeCents()
  const total_amount = subtotal + delivery_fee
  const order_ref = generateOrderRef()

  trackEvent('checkout_start', { payload: { subtotal, delivery_fee, total_amount } })

  const { data: order, error: oErr } = await supabase
    .from('orders')
    .insert({
      order_ref,
      buyer_id: user.id,
      buyer_name,
      buyer_phone,
      buyer_email: buyer_email || null,
      delivery_address,
      delivery_notes: delivery_notes || null,
      subtotal,
      delivery_fee,
      total_amount,
      status: 'pending',
    })
    .select('id')
    .single()

  if (oErr || !order) {
    console.error(oErr)
    alert('Could not create order. Check console / Supabase policies.')
    return
  }

  const lines = []
  for (const i of cart) {
    const lineSub = i.price * i.quantity
    const split = calcCommission(lineSub, i.commissionRate)
    lines.push({
      order_id: order.id,
      vendor_id: i.vendorId,
      product_id: i.productId,
      product_title: i.title,
      product_image: i.image,
      quantity: i.quantity,
      unit_price: i.price,
      subtotal: lineSub,
      commission_rate: split.rate,
      commission_amount: split.commission,
      vendor_payout: split.vendorEarns,
    })
  }

  const { error: liErr } = await supabase.from('order_items').insert(lines)
  if (liErr) {
    console.error(liErr)
    alert('Order created but items failed. Ask admin to fix.')
    return
  }

  clearCart()
  updateCartBadge()

  const statusEl = document.getElementById('pay-status')
  if (statusEl) statusEl.textContent = 'Starting M-Pesa…'

  try {
    await initiateStkPush({
      phone: normalizePhone(buyer_phone),
      amountCents: total_amount,
      orderId: order.id,
    })
    if (statusEl) statusEl.textContent = 'Check your phone for the M-Pesa prompt…'
    await pollOrderUntilPaid(order.id)
    window.location.href = `${resolveAppPath('order-confirm.html')}?order=${encodeURIComponent(order.id)}`
  } catch (err) {
    console.warn(err)
    if (statusEl) statusEl.textContent =
      'Payment step skipped or failed — Edge Function may not be deployed yet. Order is saved as pending.'
    window.location.href = `${resolveAppPath('order-confirm.html')}?order=${encodeURIComponent(order.id)}`
  }
}

function normalizePhone(phone) {
  const d = String(phone).replace(/\D/g, '')
  if (d.startsWith('0')) return '254' + d.slice(1)
  if (d.startsWith('7') && d.length === 9) return '254' + d
  return d
}

export async function bootCheckout() {
  await loadInto('#nav-slot', '/partials/nav.html')
  await loadInto('#footer-slot', '/partials/footer.html')
  updateCartBadge()
  renderCart()
  await renderTotals()

  const loginHint = document.getElementById('checkout-login-hint')
  if (loginHint) loginHint.hidden = shouldUsePlaceholders()

  const hint = document.getElementById('checkout-demo-hint')
  if (hint) {
    hint.hidden = !shouldUsePlaceholders()
    if (shouldUsePlaceholders()) {
      hint.innerHTML =
        '<strong>Preview mode:</strong> No login or database required — submit saves a demo order in this browser session only.'
    }
  }

  const payBtn = document.querySelector('#pay-section button[type="submit"]')
  if (payBtn && shouldUsePlaceholders()) {
    payBtn.textContent = 'Complete demo order'
  }

  if (!shouldUsePlaceholders()) {
    await ensureLoggedIn()
  }

  document.getElementById('checkout-form')?.addEventListener('submit', placeOrder)
}
