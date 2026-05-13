/**
 * index.html: featured vendors, products, and simple search.
 * vendors.html: full customer-facing vendor directory (`bootVendorsPage`).
 */
import { supabase } from '../core/supabase.js'
import { formatPrice, trackEvent, safeHttpUrl, showToast } from '../core/utils.js'
import { updateCartBadge } from '../ui/cart.js'
import { loadInto } from '../ui/components.js'
import { vendorPageHref, resolveAppPath } from '../core/paths.js'
import { shouldUsePlaceholders } from '../core/config.js'
import { injectPreviewChrome } from '../ui/preview-chrome.js'
import {
  placeholderProducts,
  placeholderVendors,
  filterPlaceholderVendors,
  searchPlaceholderVendors,
  bannerFallbackClass,
  themeForVendor,
} from '../data/placeholders.js'

const BRAND_LOCKUP_HTML =
  '<span class="brand-line">LOCAL</span><span class="brand-accent"> HUB</span><span class="brand-ke">.KE</span>'

/** When Unsplash/CDN thumbnails fail (referrer/network), swap once to a stable stock frame. */
const DEMO_IMG_FALLBACK =
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&h=800&q=82'

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

function wireImgFallbacks(root = document.body) {
  if (!root?.querySelectorAll) return
  root.querySelectorAll('img[src]').forEach((img) => {
    if (img.dataset.lhImgFallback) return
    img.dataset.lhImgFallback = '1'
    if (!img.hasAttribute('referrerpolicy')) img.setAttribute('referrerpolicy', 'no-referrer')
    img.addEventListener(
      'error',
      () => {
        if (img.dataset.lhImgFallbackApplied) return
        img.dataset.lhImgFallbackApplied = '1'
        img.removeAttribute('srcset')
        img.src = DEMO_IMG_FALLBACK
      },
      { passive: true }
    )
  })
}

function renderGhostShowcase() {
  const host = document.getElementById('ghost-showcase-root')
  if (!host) return

  const pinned = new Set(['simply-stylish', 'trim'])
  const front = placeholderVendors.filter((v) => pinned.has(v.slug))
  const rest = placeholderVendors.filter((v) => !pinned.has(v.slug))
  host.innerHTML = [...front, ...rest]
    .slice(0, 12)
    .map((v) => {
      const hub = vendorPageHref(v.slug)
      const external = safeHttpUrl(v.website_url)
      const siteLabel = shouldUsePlaceholders() ? 'Demo brand site' : 'Their website'
      const area = escapeHtml(v.area || '')
      const cat = escapeHtml(v.category || '')
      const siteBtn = external
        ? `<a class="btn btn-secondary" href="${external}" target="_blank" rel="noopener noreferrer">${siteLabel}</a>`
        : ''
      return `
    <div class="lh-ghost-row">
      <div class="lh-ghost-row__main">
        <p class="lh-ghost-row__name">${escapeHtml(v.name)}</p>
        <div class="lh-ghost-row__meta">
          <span>${area}</span>
          <span>${cat}</span>
        </div>
      </div>
      <div class="lh-ghost-row__actions">
        <a class="btn btn-primary" href="${hub}">Hub storefront</a>
        ${siteBtn}
      </div>
    </div>`
    })
    .join('')
}

async function ensureLeaflet() {
  if (window.L) return
  if (!ensureLeaflet._p) {
    ensureLeaflet._p = new Promise((resolve, reject) => {
      const href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = href
        document.head.appendChild(link)
      }
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        ensureLeaflet._p = null
        reject(new Error('Leaflet failed to load'))
      }
      document.head.appendChild(script)
    })
  }
  await ensureLeaflet._p
}

async function bootVendorDiscoveryMap() {
  const el = document.getElementById('vendor-map-root')
  if (!el || !shouldUsePlaceholders()) return

  try {
    await ensureLeaflet()
  } catch (e) {
    console.warn(e)
    el.innerHTML =
      '<p class="text-muted" style="padding:1rem">Map assets could not load. Check your network and try again.</p>'
    return
  }

  const L = window.L
  const map = L.map(el, { scrollWheelZoom: false }).setView([-1.28, 36.825], 12)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer noopener">OpenStreetMap</a>',
  }).addTo(map)

  placeholderVendors.forEach((v) => {
    if (v.map_lat == null || v.map_lng == null) return
    const m = L.marker([v.map_lat, v.map_lng]).addTo(map)
    m.bindPopup(
      `<strong>${escapeHtml(v.name)}</strong><br>` +
        `<span style="opacity:.75;font-size:12px">${escapeHtml(v.area || '')}</span><br>` +
        `<a href="${vendorPageHref(v.slug)}">Open on Local Hub</a>`
    )
  })

  requestAnimationFrame(() => map.invalidateSize())
  setTimeout(() => map.invalidateSize(), 400)
  window.addEventListener('resize', () => map.invalidateSize(), { passive: true })
}

