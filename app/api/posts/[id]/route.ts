import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase-from-request"

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

  const { supabase, user } = auth
  const { id: postId } = await ctx.params

  const { data: row, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      content,
      image_url,
      comment_count,
      created_at,
      author_id,
      profiles ( id, username, first_name, last_name, avatar_url )
    `
    )
    .eq("id", postId)
    .eq("is_active", true)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  if (!row) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const typed = row as typeof row & {
    profiles: ProfileRow | ProfileRow[] | null
  }

  const { data: likeRows } = await supabase.from("likes").select("user_id").eq("post_id", postId)

  let like_count = 0
  let liked_by_me = false
  for (const l of likeRows ?? []) {
    like_count += 1
    if (l.user_id === user.id) liked_by_me = true
  }

  const { count: commentCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)

  const { data: followRow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", typed.author_id)
    .maybeSingle()

  const prof = Array.isArray(typed.profiles) ? typed.profiles[0] : typed.profiles
  const author = prof ?? {
    id: typed.author_id,
    username: "unknown",
    first_name: null,
    last_name: null,
    avatar_url: null,
  }

  return NextResponse.json({
    post: {
      id: typed.id,
      content: typed.content,
      image_url: typed.image_url,
      like_count,
      comment_count: commentCount ?? 0,
      created_at: typed.created_at,
      author_id: typed.author_id,
      author,
      liked_by_me,
      author_followed_by_me: !!followRow,
    },
  })
}
