/**
 * Optional client analytics — skipped in static preview / demo mode.
 */
import { shouldUsePlaceholders } from './config.js'
import { supabase } from './supabase.js'

/** DB stores money in “cents” (250000 → Ksh 2,500). */
export function formatPrice(cents) {
  const n = Number(cents) || 0
  return `Ksh ${(n / 100).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
}

/** Split one line-item amount between you and the vendor using a % rate. */
export function calcCommission(priceCents, commissionRate = 10) {
  const gross = Math.round(Number(priceCents) || 0)
  const rate = Number(commissionRate) || 0
  const commission = Math.round(gross * (rate / 100))
  return {
    gross,
    commission,
    vendorEarns: gross - commission,
    rate,
  }
}

export function generateOrderRef() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `MKT-${date}-${rand}`
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Normalised vendor “own website” link (http/https only). Prepends https:// if the scheme is missing. */
export function safeHttpUrl(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return null
  let candidate = s
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`
  try {
    const u = new URL(candidate)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.href
  } catch {
    return null
  }
}

export function showToast(message, type = 'info') {
  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.textContent = message
  el.setAttribute('role', 'status')
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('toast-show'))
  setTimeout(() => {
    el.classList.remove('toast-show')
    setTimeout(() => el.remove(), 300)
  }, 2800)
}

/** Optional client analytics — failures are ignored on purpose. */
export function trackEvent(type, payload = {}) {
  if (shouldUsePlaceholders()) return

  const sessionId = sessionStorage.getItem('soko_sid') || crypto.randomUUID()
  sessionStorage.setItem('soko_sid', sessionId)

  const row = {
    type,
    session_id: sessionId,
    vendor_id: payload.vendor_id ?? null,
    product_id: payload.product_id ?? null,
    payload: payload.payload || {},
  }

  supabase.from('analytics_events').insert(row).then(() => {})
}
