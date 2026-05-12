/**
 * Demo catalog for local preview (no Supabase required).
 * 26 vendors × varied categories · ~106 demo products — retail-themed Unsplash + small Picsum avatars.
 * Prices: KES cents (250000 → Ksh 2,500).
 *
 * ── Where to customise (see also CUSTOMIZATION.md in repo root) ─────────
 * · Shop list:        `placeholderVendors` — edit `V(...)` rows (name, tagline, description, story,
 *                      category, area, theme, banner, logo). Each row is one fake shop.
 * · Product grid:     `placeholderProducts` — each `demoProduct(seq, 'vendor-slug', { ... })`.
 *                      Swap `title`, `description`, `price`; images use `catalogImg(seq)` by default.
 * · Product photos:   `RETAIL_CATALOG_SLUGS` + `catalogImg()` — Unsplash slugs that rotate by `seq`.
 *                      Or set a full URL in `images: [{ url: 'https://…', alt: '…' }]`.
 * · Shop banners:     `BANNER_*` constants / per-vendor `retailWide('photo-…', 1600, 900)`.
 * · Logos (small):    `L(n)` — Lorem Picsum ids (stable thumbs only).
 * · Map pins:         `.map()` adds `map_lat` / `map_lng` from `AREA_GEO` + jitter (demo only).
 * · External link:    `.map()` sets `website_url` (fictional URLs in preview; real URLs from Supabase).
 */

const P_STOCK = 'https://picsum.photos'

/** Lorem Picsum `/id/` URLs stay valid long-term — used only for avatar thumbnails here. */
function stock(id, w, h) {
  return `${P_STOCK}/id/${id}/${w}/${h}.jpg`
}

/** Unsplash retail/editorial imagery (IDs verified live). */
function retailWide(slug, w, h) {
  return `https://images.unsplash.com/${slug}?auto=format&fit=crop&w=${w}&h=${h}&q=82`
}

/** Square product thumbnails — rotates by demo `demoProduct(seq, …)` index. */
const RETAIL_CATALOG_SLUGS = [
  'photo-1445205170230-053b83016050',
  'photo-1469334031218-e382a71b716b',
  'photo-1441984904996-e0b6ba687e04',
  'photo-1556742049-0cfed4f6a45d',
  'photo-1521572163474-6864f9cf17ab',
  'photo-1534452203293-494d7ddbf7e0',
  'photo-1522337360788-8b13dee7a37e',
  'photo-1503951914875-452162b0f3f1',
  'photo-1542838132-92c53300491e',
  'photo-1556910103-1c02745aae4d',
  'photo-1490481651871-ab68de25d43d',
  'photo-1552374196-c4e7ffc6e126',
  'photo-1517245386807-bb43f82c33c4',
  'photo-1507679799987-c73779587ccf',
  'photo-1586023492125-27b2c045efd7',
  'photo-1558618666-fcd25c85cd64',
]

function catalogImg(productSeq) {
  const seq = Number(productSeq)
  const len = RETAIL_CATALOG_SLUGS.length
  const i = ((seq - 1) % len + len) % len
  return retailWide(RETAIL_CATALOG_SLUGS[i], 800, 800)
}

// ── Shared banner imagery — retail storefronts ──────────
const BANNER_FASHION = retailWide('photo-1445205170230-053b83016050', 1600, 900)
const BANNER_FASHION_2 = retailWide('photo-1469334031218-e382a71b716b', 1600, 900)
const BANNER_FASHION_3 = retailWide('photo-1534452203293-494d7ddbf7e0', 1600, 900)
const BANNER_FASHION_4 = retailWide('photo-1490481651871-ab68de25d43d', 1600, 900)
const BANNER_GREEN = retailWide('photo-1542838132-92c53300491e', 1600, 900)
const BANNER_GREEN_2 = retailWide('photo-1618221195710-dd6b41faaea6', 1600, 900)
const BANNER_GREEN_3 = retailWide('photo-1556742049-0cfed4f6a45d', 1600, 900)
const BANNER_KITCHEN = retailWide('photo-1556910103-1c02745aae4d', 1600, 900)
const BANNER_SERVICE = retailWide('photo-1517245386807-bb43f82c33c4', 1600, 900)
const BANNER_SERVICE_2 = retailWide('photo-1552374196-c4e7ffc6e126', 1600, 900)
const BANNER_SERVICE_3 = retailWide('photo-1522337360788-8b13dee7a37e', 1600, 900)
const BANNER_HOME = retailWide('photo-1586023492125-27b2c045efd7', 1600, 900)
const BANNER_HOME_2 = retailWide('photo-1618221195710-dd6b41faaea6', 1600, 900)
const BANNER_HOME_3 = retailWide('photo-1558618666-fcd25c85cd64', 1600, 900)
/** Project showcase storefronts — Simply Stylish boutique + Trim barbershop */
const BANNER_SIMPLY_STYLISH = retailWide('photo-1552374196-c4e7ffc6e126', 1600, 900)
const BANNER_TRIM_BARBER = retailWide('photo-1503951914875-452162b0f3f1', 1600, 900)

/** Vendor logo thumbnail — one id per vendor (stable picsum avatar). */
const L = (n) => stock(120 + n, 256, 256)

/** Skins map to CSS: vendor-skin--{id} */
export const SHOP_SKINS = ['atlas', 'ember', 'verdant', 'tide', 'dune', 'noir']

export function themeForVendor(v) {
  const t = v?.shop_theme
  if (t && SHOP_SKINS.includes(t)) return t
  const fallback = { fashion: 'ember', groceries: 'verdant', services: 'atlas', household: 'dune' }
  return fallback[v?.category] || 'atlas'
}

function V(
  n,
  slug,
  name,
  tagline,
  description,
  story,
  category,
  area,
  theme,
  banner,
  logo,
  online = true
) {
  const vid = `a1000000-0000-4000-8000-${String(n).padStart(12, '0')}`
  return {
    id: vid,
    owner_id: null,
    slug,
    name,
    tagline,
    description,
    story,
    category,
    area,
    address: `${area} · Nairobi`,
    whatsapp: `254712${String(n).padStart(5, '0')}`,
    hours: { mon: '9–7', sat: '10–6' },
    logo_url: logo,
    banner_url: banner,
    shop_theme: theme,
    is_online: online,
    is_approved: true,
    is_suspended: false,
    commission_rate: 10,
  }
}

