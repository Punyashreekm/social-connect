import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase-from-request"

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; commentId: string }> }
) {
  const auth = await requireAuth(request)
  if ("error" in auth) return auth.error

  const { supabase, user } = auth
  const { id: postId, commentId } = await ctx.params

  const { data: comment } = await supabase
    .from("comments")
    .select("id, author_id, post_id")
    .eq("id", commentId)
    .eq("post_id", postId)
    .maybeSingle()

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }
  if (comment.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabase.from("comments").delete().eq("id", commentId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