/** Resize/crop helpers when `src` is Unsplash or Lorem Picsum (`/id/…`) demo URLs. */
function sizedPhoto(src, w, h, crop) {
  if (!src || !/^https?:\/\//i.test(src)) return src
  const pic = src.match(/picsum\.photos\/id\/(\d+)\/(\d+)\/(\d+)\.jpg$/i)
  if (pic) {
    const id = pic[1]
    let hh = h
    if (!hh) hh = crop ? Math.round(Number(w) * 0.75) : Math.round((Number(w) * 9) / 16)
    return `https://picsum.photos/id/${id}/${w}/${hh}.jpg`
  }
  if (!/images\.unsplash\.com/i.test(src)) return src
  try {
    const u = new URL(src)
    u.searchParams.set('auto', 'format')
    u.searchParams.set('w', String(w))
    if (h) u.searchParams.set('h', String(h))
    else u.searchParams.delete('h')
    if (crop) u.searchParams.set('fit', 'crop')
    else u.searchParams.delete('fit')
    u.searchParams.set('q', '82')
    return u.toString()
  } catch {
    return src
  }
}

function applyBrandLockup(customName) {
  const els = document.querySelectorAll('#nav-brand, #foot-brand')
  const trimmed = customName && String(customName).trim()
  if (trimmed) {
    els.forEach((el) => {
      el.textContent = trimmed
    })
    return trimmed
  }
  els.forEach((el) => {
    el.innerHTML = BRAND_LOCKUP_HTML
  })
  return 'Local Hub'
}

async function loadBranding() {
  const tagFallback =
    window.__LOCALHUB?.platformTagline ||
    window.__SOKO?.platformTagline ||
    'Your city, delivered.'

  if (shouldUsePlaceholders()) {
    const customName = window.__LOCALHUB?.platformName || window.__SOKO?.platformName
    const name = applyBrandLockup(customName)
    const tag =
      window.__LOCALHUB?.platformTagline ||
      window.__SOKO?.platformTagline ||
      'Your city, delivered.'
    const ft = document.getElementById('foot-tag')
    if (ft) ft.textContent = tag
    document.title = `${name} — ${tag}`
    return
  }
  const { data } = await supabase.from('platform_settings').select('key,value')
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]))
  const name = applyBrandLockup(map.platform_name)
  const tag = map.platform_tagline || tagFallback
  const ft = document.getElementById('foot-tag')
  if (ft) ft.textContent = tag
  document.title = `${name} — ${tag}`
}

