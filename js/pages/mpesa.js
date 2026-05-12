/**
 * M-Pesa: STK push goes through a Supabase Edge Function (service role).
 * This frontend helper only calls the function + polls order status.
 */
import { supabase } from '../core/supabase.js'

export async function initiateStkPush({ phone, amountCents, orderId }) {
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase.functions.invoke('mpesa-stk', {
    body: { phone, amount: amountCents, orderId },
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {},
  })
  if (error) throw error
  return data
}

export async function pollOrderUntilPaid(orderId, { intervalMs = 3000, maxMs = 120000 } = {}) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const t = setInterval(async () => {
      if (Date.now() - started > maxMs) {
        clearInterval(t)
        reject(new Error('Payment timed out'))
        return
      }
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()
      if (data?.status === 'paid') {
        clearInterval(t)
        resolve(data)
      }
      if (data?.status === 'cancelled') {
        clearInterval(t)
        reject(new Error('Order cancelled'))
      }
    }, intervalMs)
  })
}
