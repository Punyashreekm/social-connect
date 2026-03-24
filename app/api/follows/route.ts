import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase-from-request"

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth

  let body: { following_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const following_id = body.following_id
  if (!following_id || following_id === user.id) {
    return NextResponse.json({ error: "Invalid following_id" }, { status: 400 })
  }

  const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id })
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth

  const following_id = request.nextUrl.searchParams.get("following_id")
  if (!following_id) {
    return NextResponse.json({ error: "following_id query required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", following_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
