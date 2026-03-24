import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function supabaseWithJwt(jwt: string): SupabaseClient {
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
}

/** Parse Bearer token from request. */
export function getBearerToken(request: NextRequest): string | null {
  const h = request.headers.get("authorization")
  if (!h?.startsWith("Bearer ")) return null
  return h.slice(7).trim() || null
}

export async function requireAuth(request: NextRequest) {
  const token = getBearerToken(request)
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  const supabase = supabaseWithJwt(token)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { supabase, user, token }
}
