"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Trash2, ArrowLeft } from "lucide-react"
import { formatTimeAgo } from "@/lib/time"
import { apiFetch } from "@/lib/api-client"
import { supabase } from "@/lib/supabase"
import type { FeedAuthor, FeedPost } from "@/components/post/PostCard"

type CommentRow = {
  id: string
  content: string
  created_at: string
  author_id: string
  author: FeedAuthor
}

function displayName(author: FeedAuthor) {
  const n = [author.first_name, author.last_name].filter(Boolean).join(" ").trim()
  return n || author.username
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<FeedPost | null>(null)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setError("")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.replace("/login")
      return
    }
    setUserId(session.user.id)

    const [pr, cr] = await Promise.all([
      apiFetch(`/api/posts/${postId}`),
      apiFetch(`/api/posts/${postId}/comments`),
    ])

    if (pr.status === 401) {
      router.replace("/login")
      return
    }
    if (!pr.ok) {
      const j = await pr.json().catch(() => ({}))
      setError(j.error || "Could not load post")
      setLoading(false)
      return
    }
    const pj = await pr.json()
    setPost(pj.post)

    if (cr.ok) {
      const cj = await cr.json()
      setComments(cj.comments ?? [])
    }

    setLoading(false)
  }, [postId, router])

  useEffect(() => {
    load()
  }, [load])

  const toggleLike = async () => {
    if (!post || !userId) return
    const method = post.liked_by_me ? "DELETE" : "POST"
    const res = await apiFetch(`/api/posts/${post.id}/like`, { method })
    if (!res.ok) return
    const pr = await apiFetch(`/api/posts/${postId}`)
    if (pr.ok) {
      const pj = await pr.json()
      setPost(pj.post)
    }
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = commentText.trim()
    if (!t || t.length > 500) return
    setSubmitting(true)
    setError("")
    try {
      const res = await apiFetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: t }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j.error || "Could not post comment")
        return
      }
      setCommentText("")
      setComments((c) => [...c, j.comment])
      setPost((p) => (p ? { ...p, comment_count: p.comment_count + 1 } : null))
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (commentId: string) => {
    const res = await apiFetch(`/api/posts/${postId}/comments/${commentId}`, { method: "DELETE" })
    if (!res.ok) return
    setComments((c) => c.filter((x) => x.id !== commentId))
    setPost((p) => (p ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : null))
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm max-w-xl mx-auto px-4">Loading…</div>
    )
  }

  if (error && !post) {
    return (
      <div className="py-16 text-center max-w-xl mx-auto px-4 space-y-4">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to feed</Link>
        </Button>
      </div>
    )
  }

  if (!post) return null

  const author = post.author

  return (
    <div className="py-4 sm:px-4 max-w-xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="shrink-0">
            <AvatarImage src={author.avatar_url ?? undefined} />
            <AvatarFallback>{author.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{displayName(author)}</p>
            <p className="text-xs text-muted-foreground">
              @{author.username} · {formatTimeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <p className="text-sm whitespace-pre-wrap mb-4">{post.content}</p>
        {post.image_url && (
          <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4 border bg-muted">
            <img src={post.image_url} alt="" className="object-cover w-full h-full" />
          </div>
        )}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${post.liked_by_me ? "text-red-500" : ""}`}
            onClick={toggleLike}
            disabled={!userId}
          >
            <Heart className={`h-5 w-5 ${post.liked_by_me ? "fill-current" : ""}`} />
            {post.like_count}
          </Button>
          <span className="text-sm text-muted-foreground">{post.comment_count} comments</span>
        </div>
      </Card>

      <Card className="p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-sm">Comments</h2>
        <form onSubmit={submitComment} className="space-y-2">
          <Textarea
            placeholder="Write a comment…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={500}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{commentText.length}/500</span>
            <Button type="submit" size="sm" disabled={submitting || !commentText.trim()}>
              {submitting ? "Posting…" : "Comment"}
            </Button>
          </div>
        </form>

        <ul className="space-y-3 pt-2 border-t">
          {comments.length === 0 && <li className="text-sm text-muted-foreground py-4">No comments yet.</li>}
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 text-sm">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={c.author.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{c.author.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{displayName(c.author)}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(c.created_at)}</span>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap mt-0.5">{c.content}</p>
                {userId === c.author_id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 mt-1 text-destructive"
                    onClick={() => deleteComment(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
