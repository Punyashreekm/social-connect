import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase-from-request"

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth
  const { id: postId } = await ctx.params

  const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: user.id })
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data: post } = await supabase.from("posts").select("like_count").eq("id", postId).single()
  return NextResponse.json({ ok: true, like_count: post?.like_count ?? null })
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(_request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth
  const { id: postId } = await ctx.params

  const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data: post } = await supabase.from("posts").select("like_count").eq("id", postId).single()
  return NextResponse.json({ ok: true, like_count: post?.like_count ?? null })
}
