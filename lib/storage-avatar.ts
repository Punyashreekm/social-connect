import { supabase } from "@/lib/supabase"
import { POST_IMAGES_BUCKET } from "@/lib/storage-post-image"

/**
 * Profile photos use the same bucket as post images by default (e.g. `social images`),
 * so one bucket + one set of Storage policies is enough. Override with
 * NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET if you want a dedicated avatars bucket.
 */
export const AVATARS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET?.trim() || POST_IMAGES_BUCKET

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png"] as const

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_TYPES)[number])) {
    return "Use a JPEG or PNG image."
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Image must be 2MB or smaller."
  }
  return null
}

function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  return "bin"
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  const v = validateAvatarFile(file)
  if (v) return { error: v }

  const path = `${userId}/${crypto.randomUUID()}.${extForMime(file.type)}`
  const { error: upErr } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  })

  if (upErr) {
    return { error: upErr.message }
  }

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}

export function isAllowedAvatarPublicUrl(imageUrl: string, supabaseUrl: string): boolean {
  const base = supabaseUrl.replace(/\/$/, "")
  const rawSeg = AVATARS_BUCKET
  const encSeg = encodeURIComponent(AVATARS_BUCKET)
  const prefixes = [
    `${base}/storage/v1/object/public/${rawSeg}/`,
    `${base}/storage/v1/object/public/${encSeg}/`,
  ]
  return prefixes.some((p) => imageUrl.startsWith(p))
}
