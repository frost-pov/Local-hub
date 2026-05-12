/**
 * Single Supabase client for the whole browser app.
 * All pages import this module so sessions stay consistent.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getSupabaseConfig } from './config.js'

const { url, anonKey } = getSupabaseConfig()
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
