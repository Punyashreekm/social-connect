import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase-from-request"
import { isAllowedPostImagePublicUrl } from "@/lib/storage-post-image"

type ProfileRow = {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth

  const { data: rows, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      content,
      image_url,
      like_count,
      comment_count,
      created_at,
      author_id,
      profiles ( id, username, first_name, last_name, avatar_url )
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const posts = (rows ?? []) as Array<{
    id: string
    content: string
    image_url: string | null
    like_count: number
    comment_count: number
    created_at: string
    author_id: string
    profiles: ProfileRow | ProfileRow[] | null
  }>

  const postIds = posts.map((p) => p.id)
  const authorIds = [...new Set(posts.map((p) => p.author_id))]

  const likeCountByPost = new Map<string, number>()
  let likedSet = new Set<string>()

  if (postIds.length > 0) {
    const { data: likeRows } = await supabase
      .from("likes")
      .select("post_id, user_id")
      .in("post_id", postIds)

    for (const row of likeRows ?? []) {
      const pid = row.post_id as string
      likeCountByPost.set(pid, (likeCountByPost.get(pid) ?? 0) + 1)
      if (row.user_id === user.id) {
        likedSet.add(pid)
      }
    }
  }

  const commentCountByPost = new Map<string, number>()
  if (postIds.length > 0) {
    const { data: commentRows } = await supabase.from("comments").select("post_id").in("post_id", postIds)
    for (const row of commentRows ?? []) {
      const pid = row.post_id as string
      commentCountByPost.set(pid, (commentCountByPost.get(pid) ?? 0) + 1)
    }
  }

  let followingSet = new Set<string>()

  if (authorIds.length > 0) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .in("following_id", authorIds)
    followingSet = new Set((follows ?? []).map((f) => f.following_id as string))
  }

  const out = posts.map((row) => {
    const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const author = prof ?? {
      id: row.author_id,
      username: "unknown",
      first_name: null,
      last_name: null,
      avatar_url: null,
    }
    return {
      id: row.id,
      content: row.content,
      image_url: row.image_url,
      like_count: likeCountByPost.get(row.id) ?? 0,
      comment_count: commentCountByPost.get(row.id) ?? 0,
      created_at: row.created_at,
      author_id: row.author_id,
      author,
      liked_by_me: likedSet.has(row.id),
      author_followed_by_me: followingSet.has(row.author_id),
    }
  })

  return NextResponse.json({ posts: out })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth

  let body: { content?: string; image_url?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const raw = typeof body.content === "string" ? body.content : ""
  if (raw.length > 280) {
    return NextResponse.json({ error: "Content must be at most 280 characters" }, { status: 400 })
  }

  const content = raw.trim()
  const image_url =
    typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null

  if (!content && !image_url) {
    return NextResponse.json({ error: "Add text (up to 280 characters) and/or an image" }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  if (image_url && !isAllowedPostImagePublicUrl(image_url, baseUrl)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content,
      image_url,
    })
    .select(
      `
      id,
      content,
      image_url,
      like_count,
      comment_count,
      created_at,
      author_id,
      profiles ( id, username, first_name, last_name, avatar_url )
    `
    )
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const row = data as typeof data & {
    profiles: ProfileRow | ProfileRow[] | null
  }
  const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  const author = prof ?? {
    id: user.id,
    username: "",
    first_name: null,
    last_name: null,
    avatar_url: null,
  }

  return NextResponse.json({
    post: {
      id: row.id,
      content: row.content,
      image_url: row.image_url,
      like_count: row.like_count,
      comment_count: row.comment_count,
      created_at: row.created_at,
      author_id: row.author_id,
      author,
      liked_by_me: false,
      author_followed_by_me: false,
    },
  })
}