function renderVendorCard(v) {
  const online = v.is_online
  const banner = v.banner_url || ''
  const ph = banner ? '' : bannerFallbackClass(v.category)

  const bannerSrc =
    banner && (/picsum\.photos/i.test(banner) || /images\.unsplash\.com/i.test(banner))
      ? sizedPhoto(banner, 1600, 900, false)
      : banner
  const bannerInner = banner
    ? `<img src="${bannerSrc}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"
        sizes="(max-width: 1280px) 100vw, 1280px" width="1600" height="900" />`
    : `<div class="vendor-card__ph ${ph}" aria-hidden="true"></div>`

  const logoUrl =
    v.logo_url &&
    (/picsum\.photos/i.test(v.logo_url) || /images\.unsplash\.com/i.test(v.logo_url))
      ? sizedPhoto(v.logo_url, 256, 256, true)
      : v.logo_url
  const logoOverlay = logoUrl
    ? `<img class="vendor-card__logo" src="${logoUrl}" alt="" width="56" height="56" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
    : ''

  const statusBadge = online
    ? `<span class="badge badge-online"><span class="online-dot" aria-hidden="true"></span> Open</span>`
    : `<span class="badge badge-offline">Offline</span>`

  const skin = themeForVendor(v)
  const tag = (v.tagline || v.description || '').trim()

  return `
    <a class="vendor-card lh-card-mount" href="${vendorPageHref(v.slug)}" data-vendor-id="${v.id}" data-shop-skin="${skin}">
      <div class="vendor-card__banner">
        ${bannerInner}
        ${logoOverlay}
      </div>
      <div class="vendor-card__body">
        <div class="vendor-card__name">${v.name}</div>
        ${tag ? `<p class="vendor-card__tagline">${tag}</p>` : ''}
        <div class="vendor-card__meta">
          ${v.category ? `<span class="badge badge-cat">${v.category}</span>` : ''}
          ${v.area ? `<span class="text-muted">${v.area}</span>` : ''}
          <span class="badge badge-cat badge-cat--ghost">${skin}</span>
        </div>
        <div>${statusBadge}</div>
      </div>
    </a>
  `
}

function renderProductCard(p) {
  const img = p.images?.[0]?.url
  const vendor = p.vendors
  const slug = vendor?.slug || ''
  const href = slug ? vendorPageHref(slug) : '#'
  return `
    <article class="product-card lh-card-mount">
      <a href="${href}" class="product-card__img">
        ${img ? `<img src="${img}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : `<div class="product-img-ph"></div>`}
        <div class="product-img-grad"></div>
      </a>
      <div class="product-card__body">
        <h3 class="product-card__title">${p.title}</h3>
        ${vendor?.name ? `<p class="product-card__vendor">${vendor.name}</p>` : ''}
        <div class="product-card__footer">
          <span class="price">${formatPrice(p.price)}</span>
        </div>
      </div>
    </article>
  `
}

async function loadHomeFromDemo(cat = 'all') {
  const vendors = filterPlaceholderVendors(cat)
  const products =
    cat === 'all'
      ? [...placeholderProducts].slice(0, 48)
      : placeholderProducts.filter((p) => {
          const vid = p.vendor_id
          return vendors.some((v) => v.id === vid)
        })

  const vHost = document.getElementById('vendors-grid')
  if (vHost) {
    vHost.innerHTML = vendors.length
      ? vendors.map(renderVendorCard).join('')
      : `<div class="empty-state">No vendors in this category in the preview set.</div>`
  }

  const pHost = document.getElementById('products-grid')
  if (pHost) {
    pHost.innerHTML = products.length
      ? products.map(renderProductCard).join('')
      : `<div class="empty-state">No products in this category.</div>`
  }

  document.querySelectorAll('.pill').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === cat)
  })

  wireImgFallbacks(document.getElementById('browse'))
}

async function loadHome(cat = 'all') {
  if (shouldUsePlaceholders()) {
    await loadHomeFromDemo(cat)
    return
  }

  let vendorsQuery = supabase
    .from('vendors')
    .select('*')
    .eq('is_approved', true)
    .eq('is_suspended', false)
    .order('created_at', { ascending: false })
    .limit(48)

  if (cat && cat !== 'all') {
    vendorsQuery = vendorsQuery.eq('category', cat)
  }

  const productsQuery = supabase
    .from('products')
    .select('*, vendors(name, slug)')
    .eq('is_available', true)
    .eq('is_featured', true)
    .limit(36)

  const [{ data: vendors }, prodRes] = await Promise.all([
    vendorsQuery,
    productsQuery,
  ])

  let products = prodRes.data
  if (!products?.length) {
    const { data: anyProducts } = await supabase
      .from('products')
      .select('*, vendors(name, slug)')
      .eq('is_available', true)
      .limit(36)
    products = anyProducts || []
  }

  const vHost = document.getElementById('vendors-grid')
  if (vHost) {
    vHost.innerHTML =
      vendors && vendors.length
        ? vendors.map(renderVendorCard).join('')
        : `<div class="empty-state">No vendors yet. <a href="${resolveAppPath('onboarding.html')}">Apply to sell</a>.</div>`
  }

  const pHost = document.getElementById('products-grid')
  if (pHost) {
    pHost.innerHTML =
      products && products.length
        ? products.map(renderProductCard).join('')
        : `<div class="empty-state">Featured picks go here once products are marked featured.</div>`
  }

  document.querySelectorAll('.pill').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === cat)
  })

  wireImgFallbacks(document.getElementById('browse'))
}

/** Category chips on the standalone vendors page (`#vendors-directory`). */
function setVendorsDirectoryPillsActive(cat) {
  const root = document.getElementById('vendors-directory')
  if (!root) return
  root.querySelectorAll('.pill[data-cat]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === cat)
  })
}

/**
 * Customer-only view: all approved vendors as a grid (demo or Supabase).
 * Used by [`vendors.html`](../vendors.html).
 */
