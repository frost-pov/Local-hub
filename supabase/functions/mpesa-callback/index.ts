/**
 * mpesa-callback — Safaricom webhook (implement per CONTEXT.md §9).
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  // TODO: Verify callback, update mpesa_transactions + orders.status = paid
  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'stub' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
