/**
 * One-shot: creates 3 throwaway Auth users via public signup (same as Tools page).
 * With email confirmation OFF in Supabase, response is 200 with a session; we only log user id.
 * Run: node scripts/seed-demo-auth-http.mjs [anon_jwt]
 * Does NOT insert products (needs super-admin session — use Admin → Tools in browser).
 */
const url =
  process.env.SUPABASE_URL || 'https://rbqidaiyxooxdaresxjj.supabase.co'
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.argv[2] ||
  ''

if (!anonKey.trim()) {
  console.error('Pass anon JWT as argv[2] or set SUPABASE_ANON_KEY')
  process.exit(1)
}

const pwd = 'LocalHub-Demo1!'
const tag = crypto.randomUUID().replace(/-/g, '').slice(0, 10)

for (let i = 1; i <= 3; i++) {
  const email = `lh_cli_${tag}_${i}@example.com`
  const body = JSON.stringify({
    email,
    password: pwd,
    data: { full_name: `LH CLI demo shopper ${i}` },
  })
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body,
    })
    const txt = await r.text()
    let summary = ''
    try {
      const j = JSON.parse(txt)
      if (r.ok && j.user?.id) summary = `user_id=${j.user.id}`
      else if (j.msg) summary = j.msg
      else if (j.error_description) summary = j.error_description
      else summary = r.ok ? 'ok' : txt.slice(0, 120)
    } catch {
      summary = txt.slice(0, 120)
    }
    console.log(email, '->', r.status, summary)
    if (i < 3) await new Promise((r) => setTimeout(r, 1500))
  } catch (e) {
    console.error(email, '->', e.message)
  }
}

console.log('\nPassword for all:', pwd)
