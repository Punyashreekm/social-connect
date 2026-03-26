import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase-from-request"

const COMMENT_MAX_LEN = 500

type ProfileRow = {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase } = auth
  const { id: postId } = await ctx.params

  const { data: post } = await supabase.from("posts").select("id").eq("id", postId).eq("is_active", true).maybeSingle()
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const { data: rows, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      author_id,
      profiles ( id, username, first_name, last_name, avatar_url )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const comments = (rows ?? []).map((row) => {
    const r = row as typeof row & { profiles: ProfileRow | ProfileRow[] | null }
    const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    const author = prof ?? {
      id: r.author_id,
      username: "unknown",
      first_name: null,
      last_name: null,
      avatar_url: null,
    }
    return {
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      author_id: r.author_id,
      author,
    }
  })

  return NextResponse.json({ comments })
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth
  const { id: postId } = await ctx.params

  const { data: post } = await supabase.from("posts").select("id").eq("id", postId).eq("is_active", true).maybeSingle()
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  let body: { content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content.trim() : ""
  if (!content || content.length > COMMENT_MAX_LEN) {
    return NextResponse.json({ error: `Comment required, max ${COMMENT_MAX_LEN} characters` }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      content,
    })
    .select(
      `
      id,
      content,
      created_at,
      author_id,
      profiles ( id, username, first_name, last_name, avatar_url )
    `
    )
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const r = data as typeof data & { profiles: ProfileRow | ProfileRow[] | null }
  const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
  const author = prof ?? {
    id: user.id,
    username: "",
    first_name: null,
    last_name: null,
    avatar_url: null,
  }

  return NextResponse.json({
    comment: {
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      author_id: r.author_id,
      author,
    },
  })
}
