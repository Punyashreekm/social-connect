import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase-from-request"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, email, username, first_name, last_name, bio, avatar_url, website, location, follower_count, following_count, posts_count, created_at"
    )
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  return NextResponse.json({
    profile,
    authEmail: user.email ?? null,
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const allowed = [
    "first_name",
    "last_name",
    "bio",
    "avatar_url",
    "website",
    "location",
  ] as const
  const patch: Record<string, string | null> = {}
  for (const key of allowed) {
    if (key in body) {
      const v = body[key]
      patch[key] = typeof v === "string" ? v.trim() || null : v == null ? null : String(v)
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 })
  }

  const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ profile: data })
}