/** Nairobi neighbourhood centroids → map pins + tiny jitter applied on export */
const AREA_GEO = {
  Westlands: [-1.267, 36.806],
  Kilimani: [-1.288, 36.787],
  Lavington: [-1.275, 36.764],
  Eastleigh: [-1.275, 36.849],
  Muthaiga: [-1.255, 36.817],
  'Ngong Road': [-1.303, 36.743],
  Kileleshwa: [-1.28, 36.783],
  Karen: [-1.32, 36.717],
  'South B': [-1.3, 36.849],
  Ruaka: [-1.203, 36.783],
  Roysambu: [-1.208, 36.873],
  Langata: [-1.342, 36.743],
  CBD: [-1.284, 36.817],
  Hurlingham: [-1.295, 36.783],
  'South C': [-1.312, 36.834],
  Parklands: [-1.266, 36.817],
  Buruburu: [-1.294, 36.884],
}

const NAIROBI_DEFAULT = [-1.284, 36.817]

export const placeholderVendors = [
  // Fashion ×6
  V(1, 'westlands-streetwear', 'Westlands Streetwear', 'CBD same-day · limited runs', 'Street-ready layers and sneakers.', 'Weekend pop-up roots on Sarit lane — now a full digital storefront.', 'fashion', 'Westlands', 'ember', BANNER_FASHION, L(1)),
  V(2, 'kilimani-atelier', 'Kilimani Atelier', 'Tailored silhouettes · fittings', 'Made-to-measure jackets and occasion wear.', 'Two tailors, one fitting room that smells like chalk and ambition.', 'fashion', 'Kilimani', 'noir', BANNER_FASHION_2, L(2)),
  V(3, 'lavington-vintage', 'Lavington Vintage Rooms', 'Curated deadstock · 90s energy', 'Denim, leather, and rare tees.', 'We crate-dig so you do not have to.', 'fashion', 'Lavington', 'dune', BANNER_FASHION_3, L(3)),
  V(4, 'eastleigh-textile-lab', 'Eastleigh Textile Lab', 'Kitenge · custom cuts', 'Bold prints for events and everyday.', 'Family-run cutters who speak three languages fluently.', 'fashion', 'Eastleigh', 'verdant', BANNER_FASHION_4, L(4)),
  V(5, 'muthaiga-run-club', 'Muthaiga Run Club Supply', 'Performance · recovery', 'Technical wear for red-soil miles.', 'Born on the loop — not the runway.', 'fashion', 'Muthaiga', 'tide', retailWide('photo-1521572163474-6864f9cf17ab', 1600, 900), L(5)),
  V(6, 'ngong-denim-works', 'Ngong Road Denim Works', 'Raw selvedge · hemming bar', 'Repair, taper, and small-batch jeans.', 'We wash cold and mend honest tears.', 'fashion', 'Ngong Road', 'atlas', retailWide('photo-1490481651871-ab68de25d43d', 1600, 900), L(6)),

  // Groceries ×6
  V(7, 'kileleshwa-greens', 'Kileleshwa Greens', 'Farm boxes · cold-pressed', 'Produce within 50km where possible.', 'Morning pack line — you taste the difference by 10 a.m.', 'groceries', 'Kileleshwa', 'verdant', BANNER_GREEN, L(7)),
  V(8, 'karen-organic-patch', 'Karen Organic Patch', 'Heirloom veg · subscription', 'Seasonal crates with recipe cards.', 'Soil-first farming with an overly serious compost pile.', 'groceries', 'Karen', 'verdant', BANNER_GREEN_2, L(8)),
  V(9, 'south-b-fish-co', 'South B Fish Co', 'Daily catch · ice chain', 'Ocean fish and lake tilapia — handled fast.', 'Dock timing beats kitchen timing.', 'groceries', 'South B', 'tide', retailWide('photo-1542838132-92c53300491e', 1600, 900), L(9)),
  V(10, 'ruaka-morning-harvest', 'Ruaka Morning Harvest', 'Dairy · eggs · greens', 'Sunrise drops for apartments and offices.', 'We know your lobby guard by name.', 'groceries', 'Ruaka', 'ember', BANNER_GREEN_3, L(10)),
  V(11, 'thika-spice-mercantile', 'Thika Road Spice Mercantile', 'Whole spices · house blends', 'Garam, berbere, and curry leaves in bulk.', 'Aroma that hits before you open the door.', 'groceries', 'Roysambu', 'dune', BANNER_KITCHEN, L(11)),
  V(12, 'langata-herb-co', 'Langata Herb Co', 'Microgreens · pestos', 'Small leaves, big flavour windows.', 'Glasshouse nerds with scissors.', 'groceries', 'Langata', 'noir', retailWide('photo-1556910103-1c02745aae4d', 1600, 900), L(12)),

  // Services ×6
  V(13, 'cbd-crafts-studio', 'CBD Crafts Studio', 'Embroidery · signage · rush', 'Same-week merch for teams and drops.', 'Two printers, one embroidery head — zero excuses.', 'services', 'CBD', 'atlas', BANNER_SERVICE, L(13), false),
  V(14, 'westlands-brand-film', 'Westlands Brand Film', 'Product spots · social cuts', '15s–60s content with colour grade.', 'We light bottles like they pay rent.', 'services', 'Westlands', 'noir', BANNER_SERVICE_2, L(14)),
  V(15, 'hurlingham-bake-school', 'Hurlingham Bake School', 'Weekend classes · sourdough', 'Small groups, big ovens.', 'Flour on the floor is part of the syllabus.', 'services', 'Hurlingham', 'ember', retailWide('photo-1517245386807-bb43f82c33c4', 1600, 900), L(15)),
  V(16, 'lavington-handy-crew', 'Lavington Handy Crew', 'Install · paint · quick fixes', 'Polite craftsmen, photographed finishes.', 'We bring shoe covers and level spirits.', 'services', 'Lavington', 'dune', BANNER_SERVICE_3, L(16)),
  V(17, 'south-c-portrait-lab', 'South C Portrait Lab', 'Headshots · family · CV snaps', 'Natural light studio with props wall.', 'We make anxious people look intentional.', 'services', 'South C', 'tide', retailWide('photo-1507679799987-c73779587ccf', 1600, 900), L(17)),
  V(18, 'karen-event-styling', 'Karen Event Styling', 'Floral · table · mood', 'Day-of styling with vendor coordination.', 'We sweat the linen fold you will Instagram.', 'services', 'Karen', 'verdant', retailWide('photo-1522337360788-8b13dee7a37e', 1600, 900), L(18)),

  // Household ×6
  V(19, 'kilimani-living-co', 'Kilimani Living Co', 'Sofas · rugs · calm palettes', 'Pieces chosen for rental upgrades and forever homes.', 'We sit on every sample first.', 'household', 'Kilimani', 'dune', BANNER_HOME, L(19)),
  V(20, 'south-b-lumen', 'South B Lumen', 'Pendant · smart bulbs · install', 'Warm light plans for open plans.', 'Lux is not the bulb — it is the layer.', 'household', 'South B', 'ember', retailWide('photo-1586023492125-27b2c045efd7', 1600, 900), L(20)),
  V(21, 'westlands-soft-loom', 'Westlands Soft Loom', 'Linen · throws · bed stories', 'Textures you actually sleep in.', 'Thread count honesty policy.', 'household', 'Westlands', 'tide', BANNER_HOME_2, L(21)),
  V(22, 'parklands-metal-studio', 'Parklands Metal Studio', 'Custom shelving · brass details', 'Welded and brushed in-house.', 'Sparks optional. Measurements not.', 'household', 'Parklands', 'atlas', retailWide('photo-1558618666-fcd25c85cd64', 1600, 900), L(22)),
  V(23, 'buru-woodworks', 'Buru Woodworks', 'Dining tables · stools', 'Solid wood with soft-close drawers.', 'Grain direction is a hill we die on.', 'household', 'Buruburu', 'noir', retailWide('photo-1586023492125-27b2c045efd7', 1600, 900), L(23)),
  V(24, 'roysambu-scent-studio', 'Roysambu Scent Studio', 'Diffusers · room rituals', 'Kenyan botanicals with quiet throw.', 'If it smells like a lobby, we start over.', 'household', 'Roysambu', 'verdant', BANNER_HOME_3, L(24)),

  // Live project showcases
  V(25, 'simply-stylish', 'Simply Stylish', 'Capsule drops · tailoring bar', 'Wardrobe builders and wardrobe refreshers.', 'Pieces you actually re-wear — neutral bases, one statement each rack.', 'fashion', 'Parklands', 'ember', BANNER_SIMPLY_STYLISH, L(25)),
  V(26, 'trim', 'Trim', 'Fades · blends · beard lines', 'Bookable chairs — walk-ins when the light is green.', 'Clipper-positive. Consultation compulsory.', 'services', 'Westlands', 'atlas', BANNER_TRIM_BARBER, L(26)),
].map((v, i) => {
  const base = AREA_GEO[v.area] || NAIROBI_DEFAULT
  const jitter = ((i % 13) - 6) * 0.0032
  return {
    ...v,
    map_lat: base[0] + jitter * 0.35,
    map_lng: base[1] + jitter,
    /** Fictional brand URL for ghost-demo links; prod uses DB `vendors.website_url` (see CUSTOMIZATION.md). */
    website_url: `https://${v.slug}.shops.demo`,
  }
})

