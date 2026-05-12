/**
 * onboarding.html — sign up then queue vendor_application (pending admin approval).
 */
import { supabase } from '../core/supabase.js'
import { slugify, showToast } from '../core/utils.js'
import { loadInto } from '../ui/components.js'
import {
  fetchDefaultCommissionRate,
  isVendorApplicationDuplicateError,
  readVendorQuestionnaireDom,
  submitVendorApplication,
} from './vendor-apply-shared.js'

const state = { step: 1, maxThankYou: 5 }

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

function wireSlugAutofill() {
  document.getElementById('store_name')?.addEventListener('input', (e) => {
    const s = slugify(e.target.value)
    const out = document.getElementById('store_slug')
    if (out) out.value = s
  })
}

function wireStepButtons() {
  document.getElementById('to-step-2')?.addEventListener('click', () => showStep(2))
  document.getElementById('back-1')?.addEventListener('click', () => showStep(1))
  document.getElementById('to-step-3')?.addEventListener('click', () => showStep(3))
  document.getElementById('back-2')?.addEventListener('click', () => showStep(2))
  document.getElementById('to-step-4')?.addEventListener('click', () => showStep(4))
  document.getElementById('back-3')?.addEventListener('click', () => showStep(3))
}

export async function bootOnboarding() {
  await loadInto('#nav-slot', '/partials/nav.html')
  await loadInto('#footer-slot', '/partials/footer.html')

  const rate = await fetchDefaultCommissionRate()
  await bootContract(rate)
  wireSlugAutofill()
  wireStepButtons()

  document.getElementById('apply-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (state.step !== 4) return

    const email = document.getElementById('acc_email')?.value?.trim()
    const password = document.getElementById('acc_password')?.value || ''
    const full_name = document.getElementById('acc_name')?.value?.trim()
    const phone = document.getElementById('acc_phone')?.value?.trim()

    const { err, payload } = readVendorQuestionnaireDom()

    if (!email || !password || password.length < 6) {
      showToast('Use a valid email and password (6+ chars)')
      return
    }
    if (err?.length || !payload) {
      showToast(err[0] || 'Fill all required seller fields')
      return
    }

    const slug = slugify(payload.slug || '')
    if (!slug) {
      showToast('URL slug is required')
      return
    }
    payload.slug = slug

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
      await supabase
        .from('profiles')
        .update({
          full_name: full_name || null,
          phone: phone || null,
        })
        .eq('id', userId)
    }

    const { error } = await submitVendorApplication(userId, payload, rate)
    if (error) {
      console.error(error)
      if (isVendorApplicationDuplicateError(error)) {
        showToast('You already have a pending application.')
      } else {
        showToast('Application failed: ' + (error.message || error.code || 'error'))
      }
      return
    }

    showToast('Application queued for review.')
    showStep(state.maxThankYou)
  })

  showStep(1)
}
