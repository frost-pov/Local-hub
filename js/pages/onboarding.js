/**
 * onboarding.html — vendor applies: sign up, then insert vendors row.
 */
import { supabase } from '../core/supabase.js'
import { slugify, showToast } from '../core/utils.js'
import { loadInto } from '../ui/components.js'

const state = { step: 1 }

function showStep(n) {
  state.step = n
  document.querySelectorAll('[data-step]').forEach((el) => {
    el.hidden = el.getAttribute('data-step') !== String(n)
  })
}

function contractTemplate(rate = 10) {
  return `
    <p><strong>Commission:</strong> ${rate}% of each completed order is retained by the platform before payout.</p>
    <p><strong>Payments:</strong> Customers pay through the platform M-Pesa flow only. You agree not to bypass the platform for orders placed here.</p>
    <p><strong>Payouts:</strong> Net earnings are paid on the weekly cycle configured by the platform.</p>
    <p><strong>Quality:</strong> You are responsible for accurate listings and fulfillment. Misrepresentation may affect payouts.</p>
    <p><strong>Enforcement:</strong> The platform may suspend accounts or remove listings that violate policies.</p>
  `
}

async function bootContract(rate) {
  const el = document.getElementById('contract-body')
  if (el) el.innerHTML = contractTemplate(rate)
}

export async function bootOnboarding() {
  await loadInto('#nav-slot', '/partials/nav.html')
  await loadInto('#footer-slot', '/partials/footer.html')

  const { data: rateRow } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'default_commission_rate')
    .maybeSingle()
  const rate = parseFloat(rateRow?.value || '10') || 10
  await bootContract(rate)

  document.getElementById('store_name')?.addEventListener('input', (e) => {
    const s = slugify(e.target.value)
    const out = document.getElementById('store_slug')
    if (out) out.value = s
  })

  document.getElementById('to-step-2')?.addEventListener('click', () => showStep(2))
  document.getElementById('back-1')?.addEventListener('click', () => showStep(1))
  document.getElementById('to-step-3')?.addEventListener('click', () => showStep(3))
  document.getElementById('back-2')?.addEventListener('click', () => showStep(2))
  document.getElementById('to-step-4')?.addEventListener('click', () => showStep(4))
  document.getElementById('back-3')?.addEventListener('click', () => showStep(3))

  document.getElementById('apply-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (state.step !== 4) return

    const email = document.getElementById('acc_email')?.value?.trim()
    const password = document.getElementById('acc_password')?.value || ''
    const full_name = document.getElementById('acc_name')?.value?.trim()
    const phone = document.getElementById('acc_phone')?.value?.trim()

    const name = document.getElementById('store_name')?.value?.trim()
    const slug = document.getElementById('store_slug')?.value?.trim()
    const category = document.getElementById('store_category')?.value?.trim()
    const area = document.getElementById('store_area')?.value?.trim()
    const whatsapp = document.getElementById('store_whatsapp')?.value?.trim()
    const address = document.getElementById('store_address')?.value?.trim()

    const contract_name = document.getElementById('contract_sign')?.value?.trim()
    const contract_ok = document.getElementById('contract_agree')?.checked

    if (!email || !password || password.length < 6) {
      showToast('Use a valid email and password (6+ chars)')
      return
    }
    if (!name || !slug || !category) {
      showToast('Store name, slug, and category are required')
      return
    }
    if (!contract_ok || !contract_name) {
      showToast('Sign the agreement to continue')
      return
    }

    const { data: signUpData, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, phone } },
    })
    if (signErr || !signUpData.user) {
      console.error(signErr)
      showToast(signErr?.message || 'Sign up failed')
      return
    }

    const userId = signUpData.user.id

    if (full_name || phone) {
      await supabase.from('profiles').update({
        full_name: full_name || null,
        phone: phone || null,
      }).eq('id', userId)
    }

    const { error: vErr } = await supabase.from('vendors').insert({
      owner_id: userId,
      slug,
      name,
      tagline: null,
      description: null,
      story: null,
      category,
      area,
      address,
      whatsapp,
      commission_rate: rate,
      contract_signed: true,
      contract_signed_at: new Date().toISOString(),
      contract_name,
      is_approved: false,
    })

    if (vErr) {
      console.error(vErr)
      showToast('Vendor profile not saved: ' + (vErr.message || 'error'))
      return
    }

    showToast('Application received')
    showStep(5)
  })

  showStep(1)
}
