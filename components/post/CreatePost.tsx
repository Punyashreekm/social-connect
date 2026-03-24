"use client"

import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, X } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { POST_IMAGE_MAX_BYTES, uploadPostImage, validatePostImageFile } from "@/lib/storage-post-image"

type Me = {
  first_name: string | null
  last_name: string | null
  username: string
  avatar_url: string | null
} | null

function meLabel(me: Me) {
  if (!me) return "Me"
  const n = [me.first_name, me.last_name].filter(Boolean).join(" ").trim()
  return n.slice(0, 2).toUpperCase() || me.username.slice(0, 2).toUpperCase()
}

const MAX_CHARS = 280

export default function CreatePost({
  me,
  userId,
  onPosted,
}: {
  me: Me
  userId: string | null
  onPosted?: () => void
}) {
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    const msg = validatePostImageFile(f)
    if (msg) {
      setError(msg)
      return
    }
    setError("")
    setFile(f)
  }

  const clearImage = () => {
    setFile(null)
    setPreviewUrl(null)
  }

  const canSubmit =
    userId != null && (content.trim().length > 0 || file != null) && content.length <= MAX_CHARS && !loading

  const submit = async () => {
    if (!userId || !canSubmit) return
    setLoading(true)
    setError("")
    try {
      let image_url: string | null = null
      if (file) {
        const up = await uploadPostImage(userId, file)
        if ("error" in up) {
          setError(up.error)
          return
        }
        image_url = up.publicUrl
      }

      const res = await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          image_url,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Could not post")
        return
      }
      setContent("")
      clearImage()
      onPosted?.()
    } finally {
      setLoading(false)
    }
  }

  const remaining = MAX_CHARS - content.length

  return (
    <Card className="p-4 rounded-none sm:rounded-xl border-x-0 sm:border mb-4 shadow-sm bg-background">
      <div className="flex gap-4">
        <Avatar className="mt-1 w-10 h-10 shrink-0">
          <AvatarImage src={me?.avatar_url ?? undefined} />
          <AvatarFallback>{meLabel(me)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 min-w-0">
          <Textarea
            placeholder="What's happening?"
            value={content}
            maxLength={MAX_CHARS}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] text-lg resize-none border-0 focus-visible:ring-0 px-0 shadow-none bg-transparent"
            aria-label="Post text"
          />
          <div className="flex justify-end text-xs tabular-nums">
            <span className={remaining < 20 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
              {content.length}/{MAX_CHARS}
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={onPickFile}
          />

          {previewUrl && (
            <div className="relative rounded-lg overflow-hidden border bg-muted max-h-56 w-full">
              <img src={previewUrl} alt="" className="w-full max-h-56 object-contain" />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                onClick={clearImage}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap items-center justify-between pt-3 border-t gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-blue-500 rounded-full hover:bg-blue-50 h-9 w-9"
                disabled={!userId || loading}
                onClick={() => inputRef.current?.click()}
                aria-label="Add image (JPEG or PNG, max 2MB)"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <span className="hidden sm:inline">JPEG/PNG · max {(POST_IMAGE_MAX_BYTES / (1024 * 1024)).toFixed(0)}MB · one image</span>
            </div>
            <Button className="rounded-full px-6 font-bold" disabled={!canSubmit} onClick={submit}>
              {loading ? "Saving…" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
