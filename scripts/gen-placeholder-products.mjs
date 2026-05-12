/**
 * One-off generator — writes demoProduct(...) lines for placeholders.js
 * Run: node scripts/gen-placeholder-products.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Emits `{ url: catalogImg(seq)` for paste into placeholders.js (`demoProduct` rows).
 */
const iu = (seq, alt) =>
  `images: [{ url: catalogImg(${seq}), alt: '${alt.replace(/'/g, "\\'")}' }]`

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// [slug, [[title, pslug, desc, priceCents, _legacyPhoto, alt, inv, featured?, compare?], ...]]
const catalog = [
  [
    'westlands-streetwear',
    [
      ['Oversized tee — Black', 'tee-black', 'Heavy 240gsm cotton · dropped shoulder · unisex S–XL.', 320000, 'photo-1521572163474-6864f9cf17ab?auto=format&w=800&q=80', 'Black T-shirt', 34, true, 380000],
      ['Retro runner — Bone', 'runner-bone', 'Mesh upper · EVA mid · daily miles.', 1120000, 'photo-1549298916-b41d501d3772?auto=format&w=800&q=80', 'Sneakers', 9, true],
      ['Canvas 6-panel cap', 'cap-canvas', 'Forest green · brass clasp · deep fit.', 219000, 'photo-1588850561407-ed78c282e89b?auto=format&w=800&q=80', 'Cap', 42, true],
      ['Fleece zip hoodie', 'hoodie-zip', 'Mid-weight · raglan · YKK zip.', 485000, 'photo-1556821840-3a63f95609a7?auto=format&w=800&q=80', 'Hoodie', 18, false],
      ['Relaxed cargo pant', 'cargo-sand', 'Taper leg · 6 pocket · cotton twill.', 675000, 'photo-1506629083308-07ef79a6e15c?auto=format&w=800&q=80', 'Cargo pants', 14, true],
    ],
  ],
  [
    'kilimani-atelier',
    [
      ['Linen blazer — MTM', 'blazer-mtm', 'Two fittings · half-canvas · choice of lining.', 2850000, 'photo-1594932234982-9d4c47a244e8?auto=format&w=800&q=80', 'Blazer', 6, true],
      ['Straight trousers — wool', 'trousers-wool', 'Flat front · cuffs by measurement.', 1950000, 'photo-1596755094514-870a59863b9c?auto=format&w=800&q=80', 'Trousers', 8, true],
      ['Shirt dress — silk touch', 'shirt-dress', 'Belted midi · mother-of-pearl buttons.', 1650000, 'photo-1595777457583-95e059d581b8?auto=format&w=800&q=80', 'Dress', 5, false],
      ['Alterations voucher', 'alter-voucher', 'Hem · waist · sleeve — quoted in studio.', 80000, 'photo-1620799140408-edc057dcb70a?auto=format&w=800&q=80', 'Sewing', 99, true],
    ],
  ],
  [
    'lavington-vintage',
    [
      ['90s leather bomber', 'bomber-leather', 'Italian hide · quilted lining · one-off.', 4850000, 'photo-1551028719-00167b16eac5?auto=format&w=800&q=80', 'Leather jacket', 1, true],
      ['Vintage denim trucker', 'denim-trucker', 'Faded indigo · boxy 90s cut.', 2250000, 'photo-1576995853122-770f6b819e09?auto=format&w=800&q=80', 'Denim jacket', 3, true],
      ['Oval sunglasses — tortoise', 'sunnies-tort', 'UV400 · case included.', 890000, 'photo-1572635196237-14b3f281503f?auto=format&w=800&q=80', 'Sunglasses', 11, false],
      ['Band tee — rare print', 'band-tee', 'Single-stitch · verified era.', 1350000, 'photo-1503341455253-b2e723bb3dbb?auto=format&w=800&q=80', 'T-shirt', 2, true],
    ],
  ],
  [
    'eastleigh-textile-lab',
    [
      ['Kitenge shift dress', 'dress-shift', 'Custom length · pockets optional.', 980000, 'photo-1595777457583-95e059d581b8?auto=format&w=800&q=80', 'Dress', 14, true],
      ['Men’s kitenge shirt', 'shirt-kitenge', 'Tailored collar · slim or relaxed.', 1250000, 'photo-1617127365659-c47fa864d8bc?auto=format&w=800&q=80', 'Shirt', 10, true],
      ['Headwrap set ×3', 'wraps-3', 'Coordinate prints · pre-cut.', 390000, 'photo-1539533018447-63fcce2678e3?auto=format&w=800&q=80', 'Headwrap', 25, false],
      ['Clutch — kitenge patchwork', 'clutch-patch', 'Inner card slots · magnetic snap.', 450000, 'photo-1590874103328-eac38a683e7f?auto=format&w=800&q=80', 'Clutch', 17, true],
    ],
  ],
  [
    'muthaiga-run-club',
    [
      ['Carbon plate road shoe', 'road-carbon', '5mm drop · race-day foam.', 2150000, 'photo-1542291026-38e2874ccc30?auto=format&w=800&q=80', 'Running shoe', 7, true],
      ['Compression half tight', 'tight-half', 'Moisture-wick · phone pocket.', 780000, 'photo-1517438476312-10d79ce07701?auto=format&w=800&q=80', 'Tights', 22, true],
      ['Hydration vest 5L', 'vest-5l', 'Soft flasks · bounce-free harness.', 1420000, 'photo-1476480862126-209bfaa8edc8?auto=format&w=800&q=80', 'Vest', 9, false],
      ['Foam roller — 45cm', 'roller-foam', 'High density · travel bag.', 420000, 'photo-1601925260368-ae2f83d8b7f1?auto=format&w=800&q=80', 'Roller', 16, true],
    ],
  ],
  [
    'ngong-denim-works',
    [
      ['Chain-stitch hem', 'hem-chain', 'Single pair · while-you-wait slots.', 28000, 'photo-1548615667-a06a1c8aa40d?auto=format&w=800&q=80', 'Denim hem', -1, true],
      ['Selvedge repair patch', 'patch-repair', 'Loom-matched weave · darning.', 85000, 'photo-1542272604-787c3835535d?auto=format&w=800&q=80', 'Denim repair', -1, false],
      ['Rescue wash + mend', 'wash-rescue', 'Odour strip · small hole darn.', 195000, 'photo-1473966968600-fa80186902a5?auto=format&w=800&q=80', 'Laundry', -1, true],
      ['Taper from knee', 'taper-knee', 'Re-taper silhouette · pressed.', 145000, 'photo-1541099649105-f69ad21f3246?auto=format&w=800&q=80', 'Tailoring', -1, true],
    ],
  ],
  [
    'kileleshwa-greens',
    [
      ['Hass avocado tray (10)', 'hass-10', 'Tree-ripe · foam tray.', 72000, 'photo-1523049673857-eb18f281d6e7?auto=format&w=800&q=80', 'Avocados', 55, true],
      ['Sourdough boule', 'sourdough-boule', 'Wild yeast · scored crust.', 42000, 'photo-1509440159596-0249088772ff?auto=format&w=800&q=80', 'Bread', 20, true],
      ['Cold-press green juice 500ml', 'juice-green', 'Kale · apple · ginger.', 35000, 'photo-1610970881699-44a5587cabec?auto=format&w=800&q=80', 'Juice', 40, true],
      ['Farm egg tray (30)', 'eggs-30', 'Free-range brown · date-stamped.', 110000, 'photo-1582722872445-44dc5f7e3c8f?auto=format&w=800&q=80', 'Eggs', 30, false],
      ['Mixed salad box (family)', 'salad-family', 'Washed · dressing on side.', 65000, 'photo-1512621776951-a57141f2eefd?auto=format&w=800&q=80', 'Salad', 18, true],
    ],
  ],
  [
    'karen-organic-patch',
    [
      ['Heirloom tomato crate 6kg', 'tomatoes-6kg', 'Vine-ripened · colour mix.', 138000, 'photo-1592924357228-91a4daadc8f3?auto=format&w=800&q=80', 'Tomatoes', 15, true],
      ['Rainbow chard bunch ×2', 'chard-2', 'Stems for stock · leaves for sauté.', 28000, 'photo-1586201375256-3d07b9cb5d0d?auto=format&w=800&q=80', 'Chard', 40, false],
      ['Weekly veg box — trial', 'box-trial', 'Feeds 2 · first week promo.', 220000, 'photo-1488459716781-31db52582fe9?auto=format&w=800&q=80', 'Vegetable box', 25, true],
      ['House pesto 250g', 'pesto-jar', 'Basil · pine nut · EVOO.', 48000, 'photo-1473093295043-cdd815a7b3d5?auto=format&w=800&q=80', 'Pesto', 22, true],
    ],
  ],
  [
    'south-b-fish-co',
    [
      ['Ocean prawns — 1kg IQF', 'prawns-1kg', 'Head-off · deveined · ice chain.', 295000, 'photo-1519708227418-c8fd9a32b7a2?auto=format&w=800&q=80', 'Prawns', 14, true],
      ['Tilapia fillet — 2kg', 'tilapia-2kg', 'Lake-farmed · skin-on.', 198000, 'photo-1534604973900-11fd1f01d467?auto=format&w=800&q=80', 'Fish fillet', 10, true],
      ['Smoked salmon 400g', 'salmon-400', 'Cold-smoked · sliced.', 285000, 'photo-1467003909588-2f47a09e6cfe?auto=format&w=800&q=80', 'Salmon', 7, true],
      ['Calamari rings 500g', 'calamari-500', 'Blanched · cook 90s.', 175000, 'photo-1559339352-11d0353a6298?auto=format&w=800&q=80', 'Calamari', 12, false],
    ],
  ],
  [
    'ruaka-morning-harvest',
    [
      ['Office fruit bundle — 20 pax', 'fruit-office', 'Seasonal mix · weekly restock.', 980000, 'photo-1610832958506-aa56368176cf?auto=format&w=800&q=80', 'Fruit', 8, true],
      ['Greek yoghurt 1kg tub ×3', 'yoghurt-3', 'Low sugar · vanilla bean.', 165000, 'photo-1488477181946-6428a0291777?auto=format&w=800&q=80', 'Yoghurt', 30, true],
      ['Mixed berries punnet 250g', 'berries-250', 'Blueberry · strawberry · raspberry.', 52000, 'photo-1464965911861-746a04b4bca6?auto=format&w=800&q=80', 'Berries', 24, false],
      ['Cold milk 5L (2×2.5L)', 'milk-5l', 'Pasteurised · glass option.', 120000, 'photo-1563636619-e9143da7973b?auto=format&w=800&q=80', 'Milk', 20, true],
    ],
  ],
  [
    'thika-spice-mercantile',
    [
      ['Whole garam — 500g', 'garam-500', 'Toast & grind to order.', 88000, 'photo-1596040033229-a9821ebd058d?auto=format&w=800&q=80', 'Spices', 45, true],
      ['Berbere blend — 350g', 'berbere-350', 'Mild heat · Ethiopian style.', 72000, 'photo-1599909531066-b812ca4d6bd5?auto=format&w=800&q=80', 'Spice blend', 38, true],
      ['Curry leaf bunch ×5', 'curry-leaves', 'Fresh · wrap in damp towel.', 15000, 'photo-1615485290382-5e4f1fd69a8b?auto=format&w=800&q=80', 'Herbs', 60, false],
      ['Cassia bark — 200g', 'cassia-200', 'Whole quills · slow release.', 42000, 'photo-1509352841165-b252551938c6?auto=format&w=800&q=80', 'Cinnamon', 33, true],
    ],
  ],
  [
    'langata-herb-co',
    [
      ['Micro mix 200g', 'micro-200', 'Pea · radish · mustard · beet.', 62000, 'photo-1464226184884-fa280b87c399?auto=format&w=800&q=80', 'Microgreens', 35, true],
      ['Living basil punnet ×4', 'basil-4', 'Hydro · snip as needed.', 55000, 'photo-1518977676601-b53f82aba655?auto=format&w=800&q=80', 'Basil', 50, true],
      ['Edible flowers punnet', 'flowers-eat', 'Nasturtium · pansy · chefs’ mix.', 48000, 'photo-1490750967868-88aa4486c946?auto=format&w=800&q=80', 'Flowers', 18, false],
      ['Rocket pesto 220g', 'pesto-rocket', 'Pine nut · vegan option tag.', 44000, 'photo-1546069901-ba9599a7e63c?auto=format&w=800&q=80', 'Pesto', 28, true],
    ],
  ],
  [
    'cbd-crafts-studio',
    [
      ['Embroidered cap run — 12 pcs', 'caps-12', '6-panel · 3 thread colours · digitising incl.', 1650000, 'photo-1562654500-6a2e055b56a7?auto=format&w=800&q=80', 'Embroidery', -1, true],
      ['DTG tee run — 24 pcs', 'dtg-24', 'Water-based inks · dark garment surcharge applies.', 1480000, 'photo-1582719478250-c89cae4dc85b?auto=format&w=800&q=80', 'Print', -1, true],
      ['Vinyl name badges ×50', 'badges-50', 'Magnet back · 2-colour max.', 620000, 'photo-1586281380349-632531db7ed4?auto=format&w=800&q=80', 'Badges', -1, false],
      ['Rush production fee', 'rush-fee', '3-business-day turnaround.', 380000, 'photo-1589939705384-5185137a7f0f?auto=format&w=800&q=80', 'Service fee', -1, true],
    ],
  ],
  [
    'westlands-brand-film',
    [
      ['Hero product reel — 15s', 'reel-15', 'Studio cyclo · colour grade · 2 revisions.', 4850000, 'photo-1574717024653-61fd2cf4d44d?auto=format&w=800&q=80', 'Camera kit', -1, true],
      ['30s paid social ad', 'ad-30s', 'Storyboard · VO optional.', 8200000, 'photo-1492691527719-9d1e07e534b4?auto=format&w=800&q=80', 'Film set', -1, true],
      ['Half-day studio — 10 SKUs', 'pack-10sku', 'Lighting pack · clean white + lifestyle.', 12500000, 'photo-1529257414772-19636b7e316f?auto=format&w=800&q=80', 'Studio', -1, false],
      ['Vertical crop pack — 25 clips', 'ugc-pack', 'Hook + demo + CTA templates.', 3600000, 'photo-1579632659920-34d6c3c90c06?auto=format&w=800&q=80', 'Phone video', -1, true],
    ],
  ],
  [
    'hurlingham-bake-school',
    [
      ['Sourdough fundamentals — Sat', 'class-sourdough', '10:00–14:00 · starter jar incl.', 680000, 'photo-1556910103-1c02745aae4d?auto=format&w=800&q=80', 'Baking class', 10, true],
      ['Croissant lamination — Sun', 'class-croissant', 'Butter block · folding grid.', 720000, 'photo-1509440159596-0249088772ff?auto=format&w=800&q=80', 'Pastry class', 8, true],
      ['Kids cupcake Sat morning', 'kids-cupcake', 'Ages 8–13 · guardians welcome.', 350000, 'photo-1562440499-63c28b8d04fa?auto=format&w=800&q=80', 'Cupcakes', 12, false],
      ['Cake business consult — 2hr', 'consult-cake', 'Pricing · ops · M-Pesa tips.', 450000, 'photo-1578985545062-69928b1d9587?auto=format&w=800&q=80', 'Consulting', -1, true],
    ],
  ],
  [
    'lavington-handy-crew',
    [
      ['Handyman hour — peak', 'hour-handyman', 'First hour on-site · materials quoted.', 280000, 'photo-1504309092620-4d0ec726efa4?auto=format&w=800&q=80', 'Tools', -1, true],
      ['TV wall mount — up to 65"', 'tv-mount', 'VESA check · conceal cables add-on.', 185000, 'photo-1593359677879-a4bb92f828d4?auto=format&w=800&q=80', 'TV', -1, true],
      ['Leak diagnostics visit', 'leak-visit', 'Moisture trace · quote same day.', 95000, 'photo-1585771724682-4d7dca31f6c5?auto=format&w=800&q=80', 'Plumbing', -1, false],
      ['Full room refresh — half day', 'room-refresh', 'Paint + patch · up to 18m².', 1420000, 'photo-1560518883-ce09059eeffa?auto=format&w=800&q=80', 'Painting', -1, true],
    ],
  ],
  [
    'south-c-portrait-lab',
    [
      ['Headshot block — 3 looks', 'headshot-3', 'Lighting sets · CC retouch lite.', 880000, 'photo-1542038787076-31474938aed5?auto=format&w=800&q=80', 'Portrait studio', 6, true],
      ['Couple session — 60 min', 'couple-60', 'Indoor + roof strobe option.', 1150000, 'photo-1522673607200-164d1b6ce486?auto=format&w=800&q=80', 'Couple', 5, true],
      ['Newborn mini — 45 min', 'newborn-45', 'Heated room · wraps provided.', 1350000, 'photo-1519689680058-324335c77eba?auto=format&w=800&q=80', 'Baby', 4, false],
      ['Team corporate — 10 pax', 'team-10', 'Backdrop + prompter · same-day proof.', 4200000, 'photo-1522071820081-009f0129c71c?auto=format&w=800&q=80', 'Team', -1, true],
    ],
  ],
  [
    'karen-event-styling',
    [
      ['Intimate dinner — 8 pax', 'dinner-8', 'Floral runner · napkin fold · strike incl.', 4500000, 'photo-1464366400600-716ab154b5bb?auto=format&w=800&q=80', 'Table', 3, true],
      ['Corporate luncheon — 40 pax', 'lunch-40', 'Buffet risers · branded menu cards.', 18500000, 'photo-1414235077428-338989a2e8cc?auto=format&w=800&q=80', 'Catering style', -1, true],
      ['Ceremony arch — fabric + bloom', 'arch-ceremony', 'Install + derig same evening.', 6500000, 'photo-1464822759023-fed622ff2c3b?auto=format&w=800&q=80', 'Wedding arch', 2, false],
      ['Moodboard + vendor calls', 'mood-hour', '2hr creative direction.', 1200000, 'photo-1469334031218-e382a71b716b?auto=format&w=800&q=80', 'Planning', -1, true],
    ],
  ],
  [
    'kilimani-living-co',
    [
      ['Linen sectional — fog R-chaise', 'sectional-fog', 'Removable covers · steel frame.', 19800000, 'photo-1555041469-a586c61ea9bc?auto=format&w=800&q=80', 'Sofa', 2, true],
      ['Wool area rug 2×3m — sand', 'rug-2x3', 'Hand-tufted · shed cycle noted.', 4200000, 'photo-1586023492125-27b2c045efd7?auto=format&w=800&q=80', 'Rug', 4, true],
      ['Oak nesting tables — set 2', 'tables-nest', 'FSC oak · soft close drawer.', 2100000, 'photo-1595515106969-2e5c33ac7036?auto=format&w=800&q=80', 'Tables', 6, false],
      ['Accent lounge chair — bouclé', 'chair-boucle', 'Swivel base · oatmeal.', 3850000, 'photo-1506439773649-c6e512091848?auto=format&w=800&q=80', 'Chair', 3, true],
    ],
  ],
  [
    'south-b-lumen',
    [
      ['Brass pendant — triple disc', 'pendant-3', '2700K dimmable · canopy incl.', 495000, 'photo-1507473885765-e6ed057f782c?auto=format&w=800&q=80', 'Pendant', 16, true],
      ['Smart bulb starter — 4 pack', 'smart-4pk', 'Matter-ready · warm-to-cool.', 180000, 'photo-1513506003901-1e6a229e2d15?auto=format&w=800&q=80', 'Bulbs', 40, true],
      ['Outdoor flood RGBW', 'flood-out', 'IP65 · app scenes.', 320000, 'photo-1517457376758-7c4b2f165d76?auto=format&w=800&q=80', 'Flood light', 14, false],
      ['Electrician install — fixture', 'install-fixture', 'Per point · cert on request.', 450000, 'photo-1621905251918-48416bd8575a?auto=format&w=800&q=80', 'Install', -1, true],
    ],
  ],
  [
    'westlands-soft-loom',
    [
      ['Stonewash throw — oat king', 'throw-oat', 'Pre-washed cotton · 240×260cm.', 128000, 'photo-1631679706909-1844bbd04221?auto=format&w=800&q=80', 'Throw', 28, true],
      ['Linen duvet set — queen', 'duvet-linen', 'French seam · coconut buttons.', 2850000, 'photo-1616628188506-5f2c66a3a9bc?auto=format&w=800&q=80', 'Bedding', 9, true],
      ['Euro cushion pair — sage', 'cushion-euro', 'Feather insert optional (+40k).', 520000, 'photo-1616046226538-8281439e9bf1?auto=format&w=800&q=80', 'Cushions', 15, false],
      ['Waffle robe — unisex M/L', 'robe-waffle', 'Absorbent · deep pockets.', 1100000, 'photo-1516914943479-e8963bc11756?auto=format&w=800&q=80', 'Robe', 11, true],
    ],
  ],
  [
    'parklands-metal-studio',
    [
      ['Floating shelf pair — brass', 'shelf-brass', 'Max span 1.2m · concealed fix.', 740000, 'photo-1558618666-fcd25c85cd64?auto=format&w=800&q=80', 'Shelf', 8, true],
      ['Coat stand — welded spine', 'coat-stand', 'Powder coat · umbrella drip.', 920000, 'photo-1555041469-a586c61ea9bc?auto=format&w=800&q=80', 'Coat rack', 5, false],
      ['Bedside cube pair', 'bedside-cube', 'Brushed · soft-close drawer.', 1680000, 'photo-1581539250439-c96689b4e0a2?auto=format&w=800&q=80', 'Bedside', 4, true],
    ],
  ],
  [
    'buru-woodworks',
    [
      ['Live-edge dining — 8 seater', 'table-live', 'Kiaat slabs · oil wax finish.', 22500000, 'photo-1618220178598-43d7d3762266?auto=format&w=800&q=80', 'Dining table', 2, true],
      ['Kitchen stool pair', 'stool-pair', 'Mortice stretchers · felt pads.', 980000, 'photo-1549187774-f2d6b2c0e8b5?auto=format&w=800&q=80', 'Stool', 7, true],
      ['Floating vanity — wall hung', 'vanity-float', 'Basin cut-out template sent.', 6800000, 'photo-1600607686527-6fb886090705?auto=format&w=800&q=80', 'Vanity', 3, false],
    ],
  ],
  [
    'roysambu-scent-studio',
    [
      ['Diffuser — cedar & vetiver 120ml', 'diffuser-cedar', 'Refillable glass · 4 reeds.', 98000, 'photo-1608571423902-4394d4c8dd21?auto=format&w=800&q=80', 'Diffuser', 45, true],
      ['Soy candle trio — travel', 'candles-trio', '45h total burn · gift box.', 175000, 'photo-1517487869992-e0cae4ccf77b?auto=format&w=800&q=80', 'Candles', 30, true],
      ['Room spray — neroli sky 100ml', 'spray-neroli', 'Fabric-safe · fine mist.', 62000, 'photo-1541643600918-0a89b13da7a2?auto=format&w=800&q=80', 'Spray', 38, false],
      ['Reed refill 200ml', 'reed-refill', 'Same scent line only.', 42000, 'photo-1595425978871-199f1d8b23b4?auto=format&w=800&q=80', 'Refill', 50, true],
    ],
  ],
]

let seq = 0
const lines = []
for (const [slug, items] of catalog) {
  for (const row of items) {
    seq++
    const [title, pslug, desc, price, _legacyPhoto, alt, inv, feat, compare] = [...row, , ,]
    const invStr = inv === -1 ? '-1' : String(inv)
    const featStr = feat === false ? 'false' : 'true'
    let extra = ''
    if (compare) extra += `, compare_price: ${compare}`
    lines.push(
      `  demoProduct(${seq}, '${slug}', { title: '${title.replace(/'/g, "\\'")}', slug: '${pslug}', description: '${desc.replace(/'/g, "\\'")}', price: ${price}, ${iu(seq, alt)}, inventory: ${invStr}, is_available: true, is_featured: ${featStr}${extra} }),`
    )
  }
}

const out = lines.join('\n') + '\n'
const outPath = path.join(__dirname, '..', 'gen-products.raw.txt')
fs.writeFileSync(outPath, out, 'utf8')
console.error('Wrote', seq, 'lines to', outPath)
