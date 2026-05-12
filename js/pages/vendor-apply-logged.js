/**
 * apply-vendor.html — logged-in user queues vendor_application.
 */
import { supabase } from '../core/supabase.js'
import { slugify, showToast } from '../core/utils.js'
import { loadInto } from '../ui/components.js'
import { resolveAppPath } from '../core/paths.js'
import {
  fetchDefaultCommissionRate,
  isVendorApplicationDuplicateError,
  readVendorQuestionnaireDom,
  submitVendorApplication,
} from './vendor-apply-shared.js'

const LOGIN = resolveAppPath('auth/login.html')
const THANK_YOU_STEP = '4'

const state = { step: 1 }

function showStep(n) {
  state.step = Number(n)
  document.querySelectorAll('[data-step]').forEach((el) => {
    el.hidden = el.getAttribute('data-step') !== String(n)
  })
}

function wireSlugAutofill() {
  document.getElementById('store_name')?.addEventListener('input', (e) => {
    const s = slugify(e.target.value)
    const out = document.getElementById('store_slug')
    if (out && !out.dataset.touched) out.value = s
  })
  document.getElementById('store_slug')?.addEventListener('input', () => {
    const out = document.getElementById('store_slug')
    if (out) out.dataset.touched = '1'
  })
}

function contractTemplate(rate = 10) {
  return `
    <p><strong>Commission:</strong> ${rate}% of each completed order is retained by the platform before payout.</p>
    <p><strong>Payments:</strong> Customers pay through the platform M-Pesa flow only.</p>
    <p><strong>Payouts:</strong> Net earnings follow the weekly platform cycle.</p>
    <p><strong>Enforcement:</strong> The platform may suspend accounts or listings that violate policies.</p>
  `
}

  const applyReturn = `${LOGIN}?next=${encodeURIComponent(
    resolveAppPath('apply-vendor.html')
  )}`

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    window.location.href = applyReturn
    return
  }

  await loadInto('#nav-slot', '/partials/nav.html')
  await loadInto('#footer-slot', '/partials/footer.html')

  const rate = await fetchDefaultCommissionRate()
  const el = document.getElementById('contract-body')
  if (el) el.innerHTML = contractTemplate(rate)
  wireSlugAutofill()

  document.getElementById('apply-s1-next')?.addEventListener('click', () =>
    showStep(2)
  )
  document.getElementById('apply-s2-back')?.addEventListener('click', () =>
    showStep(1)
  )
  document.getElementById('apply-s2-next')?.addEventListener('click', () =>
    showStep(3)
  )
  document.getElementById('apply-s3-back')?.addEventListener('click', () =>
    showStep(2)
  )

  document
    .getElementById('apply-logged-form')
    ?.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (state.step !== 3) return

      const { err, payload } = readVendorQuestionnaireDom()
      if (err?.length || !payload) {
        showToast(err[0] || 'Fill required fields')
        return
      }

      const slug = slugify(payload.slug || '')
      if (!slug) {
        showToast('URL slug is required')
        return
      }
      payload.slug = slug

      const { error } = await submitVendorApplication(user.id, payload, rate)
      if (error) {
        console.error(error)
        if (isVendorApplicationDuplicateError(error)) {
          showToast('You already have a pending seller application.')
        } else {
          showToast(
            'Submit failed: ' + (error.message || error.code || 'error')
          )
        }
        return
      }

      showToast('Application submitted for review.')
      showStep(THANK_YOU_STEP)
    })

  showStep(1)
}
