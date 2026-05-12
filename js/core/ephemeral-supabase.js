/**
 * Separate Supabase client for throwaway Auth calls (signUp / etc.) without
 * touching the main app's persisted session in localStorage.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getSupabaseConfig } from './config.js'

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

export function createEphemeralSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig()
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: memoryStorage,
    },
  })
}