const bySlug = Object.fromEntries(placeholderVendors.map((v) => [v.slug, v]))
const byId = Object.fromEntries(placeholderVendors.map((v) => [v.id, v]))

/** Stable demo product rows: seq → id, vendor_slug → vendor_id + vendors join. */
export function demoProduct(seq, vendorSlug, fields) {
  const v = bySlug[vendorSlug]
  if (!v) throw new Error(`demoProduct: unknown vendor slug "${vendorSlug}"`)
  const id = `b2000000-0000-4000-8000-${String(seq).padStart(12, '0')}`
  return {
    ...fields,
    id,
    vendor_id: v.id,
    vendors: { name: v.name, slug: v.slug },
  }
}

export const placeholderProducts = [
  demoProduct(1, 'westlands-streetwear', { title: 'Oversized tee — Black', slug: 'tee-black', description: 'Heavy 240gsm cotton · dropped shoulder · unisex S–XL.', price: 320000, images: [{ url: catalogImg(1), alt: 'Black T-shirt' }], inventory: 34, is_available: true, is_featured: true, compare_price: 380000 }),
  demoProduct(2, 'westlands-streetwear', { title: 'Retro runner — Bone', slug: 'runner-bone', description: 'Mesh upper · EVA mid · daily miles.', price: 1120000, images: [{ url: catalogImg(2), alt: 'Sneakers' }], inventory: 9, is_available: true, is_featured: true }),
  demoProduct(3, 'westlands-streetwear', { title: 'Canvas 6-panel cap', slug: 'cap-canvas', description: 'Forest green · brass clasp · deep fit.', price: 219000, images: [{ url: catalogImg(3), alt: 'Cap' }], inventory: 42, is_available: true, is_featured: true }),
  demoProduct(4, 'westlands-streetwear', { title: 'Fleece zip hoodie', slug: 'hoodie-zip', description: 'Mid-weight · raglan · YKK zip.', price: 485000, images: [{ url: catalogImg(4), alt: 'Hoodie' }], inventory: 18, is_available: true, is_featured: false }),
  demoProduct(5, 'westlands-streetwear', { title: 'Relaxed cargo pant', slug: 'cargo-sand', description: 'Taper leg · 6 pocket · cotton twill.', price: 675000, images: [{ url: catalogImg(5), alt: 'Cargo pants' }], inventory: 14, is_available: true, is_featured: true }),
  demoProduct(6, 'kilimani-atelier', { title: 'Linen blazer — MTM', slug: 'blazer-mtm', description: 'Two fittings · half-canvas · choice of lining.', price: 2850000, images: [{ url: catalogImg(6), alt: 'Blazer' }], inventory: 6, is_available: true, is_featured: true }),
  demoProduct(7, 'kilimani-atelier', { title: 'Straight trousers — wool', slug: 'trousers-wool', description: 'Flat front · cuffs by measurement.', price: 1950000, images: [{ url: catalogImg(7), alt: 'Trousers' }], inventory: 8, is_available: true, is_featured: true }),
  demoProduct(8, 'kilimani-atelier', { title: 'Shirt dress — silk touch', slug: 'shirt-dress', description: 'Belted midi · mother-of-pearl buttons.', price: 1650000, images: [{ url: catalogImg(8), alt: 'Dress' }], inventory: 5, is_available: true, is_featured: false }),
  demoProduct(9, 'kilimani-atelier', { title: 'Alterations voucher', slug: 'alter-voucher', description: 'Hem · waist · sleeve — quoted in studio.', price: 80000, images: [{ url: catalogImg(9), alt: 'Sewing' }], inventory: 99, is_available: true, is_featured: true }),
  demoProduct(10, 'lavington-vintage', { title: '90s leather bomber', slug: 'bomber-leather', description: 'Italian hide · quilted lining · one-off.', price: 4850000, images: [{ url: catalogImg(10), alt: 'Leather jacket' }], inventory: 1, is_available: true, is_featured: true }),
  demoProduct(11, 'lavington-vintage', { title: 'Vintage denim trucker', slug: 'denim-trucker', description: 'Faded indigo · boxy 90s cut.', price: 2250000, images: [{ url: catalogImg(11), alt: 'Denim jacket' }], inventory: 3, is_available: true, is_featured: true }),
  demoProduct(12, 'lavington-vintage', { title: 'Oval sunglasses — tortoise', slug: 'sunnies-tort', description: 'UV400 · case included.', price: 890000, images: [{ url: catalogImg(12), alt: 'Sunglasses' }], inventory: 11, is_available: true, is_featured: false }),
  demoProduct(13, 'lavington-vintage', { title: 'Band tee — rare print', slug: 'band-tee', description: 'Single-stitch · verified era.', price: 1350000, images: [{ url: catalogImg(13), alt: 'T-shirt' }], inventory: 2, is_available: true, is_featured: true }),
  demoProduct(14, 'eastleigh-textile-lab', { title: 'Kitenge shift dress', slug: 'dress-shift', description: 'Custom length · pockets optional.', price: 980000, images: [{ url: catalogImg(14), alt: 'Dress' }], inventory: 14, is_available: true, is_featured: true }),
  demoProduct(15, 'eastleigh-textile-lab', { title: 'Men’s kitenge shirt', slug: 'shirt-kitenge', description: 'Tailored collar · slim or relaxed.', price: 1250000, images: [{ url: catalogImg(15), alt: 'Shirt' }], inventory: 10, is_available: true, is_featured: true }),
  demoProduct(16, 'eastleigh-textile-lab', { title: 'Headwrap set ×3', slug: 'wraps-3', description: 'Coordinate prints · pre-cut.', price: 390000, images: [{ url: catalogImg(16), alt: 'Headwrap' }], inventory: 25, is_available: true, is_featured: false }),
  demoProduct(17, 'eastleigh-textile-lab', { title: 'Clutch — kitenge patchwork', slug: 'clutch-patch', description: 'Inner card slots · magnetic snap.', price: 450000, images: [{ url: catalogImg(17), alt: 'Clutch' }], inventory: 17, is_available: true, is_featured: true }),
  demoProduct(18, 'muthaiga-run-club', { title: 'Carbon plate road shoe', slug: 'road-carbon', description: '5mm drop · race-day foam.', price: 2150000, images: [{ url: catalogImg(18), alt: 'Running shoe' }], inventory: 7, is_available: true, is_featured: true }),
  demoProduct(19, 'muthaiga-run-club', { title: 'Compression half tight', slug: 'tight-half', description: 'Moisture-wick · phone pocket.', price: 780000, images: [{ url: catalogImg(19), alt: 'Tights' }], inventory: 22, is_available: true, is_featured: true }),
  demoProduct(20, 'muthaiga-run-club', { title: 'Hydration vest 5L', slug: 'vest-5l', description: 'Soft flasks · bounce-free harness.', price: 1420000, images: [{ url: catalogImg(20), alt: 'Vest' }], inventory: 9, is_available: true, is_featured: false }),
  demoProduct(21, 'muthaiga-run-club', { title: 'Foam roller — 45cm', slug: 'roller-foam', description: 'High density · travel bag.', price: 420000, images: [{ url: catalogImg(21), alt: 'Roller' }], inventory: 16, is_available: true, is_featured: true }),
  demoProduct(22, 'ngong-denim-works', { title: 'Chain-stitch hem', slug: 'hem-chain', description: 'Single pair · while-you-wait slots.', price: 28000, images: [{ url: catalogImg(22), alt: 'Denim hem' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(23, 'ngong-denim-works', { title: 'Selvedge repair patch', slug: 'patch-repair', description: 'Loom-matched weave · darning.', price: 85000, images: [{ url: catalogImg(23), alt: 'Denim repair' }], inventory: -1, is_available: true, is_featured: false }),
  demoProduct(24, 'ngong-denim-works', { title: 'Rescue wash + mend', slug: 'wash-rescue', description: 'Odour strip · small hole darn.', price: 195000, images: [{ url: catalogImg(24), alt: 'Laundry' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(25, 'ngong-denim-works', { title: 'Taper from knee', slug: 'taper-knee', description: 'Re-taper silhouette · pressed.', price: 145000, images: [{ url: catalogImg(25), alt: 'Tailoring' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(26, 'kileleshwa-greens', { title: 'Hass avocado tray (10)', slug: 'hass-10', description: 'Tree-ripe · foam tray.', price: 72000, images: [{ url: catalogImg(26), alt: 'Avocados' }], inventory: 55, is_available: true, is_featured: true }),
  demoProduct(27, 'kileleshwa-greens', { title: 'Sourdough boule', slug: 'sourdough-boule', description: 'Wild yeast · scored crust.', price: 42000, images: [{ url: catalogImg(27), alt: 'Bread' }], inventory: 20, is_available: true, is_featured: true }),
  demoProduct(28, 'kileleshwa-greens', { title: 'Cold-press green juice 500ml', slug: 'juice-green', description: 'Kale · apple · ginger.', price: 35000, images: [{ url: catalogImg(28), alt: 'Juice' }], inventory: 40, is_available: true, is_featured: true }),
  demoProduct(29, 'kileleshwa-greens', { title: 'Farm egg tray (30)', slug: 'eggs-30', description: 'Free-range brown · date-stamped.', price: 110000, images: [{ url: catalogImg(29), alt: 'Eggs' }], inventory: 30, is_available: true, is_featured: false }),
  demoProduct(30, 'kileleshwa-greens', { title: 'Mixed salad box (family)', slug: 'salad-family', description: 'Washed · dressing on side.', price: 65000, images: [{ url: catalogImg(30), alt: 'Salad' }], inventory: 18, is_available: true, is_featured: true }),
  demoProduct(31, 'karen-organic-patch', { title: 'Heirloom tomato crate 6kg', slug: 'tomatoes-6kg', description: 'Vine-ripened · colour mix.', price: 138000, images: [{ url: catalogImg(31), alt: 'Tomatoes' }], inventory: 15, is_available: true, is_featured: true }),
  demoProduct(32, 'karen-organic-patch', { title: 'Rainbow chard bunch ×2', slug: 'chard-2', description: 'Stems for stock · leaves for sauté.', price: 28000, images: [{ url: catalogImg(32), alt: 'Chard' }], inventory: 40, is_available: true, is_featured: false }),
  demoProduct(33, 'karen-organic-patch', { title: 'Weekly veg box — trial', slug: 'box-trial', description: 'Feeds 2 · first week promo.', price: 220000, images: [{ url: catalogImg(33), alt: 'Vegetable box' }], inventory: 25, is_available: true, is_featured: true }),
  demoProduct(34, 'karen-organic-patch', { title: 'House pesto 250g', slug: 'pesto-jar', description: 'Basil · pine nut · EVOO.', price: 48000, images: [{ url: catalogImg(34), alt: 'Pesto' }], inventory: 22, is_available: true, is_featured: true }),
  demoProduct(35, 'south-b-fish-co', { title: 'Ocean prawns — 1kg IQF', slug: 'prawns-1kg', description: 'Head-off · deveined · ice chain.', price: 295000, images: [{ url: catalogImg(35), alt: 'Prawns' }], inventory: 14, is_available: true, is_featured: true }),
  demoProduct(36, 'south-b-fish-co', { title: 'Tilapia fillet — 2kg', slug: 'tilapia-2kg', description: 'Lake-farmed · skin-on.', price: 198000, images: [{ url: catalogImg(36), alt: 'Fish fillet' }], inventory: 10, is_available: true, is_featured: true }),
  demoProduct(37, 'south-b-fish-co', { title: 'Smoked salmon 400g', slug: 'salmon-400', description: 'Cold-smoked · sliced.', price: 285000, images: [{ url: catalogImg(37), alt: 'Salmon' }], inventory: 7, is_available: true, is_featured: true }),
  demoProduct(38, 'south-b-fish-co', { title: 'Calamari rings 500g', slug: 'calamari-500', description: 'Blanched · cook 90s.', price: 175000, images: [{ url: catalogImg(38), alt: 'Calamari' }], inventory: 12, is_available: true, is_featured: false }),
  demoProduct(39, 'ruaka-morning-harvest', { title: 'Office fruit bundle — 20 pax', slug: 'fruit-office', description: 'Seasonal mix · weekly restock.', price: 980000, images: [{ url: catalogImg(39), alt: 'Fruit' }], inventory: 8, is_available: true, is_featured: true }),
  demoProduct(40, 'ruaka-morning-harvest', { title: 'Greek yoghurt 1kg tub ×3', slug: 'yoghurt-3', description: 'Low sugar · vanilla bean.', price: 165000, images: [{ url: catalogImg(40), alt: 'Yoghurt' }], inventory: 30, is_available: true, is_featured: true }),
  demoProduct(41, 'ruaka-morning-harvest', { title: 'Mixed berries punnet 250g', slug: 'berries-250', description: 'Blueberry · strawberry · raspberry.', price: 52000, images: [{ url: catalogImg(41), alt: 'Berries' }], inventory: 24, is_available: true, is_featured: false }),
  demoProduct(42, 'ruaka-morning-harvest', { title: 'Cold milk 5L (2×2.5L)', slug: 'milk-5l', description: 'Pasteurised · glass option.', price: 120000, images: [{ url: catalogImg(42), alt: 'Milk' }], inventory: 20, is_available: true, is_featured: true }),
  demoProduct(43, 'thika-spice-mercantile', { title: 'Whole garam — 500g', slug: 'garam-500', description: 'Toast & grind to order.', price: 88000, images: [{ url: catalogImg(43), alt: 'Spices' }], inventory: 45, is_available: true, is_featured: true }),
  demoProduct(44, 'thika-spice-mercantile', { title: 'Berbere blend — 350g', slug: 'berbere-350', description: 'Mild heat · Ethiopian style.', price: 72000, images: [{ url: catalogImg(44), alt: 'Spice blend' }], inventory: 38, is_available: true, is_featured: true }),
  demoProduct(45, 'thika-spice-mercantile', { title: 'Curry leaf bunch ×5', slug: 'curry-leaves', description: 'Fresh · wrap in damp towel.', price: 15000, images: [{ url: catalogImg(45), alt: 'Herbs' }], inventory: 60, is_available: true, is_featured: false }),
  demoProduct(46, 'thika-spice-mercantile', { title: 'Cassia bark — 200g', slug: 'cassia-200', description: 'Whole quills · slow release.', price: 42000, images: [{ url: catalogImg(46), alt: 'Cinnamon' }], inventory: 33, is_available: true, is_featured: true }),
  demoProduct(47, 'langata-herb-co', { title: 'Micro mix 200g', slug: 'micro-200', description: 'Pea · radish · mustard · beet.', price: 62000, images: [{ url: catalogImg(47), alt: 'Microgreens' }], inventory: 35, is_available: true, is_featured: true }),
  demoProduct(48, 'langata-herb-co', { title: 'Living basil punnet ×4', slug: 'basil-4', description: 'Hydro · snip as needed.', price: 55000, images: [{ url: catalogImg(48), alt: 'Basil' }], inventory: 50, is_available: true, is_featured: true }),
  demoProduct(49, 'langata-herb-co', { title: 'Edible flowers punnet', slug: 'flowers-eat', description: 'Nasturtium · pansy · chefs’ mix.', price: 48000, images: [{ url: catalogImg(49), alt: 'Flowers' }], inventory: 18, is_available: true, is_featured: false }),
  demoProduct(50, 'langata-herb-co', { title: 'Rocket pesto 220g', slug: 'pesto-rocket', description: 'Pine nut · vegan option tag.', price: 44000, images: [{ url: catalogImg(50), alt: 'Pesto' }], inventory: 28, is_available: true, is_featured: true }),
  demoProduct(51, 'cbd-crafts-studio', { title: 'Embroidered cap run — 12 pcs', slug: 'caps-12', description: '6-panel · 3 thread colours · digitising incl.', price: 1650000, images: [{ url: catalogImg(51), alt: 'Embroidery' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(52, 'cbd-crafts-studio', { title: 'DTG tee run — 24 pcs', slug: 'dtg-24', description: 'Water-based inks · dark garment surcharge applies.', price: 1480000, images: [{ url: catalogImg(52), alt: 'Print' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(53, 'cbd-crafts-studio', { title: 'Vinyl name badges ×50', slug: 'badges-50', description: 'Magnet back · 2-colour max.', price: 620000, images: [{ url: catalogImg(53), alt: 'Badges' }], inventory: -1, is_available: true, is_featured: false }),
  demoProduct(54, 'cbd-crafts-studio', { title: 'Rush production fee', slug: 'rush-fee', description: '3-business-day turnaround.', price: 380000, images: [{ url: catalogImg(54), alt: 'Service fee' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(55, 'westlands-brand-film', { title: 'Hero product reel — 15s', slug: 'reel-15', description: 'Studio cyclo · colour grade · 2 revisions.', price: 4850000, images: [{ url: catalogImg(55), alt: 'Camera kit' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(56, 'westlands-brand-film', { title: '30s paid social ad', slug: 'ad-30s', description: 'Storyboard · VO optional.', price: 8200000, images: [{ url: catalogImg(56), alt: 'Film set' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(57, 'westlands-brand-film', { title: 'Half-day studio — 10 SKUs', slug: 'pack-10sku', description: 'Lighting pack · clean white + lifestyle.', price: 12500000, images: [{ url: catalogImg(57), alt: 'Studio' }], inventory: -1, is_available: true, is_featured: false }),
  demoProduct(58, 'westlands-brand-film', { title: 'Vertical crop pack — 25 clips', slug: 'ugc-pack', description: 'Hook + demo + CTA templates.', price: 3600000, images: [{ url: catalogImg(58), alt: 'Phone video' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(59, 'hurlingham-bake-school', { title: 'Sourdough fundamentals — Sat', slug: 'class-sourdough', description: '10:00–14:00 · starter jar incl.', price: 680000, images: [{ url: catalogImg(59), alt: 'Baking class' }], inventory: 10, is_available: true, is_featured: true }),
  demoProduct(60, 'hurlingham-bake-school', { title: 'Croissant lamination — Sun', slug: 'class-croissant', description: 'Butter block · folding grid.', price: 720000, images: [{ url: catalogImg(60), alt: 'Pastry class' }], inventory: 8, is_available: true, is_featured: true }),
  demoProduct(61, 'hurlingham-bake-school', { title: 'Kids cupcake Sat morning', slug: 'kids-cupcake', description: 'Ages 8–13 · guardians welcome.', price: 350000, images: [{ url: catalogImg(61), alt: 'Cupcakes' }], inventory: 12, is_available: true, is_featured: false }),
  demoProduct(62, 'hurlingham-bake-school', { title: 'Cake business consult — 2hr', slug: 'consult-cake', description: 'Pricing · ops · M-Pesa tips.', price: 450000, images: [{ url: catalogImg(62), alt: 'Consulting' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(63, 'lavington-handy-crew', { title: 'Handyman hour — peak', slug: 'hour-handyman', description: 'First hour on-site · materials quoted.', price: 280000, images: [{ url: catalogImg(63), alt: 'Tools' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(64, 'lavington-handy-crew', { title: 'TV wall mount — up to 65"', slug: 'tv-mount', description: 'VESA check · conceal cables add-on.', price: 185000, images: [{ url: catalogImg(64), alt: 'TV' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(65, 'lavington-handy-crew', { title: 'Leak diagnostics visit', slug: 'leak-visit', description: 'Moisture trace · quote same day.', price: 95000, images: [{ url: catalogImg(65), alt: 'Plumbing' }], inventory: -1, is_available: true, is_featured: false }),
  demoProduct(66, 'lavington-handy-crew', { title: 'Full room refresh — half day', slug: 'room-refresh', description: 'Paint + patch · up to 18m².', price: 1420000, images: [{ url: catalogImg(66), alt: 'Painting' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(67, 'south-c-portrait-lab', { title: 'Headshot block — 3 looks', slug: 'headshot-3', description: 'Lighting sets · CC retouch lite.', price: 880000, images: [{ url: catalogImg(67), alt: 'Portrait studio' }], inventory: 6, is_available: true, is_featured: true }),
  demoProduct(68, 'south-c-portrait-lab', { title: 'Couple session — 60 min', slug: 'couple-60', description: 'Indoor + roof strobe option.', price: 1150000, images: [{ url: catalogImg(68), alt: 'Couple' }], inventory: 5, is_available: true, is_featured: true }),
  demoProduct(69, 'south-c-portrait-lab', { title: 'Newborn mini — 45 min', slug: 'newborn-45', description: 'Heated room · wraps provided.', price: 1350000, images: [{ url: catalogImg(69), alt: 'Baby' }], inventory: 4, is_available: true, is_featured: false }),
  demoProduct(70, 'south-c-portrait-lab', { title: 'Team corporate — 10 pax', slug: 'team-10', description: 'Backdrop + prompter · same-day proof.', price: 4200000, images: [{ url: catalogImg(70), alt: 'Team' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(71, 'karen-event-styling', { title: 'Intimate dinner — 8 pax', slug: 'dinner-8', description: 'Floral runner · napkin fold · strike incl.', price: 4500000, images: [{ url: catalogImg(71), alt: 'Table' }], inventory: 3, is_available: true, is_featured: true }),
  demoProduct(72, 'karen-event-styling', { title: 'Corporate luncheon — 40 pax', slug: 'lunch-40', description: 'Buffet risers · branded menu cards.', price: 18500000, images: [{ url: catalogImg(72), alt: 'Catering style' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(73, 'karen-event-styling', { title: 'Ceremony arch — fabric + bloom', slug: 'arch-ceremony', description: 'Install + derig same evening.', price: 6500000, images: [{ url: catalogImg(73), alt: 'Wedding arch' }], inventory: 2, is_available: true, is_featured: false }),
  demoProduct(74, 'karen-event-styling', { title: 'Moodboard + vendor calls', slug: 'mood-hour', description: '2hr creative direction.', price: 1200000, images: [{ url: catalogImg(74), alt: 'Planning' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(75, 'kilimani-living-co', { title: 'Linen sectional — fog R-chaise', slug: 'sectional-fog', description: 'Removable covers · steel frame.', price: 19800000, images: [{ url: catalogImg(75), alt: 'Sofa' }], inventory: 2, is_available: true, is_featured: true }),
  demoProduct(76, 'kilimani-living-co', { title: 'Wool area rug 2×3m — sand', slug: 'rug-2x3', description: 'Hand-tufted · shed cycle noted.', price: 4200000, images: [{ url: catalogImg(76), alt: 'Rug' }], inventory: 4, is_available: true, is_featured: true }),
  demoProduct(77, 'kilimani-living-co', { title: 'Oak nesting tables — set 2', slug: 'tables-nest', description: 'FSC oak · soft close drawer.', price: 2100000, images: [{ url: catalogImg(77), alt: 'Tables' }], inventory: 6, is_available: true, is_featured: false }),
  demoProduct(78, 'kilimani-living-co', { title: 'Accent lounge chair — bouclé', slug: 'chair-boucle', description: 'Swivel base · oatmeal.', price: 3850000, images: [{ url: catalogImg(78), alt: 'Chair' }], inventory: 3, is_available: true, is_featured: true }),
  demoProduct(79, 'south-b-lumen', { title: 'Brass pendant — triple disc', slug: 'pendant-3', description: '2700K dimmable · canopy incl.', price: 495000, images: [{ url: catalogImg(79), alt: 'Pendant' }], inventory: 16, is_available: true, is_featured: true }),
  demoProduct(80, 'south-b-lumen', { title: 'Smart bulb starter — 4 pack', slug: 'smart-4pk', description: 'Matter-ready · warm-to-cool.', price: 180000, images: [{ url: catalogImg(80), alt: 'Bulbs' }], inventory: 40, is_available: true, is_featured: true }),
  demoProduct(81, 'south-b-lumen', { title: 'Outdoor flood RGBW', slug: 'flood-out', description: 'IP65 · app scenes.', price: 320000, images: [{ url: catalogImg(81), alt: 'Flood light' }], inventory: 14, is_available: true, is_featured: false }),
  demoProduct(82, 'south-b-lumen', { title: 'Electrician install — fixture', slug: 'install-fixture', description: 'Per point · cert on request.', price: 450000, images: [{ url: catalogImg(82), alt: 'Install' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(83, 'westlands-soft-loom', { title: 'Stonewash throw — oat king', slug: 'throw-oat', description: 'Pre-washed cotton · 240×260cm.', price: 128000, images: [{ url: catalogImg(83), alt: 'Throw' }], inventory: 28, is_available: true, is_featured: true }),
  demoProduct(84, 'westlands-soft-loom', { title: 'Linen duvet set — queen', slug: 'duvet-linen', description: 'French seam · coconut buttons.', price: 2850000, images: [{ url: catalogImg(84), alt: 'Bedding' }], inventory: 9, is_available: true, is_featured: true }),
  demoProduct(85, 'westlands-soft-loom', { title: 'Euro cushion pair — sage', slug: 'cushion-euro', description: 'Feather insert optional (+40k).', price: 520000, images: [{ url: catalogImg(85), alt: 'Cushions' }], inventory: 15, is_available: true, is_featured: false }),
  demoProduct(86, 'westlands-soft-loom', { title: 'Waffle robe — unisex M/L', slug: 'robe-waffle', description: 'Absorbent · deep pockets.', price: 1100000, images: [{ url: catalogImg(86), alt: 'Robe' }], inventory: 11, is_available: true, is_featured: true }),
  demoProduct(87, 'parklands-metal-studio', { title: 'Floating shelf pair — brass', slug: 'shelf-brass', description: 'Max span 1.2m · concealed fix.', price: 740000, images: [{ url: catalogImg(87), alt: 'Shelf' }], inventory: 8, is_available: true, is_featured: true }),
  demoProduct(88, 'parklands-metal-studio', { title: 'Coat stand — welded spine', slug: 'coat-stand', description: 'Powder coat · umbrella drip.', price: 920000, images: [{ url: catalogImg(88), alt: 'Coat rack' }], inventory: 5, is_available: true, is_featured: false }),
  demoProduct(89, 'parklands-metal-studio', { title: 'Bedside cube pair', slug: 'bedside-cube', description: 'Brushed · soft-close drawer.', price: 1680000, images: [{ url: catalogImg(89), alt: 'Bedside' }], inventory: 4, is_available: true, is_featured: true }),
  demoProduct(90, 'buru-woodworks', { title: 'Live-edge dining — 8 seater', slug: 'table-live', description: 'Kiaat slabs · oil wax finish.', price: 22500000, images: [{ url: catalogImg(90), alt: 'Dining table' }], inventory: 2, is_available: true, is_featured: true }),
  demoProduct(91, 'buru-woodworks', { title: 'Kitchen stool pair', slug: 'stool-pair', description: 'Mortice stretchers · felt pads.', price: 980000, images: [{ url: catalogImg(91), alt: 'Stool' }], inventory: 7, is_available: true, is_featured: true }),
  demoProduct(92, 'buru-woodworks', { title: 'Floating vanity — wall hung', slug: 'vanity-float', description: 'Basin cut-out template sent.', price: 6800000, images: [{ url: catalogImg(92), alt: 'Vanity' }], inventory: 3, is_available: true, is_featured: false }),
  demoProduct(93, 'roysambu-scent-studio', { title: 'Diffuser — cedar & vetiver 120ml', slug: 'diffuser-cedar', description: 'Refillable glass · 4 reeds.', price: 98000, images: [{ url: catalogImg(93), alt: 'Diffuser' }], inventory: 45, is_available: true, is_featured: true }),
  demoProduct(94, 'roysambu-scent-studio', { title: 'Soy candle trio — travel', slug: 'candles-trio', description: '45h total burn · gift box.', price: 175000, images: [{ url: catalogImg(94), alt: 'Candles' }], inventory: 30, is_available: true, is_featured: true }),
  demoProduct(95, 'roysambu-scent-studio', { title: 'Room spray — neroli sky 100ml', slug: 'spray-neroli', description: 'Fabric-safe · fine mist.', price: 62000, images: [{ url: catalogImg(95), alt: 'Spray' }], inventory: 38, is_available: true, is_featured: false }),
  demoProduct(96, 'roysambu-scent-studio', { title: 'Reed refill 200ml', slug: 'reed-refill', description: 'Same scent line only.', price: 42000, images: [{ url: catalogImg(96), alt: 'Refill' }], inventory: 50, is_available: true, is_featured: true }),
  demoProduct(97, 'simply-stylish', { title: 'Silk slip dress — noir', slug: 'slip-noir', description: 'Bias cut · midi · straps adjustable.', price: 8950000, images: [{ url: catalogImg(97), alt: 'Silk dress' }], inventory: 5, is_available: true, is_featured: true }),
  demoProduct(98, 'simply-stylish', { title: 'Merino polo — bone', slug: 'polo-bone', description: 'Ultra-fine rib · tipped collar.', price: 2850000, images: [{ url: catalogImg(98), alt: 'Knit polo' }], inventory: 14, is_available: true, is_featured: true }),
  demoProduct(99, 'simply-stylish', { title: 'Wide-leg trouser — pressed wool', slug: 'trouser-wide-wool', description: 'Flat front · high waist · cuffs by request.', price: 4980000, images: [{ url: catalogImg(99), alt: 'Wool trousers' }], inventory: 8, is_available: true, is_featured: false }),
  demoProduct(100, 'simply-stylish', { title: 'Quilted crossbody mini', slug: 'crossbody-mini', description: 'Chain strap · suede lining.', price: 7200000, images: [{ url: catalogImg(100), alt: 'Handbag' }], inventory: 4, is_available: true, is_featured: true }),
  demoProduct(101, 'simply-stylish', { title: 'Bold hoop earrings — satin brass', slug: 'hoops-brass', description: 'Latch back · hypoallergenic post.', price: 1290000, images: [{ url: catalogImg(101), alt: 'Earrings' }], inventory: 18, is_available: true, is_featured: true }),
  demoProduct(102, 'trim', { title: 'Signature fade + beard line-up', slug: 'fade-beard-full', description: 'Taper transitions · razor-sharp neckline.', price: 250000, images: [{ url: catalogImg(102), alt: 'Fade haircut' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(103, 'trim', { title: 'Classic scissor crop', slug: 'scissor-crop', description: 'Textured crown · natural finish.', price: 220000, images: [{ url: catalogImg(103), alt: 'Scissor cut' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(104, 'trim', { title: 'Beard shape + hot towel', slug: 'beard-hot-towel', description: 'Line-up · oil · steamed towel.', price: 180000, images: [{ url: catalogImg(104), alt: 'Beard grooming' }], inventory: -1, is_available: true, is_featured: false }),
  demoProduct(105, 'trim', { title: 'Kids weekday cut (under 12)', slug: 'kids-cut', description: 'Neat neckline · cape + sticker optional.', price: 150000, images: [{ url: catalogImg(105), alt: 'Kids haircut' }], inventory: -1, is_available: true, is_featured: true }),
  demoProduct(106, 'trim', { title: 'House grooming oil — 100ml', slug: 'groom-oil-100', description: 'Tea tree citrus · amber pump bottle.', price: 320000, images: [{ url: catalogImg(106), alt: 'Grooming oil' }], inventory: 36, is_available: true, is_featured: true }),
]

export function getPlaceholderVendorBySlug(slug) {
  return bySlug[slug] || null
}

export function getPlaceholderProductsForVendor(vendorId) {
  return placeholderProducts.filter((p) => p.vendor_id === vendorId)
}

export function filterPlaceholderVendors(category) {
  if (!category || category === 'all') return [...placeholderVendors]
  return placeholderVendors.filter((v) => v.category === category)
}

export function searchPlaceholderVendors(q) {
  const needle = q.toLowerCase()
  return placeholderVendors.filter(
    (v) =>
      v.name.toLowerCase().includes(needle) ||
      (v.area && v.area.toLowerCase().includes(needle)) ||
      v.category.toLowerCase().includes(needle) ||
      (v.tagline && v.tagline.toLowerCase().includes(needle))
  )
}

/** Gradient fallback for home vendor cards + shop hero. */
export function bannerFallbackClass(category) {
  const map = {
    fashion: 'vendor-card__ph--fashion',
    groceries: 'vendor-card__ph--groceries',
    services: 'vendor-card__ph--services',
    household: 'vendor-card__ph--household',
  }
  return map[category] || 'vendor-card__ph--default'
}

export { byId as placeholderVendorById }
