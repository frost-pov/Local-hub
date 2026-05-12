/**
 * vendor.html: read ?slug=…, fetch vendor then products (order matters for RLS queries).
 */
import { supabase } from '../core/supabase.js'
import { formatPrice, trackEvent, safeHttpUrl } from '../core/utils.js'
import { addToCart, updateCartBadge } from '../ui/cart.js'
import { shouldUsePlaceholders } from '../core/config.js'
import { resolveAppPath } from '../core/paths.js'
import { injectPreviewChrome } from '../ui/preview-chrome.js'
import {
  getPlaceholderVendorBySlug,
  getPlaceholderProductsForVendor,
  bannerFallbackClass,
  themeForVendor,
  SHOP_SKINS,
} from '../data/placeholders.js'

function qs(sel, root = document) {
  return root.querySelector(sel)
}

function getSlugFromUrl() {
  const p = new URLSearchParams(window.location.search).get('slug')
  if (p) return p
  const parts = window.location.pathname.split('/').filter(Boolean)
  const shopIdx = parts.indexOf('shop')
  if (shopIdx >= 0 && parts[shopIdx + 1]) return parts[shopIdx + 1]
  return null
}

function renderNotFound() {
  const hint = shouldUsePlaceholders()
    ? `<p class="text-secondary mt-2" style="max-width:42ch;margin-left:auto;margin-right:auto">Try preview stores: <span class="mono">simply-stylish</span>, <span class="mono">trim</span>, <span class="mono">westlands-streetwear</span>, <span class="mono">kilimani-living-co</span></p>`
    : ''
  qs('#vendor-root').innerHTML = `
    <div class="site-wrap page-main empty-state reveal">
      <h2>Store not found</h2>
      <p class="mt-2">This vendor does not exist or is not live yet.</p>
      ${hint}
      <p class="mt-2"><a class="btn btn-primary" href="${resolveAppPath('index.html')}">Back home</a></p>
    </div>
  `
}

function waLink(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return '#'
  const n = digits.startsWith('0') ? '254' + digits.slice(1) : digits
  return `https://wa.me/${n}`
}

function applyVendorSkin(vendor) {
  document.body.classList.remove('has-vendor-skin')
  SHOP_SKINS.forEach((s) => document.body.classList.remove(`vendor-skin--${s}`))
  const skin = themeForVendor(vendor)
  document.body.classList.add('has-vendor-skin', `vendor-skin--${skin}`)
}

export async function loadVendorPage() {
  injectPreviewChrome()

  const slug = getSlugFromUrl()
  if (!slug) {
    applyVendorSkin({ category: 'fashion' })
    return renderNotFound()
  }

  if (shouldUsePlaceholders()) {
    const demoVendor = getPlaceholderVendorBySlug(slug)
    if (demoVendor) {
      const products = getPlaceholderProductsForVendor(demoVendor.id)
      trackEvent('vendor_view', { vendor_id: demoVendor.id })
      applyVendorSkin(demoVendor)
      qs('#vendor-root').innerHTML = buildHtml(demoVendor, products)
      bindAddToCart(demoVendor, products)
      updateCartBadge()
      return
    }
    applyVendorSkin({ category: 'fashion' })
    return renderNotFound()
  }

  const { data: vendor, error: vErr } = await supabase
    .from('vendors')
    .select('*')
    .eq('slug', slug)
    .eq('is_approved', true)
    .maybeSingle()

  if (vErr || !vendor) {
    applyVendorSkin({ category: 'fashion' })
    return renderNotFound()
  }

  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('is_available', true)
    .order('is_featured', { ascending: false })

  if (pErr) console.error(pErr)

  trackEvent('vendor_view', { vendor_id: vendor.id })

  applyVendorSkin(vendor)

  qs('#vendor-root').innerHTML = buildHtml(vendor, products || [])
  bindAddToCart(vendor, products || [])
  updateCartBadge()
}

function buildHtml(vendor, products) {
  const online = vendor.is_online
  const banner = vendor.banner_url || ''
  const ph = banner ? '' : bannerFallbackClass(vendor.category)
  const logo = vendor.logo_url || ''

  const bannerBlock = banner
    ? `<img src="${banner}" alt="" loading="lazy" />`
    : `<div class="vendor-card__ph ${ph}" style="min-height:140px" aria-hidden="true"></div>`

  const productCards = products.length
    ? products.map((p) => productCard(p, vendor)).join('')
    : `<div class="empty-state">No products listed yet.</div>`

  const onlineUi = online
    ? `<span class="badge badge-online"><span class="online-dot" aria-hidden="true"></span> Online now</span>`
    : `<span class="badge badge-offline">Offline</span>`
  const ownSite = safeHttpUrl(vendor.website_url)
  const websiteBtn = ownSite
    ? `<a class="btn btn-secondary btn-sm" href="${ownSite}" target="_blank" rel="noopener noreferrer">Their website</a>`
    : ''

  return `
    <div class="vendor-banner">${bannerBlock}</div>
    <div class="vendor-header">
      <div class="vendor-logo-wrap">
        ${logo ? `<img src="${logo}" alt="" loading="lazy" width="96" height="96" />` : `<div class="vendor-logo-fallback">${vendor.name.slice(0, 1)}</div>`}
      </div>
      <div class="vendor-info">
        <p class="eyebrow">${vendor.category} · ${vendor.area || 'Nairobi'}</p>
        <h1 class="vendor-name">${vendor.name}</h1>
        <p class="vendor-tagline">${vendor.tagline || ''}</p>
        <div class="vendor-meta-row">
          ${onlineUi}
          ${websiteBtn}
          <a class="btn btn-secondary btn-sm" href="${waLink(vendor.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    </div>
    <main class="site-wrap page-main vendor-shop">
      <h2 class="section-title reveal reveal-delay-1">Shop</h2>
      <div class="grid grid-3">${productCards}</div>
      <section class="reveal reveal-delay-2">
        <h2 class="section-title">About</h2>
        <div class="card"><div class="card-body text-secondary">${(vendor.story || vendor.description || '—').replace(/\n/g, '<br/>')}</div></div>
      </section>
    </main>
    <a href="${resolveAppPath('checkout.html')}" class="fab-cart btn btn-primary" aria-label="Open cart checkout">
      Cart <span class="cart-badge" data-cart-count></span>
    </a>
  `
}

function productCard(p, vendor) {
  const img = p.images?.[0]?.url
  return `
    <article class="product-card lh-card-mount" data-product-id="${p.id}">
      <div class="product-card__img">
        ${img ? `<img src="${img}" alt="" loading="lazy" />` : `<div class="product-img-ph"></div>`}
        <div class="product-img-grad"></div>
      </div>
      <div class="product-card__body">
        <h3 class="product-card__title">${p.title}</h3>
        <div class="product-card__footer" style="flex-wrap:wrap">
          <span class="price">${formatPrice(p.price)}</span>
        </div>
        <button type="button" class="btn btn-primary btn-block mt-2 js-add" data-id="${p.id}">Add to cart</button>
      </div>
    </article>
  `
}

function bindAddToCart(vendor, products) {
  const byId = new Map(products.map((p) => [p.id, p]))
  document.querySelectorAll('.js-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      const product = byId.get(id)
      if (!product) return
      const rate = Number(vendor.commission_rate) || 10
      addToCart(product, vendor.id, vendor.name, rate)
    })
  })
}