export async function loadVendorsDirectory(cat = 'all') {
  const vHost = document.getElementById('vendors-directory-grid')
  if (!vHost) return

  if (shouldUsePlaceholders()) {
    const vendors = filterPlaceholderVendors(cat)
    vHost.innerHTML = vendors.length
      ? vendors.map(renderVendorCard).join('')
      : `<div class="empty-state">No vendors in this category in the preview set.</div>`
    setVendorsDirectoryPillsActive(cat)
    wireImgFallbacks(document.getElementById('vendors-directory') || document.body)
    return
  }

  let vendorsQuery = supabase
    .from('vendors')
    .select('*')
    .eq('is_approved', true)
    .eq('is_suspended', false)
    .order('created_at', { ascending: false })
    .limit(96)

  if (cat && cat !== 'all') {
    vendorsQuery = vendorsQuery.eq('category', cat)
  }

  const { data: vendors } = await vendorsQuery
  vHost.innerHTML =
    vendors && vendors.length
      ? vendors.map(renderVendorCard).join('')
      : `<div class="empty-state">No vendors yet. <a href="${resolveAppPath('onboarding.html')}">Apply to sell</a>.</div>`

  setVendorsDirectoryPillsActive(cat)
  wireImgFallbacks(document.getElementById('vendors-directory') || document.body)
}

export function wireVendorsDirectoryPills() {
  const root = document.getElementById('vendors-directory')
  if (!root) return
  root.querySelectorAll('.pill[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat') || 'all'
      loadVendorsDirectory(cat)
      trackEvent('page_view', { payload: { page: 'vendors', section: 'category', cat } })
    })
  })
}

export function wireVendorsDirectorySearch() {
  const input = document.getElementById('vendors-directory-search')
  const vHost = document.getElementById('vendors-directory-grid')
  const root = document.getElementById('vendors-directory')
  if (!input || !vHost || !root) return

  let t = null
  input.addEventListener('input', () => {
    clearTimeout(t)
    t = setTimeout(async () => {
      const q = input.value.trim()
      if (q.length < 2) {
        await loadVendorsDirectory('all')
        return
      }

      root.querySelectorAll('.pill[data-cat]').forEach((b) => b.classList.remove('active'))
      root.querySelector('.pill[data-cat="all"]')?.classList.add('active')

      if (shouldUsePlaceholders()) {
        const vendors = searchPlaceholderVendors(q)
        vHost.innerHTML = vendors.length
          ? vendors.map(renderVendorCard).join('')
          : `<div class="empty-state">No matches for “${escapeHtml(q)}” in preview data.</div>`
        wireImgFallbacks(root)
        return
      }

      const safe = q.replace(/[%_,]/g, '')
      const pattern = `%${safe}%`
      const { data: vendors } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_approved', true)
        .eq('is_suspended', false)
        .or(`name.ilike.${pattern},area.ilike.${pattern},category.ilike.${pattern}`)
        .limit(96)

      vHost.innerHTML =
        vendors && vendors.length
          ? vendors.map(renderVendorCard).join('')
          : `<div class="empty-state">No matches for “${escapeHtml(q)}”.</div>`
      wireImgFallbacks(root)
    }, 300)
  })
}

/** Standalone vendors directory page bootstrap. */
export async function bootVendorsPage() {
  injectPreviewChrome()
  await loadInto('#nav-slot', '/partials/nav.html')
  await loadInto('#footer-slot', '/partials/footer.html')
  await loadBranding()
  document.title = `Vendors — ${document.title}`
  updateCartBadge()
  await loadVendorsDirectory('all')
  wireVendorsDirectoryPills()
  wireVendorsDirectorySearch()
  trackEvent('page_view', { payload: { page: 'vendors_directory' } })
}

function setupCategoryPills() {
  document.querySelectorAll('.pill[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat') || 'all'
      loadHome(cat)
      trackEvent('page_view', { payload: { section: 'category', cat } })
    })
  })
}

