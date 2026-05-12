/**
 * mpesa-stk — initiate Safaricom STK Push (implement per CONTEXT.md §9).
 * Deploy: supabase functions deploy mpesa-stk --no-verify-jwt (or protect with JWT).
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }
  // TODO: Parse JSON body, call Daraja, insert mpesa_transactions with service role.
  return new Response(
    JSON.stringify({ ok: false, error: 'mpesa-stk stub — implement Daraja call + secrets' }),
    { status: 501, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  )
})
