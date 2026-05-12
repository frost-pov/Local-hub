/**
 * payout — vendor B2C payouts (Phase 3).
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async () => {
  return new Response(
    JSON.stringify({ ok: false, error: 'payout stub — implement B2C + safety checks' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  )
})
