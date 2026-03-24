import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { usernameFromEmailAndUserId } from "@/lib/username"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; first_name?: string; last_name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim()
  const password = body.password
  const first_name = body.first_name?.trim() || null
  const last_name = body.last_name?.trim() || null

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  const anonClient = createClient(url, anon)
  const { data, error: signErr } = await anonClient.auth.signUp({ email, password })
  if (signErr) {
    return NextResponse.json({ error: signErr.message }, { status: 400 })
  }
  if (!data.user) {
    return NextResponse.json({ error: "Sign up failed" }, { status: 400 })
  }

  const session = data.session
  if (!session?.access_token) {
    return NextResponse.json({
      needsEmailConfirmation: true,
      user: { id: data.user.id, email: data.user.email },
    })
  }

  const authed = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  })

  const username = usernameFromEmailAndUserId(email, data.user.id)
  const { error: profileErr } = await authed.from("profiles").insert({
    id: data.user.id,
    email,
    username,
    first_name,
    last_name,
  })

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 400 })
  }

  return NextResponse.json({
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      token_type: session.token_type,
    },
    user: { id: data.user.id, email: data.user.email },
  })
}
