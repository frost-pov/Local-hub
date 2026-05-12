/**
 * Shared vendor questionnaire → vendor_applications row (RLS-safe for applicants).
 */
import { supabase } from '../core/supabase.js'

export async function fetchDefaultCommissionRate() {
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'default_commission_rate')
    .maybeSingle()
  return parseFloat(data?.value || '10') || 10
}

/** True when unique constraint rejects a second pending row. */
export function isVendorApplicationDuplicateError(error) {
  const m = error?.message || ''
  const c = error?.code || ''
  return c === '23505' || /vendor_applications_one_pending/i.test(m)
}

export function readVendorQuestionnaireDom() {
  const err = []

  const name = document.getElementById('store_name')?.value?.trim()
  const slugRaw = document.getElementById('store_slug')?.value?.trim()
  const category = document.getElementById('store_category')?.value?.trim()
  const area = document.getElementById('store_area')?.value?.trim() || null
  const whatsapp =
    document.getElementById('store_whatsapp')?.value?.trim() || null
  const address =
    document.getElementById('store_address')?.value?.trim() || null
  const tagline =
    document.getElementById('store_tagline')?.value?.trim() || null
  const description =
    document.getElementById('store_description')?.value?.trim() || null
  const story = document.getElementById('store_story')?.value?.trim() || null

  const logo_url =
    document.getElementById('store_logo_url')?.value?.trim() || null
  const banner_url =
    document.getElementById('store_banner_url')?.value?.trim() || null
  const website_url =
    document.getElementById('store_website_url')?.value?.trim() || null
  const payout_phone =
    document.getElementById('store_payout_phone')?.value?.trim() || null

  const applicant_notes =
    document.getElementById('store_applicant_notes')?.value?.trim() || null

  const contract_name =
    document.getElementById('contract_sign')?.value?.trim()
  const contract_ok = document.getElementById('contract_agree')?.checked

  if (!name) err.push('Store name required')
  if (!slugRaw) err.push('URL slug required')
  if (!category) err.push('Category required')
  if (!contract_ok || !contract_name) err.push('Sign the agreement')

  const allowedCat = ['fashion', 'groceries', 'services', 'household']
  if (category && !allowedCat.includes(category))
    err.push('Pick an allowed category')

  return {
    err,
    payload: err.length
      ? null
      : {
          slug: slugRaw,
          name,
          tagline,
          description,
          story,
          category,
          area,
          address,
          whatsapp,
          hours: {},
          logo_url,
          banner_url,
          website_url,
          payout_phone,
          applicant_notes,
          contract_name,
        },
  }
}

/**
 * Insert queue row. `commission_rate` optional (defaults from settings).
 */
export async function submitVendorApplication(
  applicantId,
  payload,
  commissionRate
) {
  const iso = new Date().toISOString()
  const { error } = await supabase.from('vendor_applications').insert({
    applicant_id: applicantId,
    status: 'pending',
    slug: payload.slug,
    name: payload.name,
    tagline: payload.tagline,
    description: payload.description,
    story: payload.story,
    category: payload.category,
    area: payload.area,
    address: payload.address,
    whatsapp: payload.whatsapp,
    hours: payload.hours || {},
    logo_url: payload.logo_url,
    banner_url: payload.banner_url,
    website_url: payload.website_url,
    payout_phone: payload.payout_phone,
    commission_rate: commissionRate,
    contract_name: payload.contract_name,
    contract_signed_at: iso,
    applicant_notes: payload.applicant_notes,
  })
  return { error }
}