function setupSearch() {
  const input = document.getElementById('home-search')
  if (!input) return
  let t = null
  input.addEventListener('input', () => {
    clearTimeout(t)
    t = setTimeout(async () => {
      const q = input.value.trim()
      if (q.length < 2) {
        await loadHome('all')
        return
      }

      if (shouldUsePlaceholders()) {
        const vendors = searchPlaceholderVendors(q)
        const vHost = document.getElementById('vendors-grid')
        if (vHost) {
          vHost.innerHTML = vendors.length
            ? vendors.map(renderVendorCard).join('')
            : `<div class="empty-state">No matches for “${q}” in preview data.</div>`
        }
        wireImgFallbacks(document.getElementById('browse'))
        return
      }

      const safe = q.replace(/[%_,]/g, '')
      const pattern = `%${safe}%`
      const { data: vendors } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_approved', true)
        .eq('is_suspended', false)
        .or(`name.ilike.${pattern},area.ilike.${pattern},category.ilike.${pattern}`)
        .limit(48)

      const vHost = document.getElementById('vendors-grid')
      if (vHost) {
        vHost.innerHTML =
          vendors && vendors.length
            ? vendors.map(renderVendorCard).join('')
            : `<div class="empty-state">No matches for “${q}”.</div>`
      }
      wireImgFallbacks(document.getElementById('browse'))
    }, 300)
  })
}

function setupScrollReveal() {
  const roots = [...document.querySelectorAll('.lh-scroll-reveal')]
  if (!roots.length) return

  const enable = () => {
    roots.forEach((el) => el.classList.add('lh-scroll-reveal--on'))
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    enable()
    return
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('lh-scroll-reveal--on')
        obs.unobserve(e.target)
      }
    },
    { rootMargin: '140px 0px 140px', threshold: 0.02 }
  )
  roots.forEach((el) => io.observe(el))
}

function flushAuthGateReject() {
  try {
    const raw = sessionStorage.getItem('lh_gate_reject')
    if (!raw) return
    sessionStorage.removeItem('lh_gate_reject')
    const o = JSON.parse(raw)
    const adminNeeded =
      Array.isArray(o.allowed) && o.allowed.includes('super_admin')
    if (o.kind === 'no_profile')
      showToast(
        adminNeeded
          ? 'No profile row yet. In Supabase → SQL Editor: open the file 005_backfill_profiles_fix_trigger.sql in this repo, select ALL the SQL, paste into the editor, Run (do not paste the file path). Reload, then open /admin.'
          : 'No profile row yet. The owner should paste the SQL from 005_backfill_profiles_fix_trigger.sql into Supabase SQL Editor—copy the code, not the filename.',
        'warning'
      )
    else if (o.kind === 'profiles_api_error')
      showToast(
        `Profile reads are blocked (${o.detail || 'permission error'}). In Supabase → SQL paste and run EVERY line from migrations/006_postgrest_grants_public.sql then reload.`,
        'warning'
      )
    else if (o.kind === 'wrong_role' && adminNeeded)
      showToast(
        `This account is "${o.got_role || 'customer'}" · /admin needs super_admin in public.profiles.`,
        'warning'
      )
    else if (o.kind === 'wrong_role')
      showToast('Signed in · this page needs a permission you do not have yet.', 'warning')
  } catch {
    sessionStorage.removeItem('lh_gate_reject')
  }
}

async function bootHome() {
  flushAuthGateReject()
  injectPreviewChrome()
  await loadInto('#nav-slot', '/partials/nav.html')
  await loadInto('#footer-slot', '/partials/footer.html')
  await loadBranding()
  updateCartBadge()
  await loadHome('all')
  wireImgFallbacks(document.querySelector('main'))

  const preview = document.getElementById('lh-discovery-preview')
  if (preview) {
    if (shouldUsePlaceholders()) {
      preview.hidden = false
      renderGhostShowcase()
      bootVendorDiscoveryMap().catch(console.error)
    }
  }

  setupCategoryPills()
  setupSearch()
  setupScrollReveal()

  if (shouldUsePlaceholders()) {
    const foot = document.querySelector('.footer-site')
    if (foot) {
      const linkRow = document.createElement('p')
      linkRow.className = 'text-muted mt-2'
      linkRow.style.fontSize = '0.82rem'
      linkRow.innerHTML =
        `${placeholderVendors.length} preview shops · try ` +
        `<a href="${vendorPageHref('westlands-streetwear')}">Westlands Streetwear</a>, ` +
        `<a href="${vendorPageHref('karen-organic-patch')}">Karen Organic</a>, ` +
        `<a href="${vendorPageHref('kilimani-living-co')}">Kilimani Living</a>, ` +
        `<a href="${vendorPageHref('south-b-fish-co')}">South B Fish Co</a>, ` +
        `<a href="${vendorPageHref('muthaiga-run-club')}">Muthaiga Run Club</a>`
      foot.appendChild(linkRow)
    }
  }

  trackEvent('page_view', { payload: { page: 'home' } })
}

export { bootHome }
